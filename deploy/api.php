<?php
/**
 * KRTaker landing API — PHP port (cPanel, PHP 8.1)
 * Routes: /api/health, /api/register, /api/verify-otp, /api/resend-otp,
 *         /api/newsletter, /api/contact
 * DB: SQLite at /home/krtaker/krtaker_landing.db (outside webroot)
 * Mail: SMTP via mail.inceptia.io (STARTTLS + AUTH LOGIN)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

error_reporting(E_ALL);
ini_set('display_errors', '0');

define('DB_PATH', '/home/krtaker/krtaker_landing.db');
define('TRIAL_DAYS', 14);
define('ADMIN_EMAIL', 'kabir.swe@gmail.com');

$SMTP = [
    'host' => 'mail.inceptia.io',
    'port' => 587,
    'user' => 'careers@inceptia.io',
    'pass' => 'E^U9iymE0%7Fje)n',
    'from' => 'careers@inceptia.io',
];

function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec("CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, org TEXT DEFAULT '', email TEXT UNIQUE NOT NULL,
            phone TEXT DEFAULT '', role TEXT DEFAULT 'owner', plan TEXT DEFAULT 'Starter',
            status TEXT DEFAULT 'pending', trial_end TEXT, otp_hash TEXT, otp_expires TEXT,
            created_at TEXT DEFAULT (datetime('now')), verified_at TEXT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT,
            subject TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))");
        $pdo->exec("CREATE TABLE IF NOT EXISTS newsletter_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now')))");
    }
    return $pdo;
}

/* ---------- SMTP (raw socket, STARTTLS, AUTH LOGIN) ---------- */
/**
 * Read a full SMTP reply (multiline-aware): lines "NNN-text" continue
 * until a line "NNN text" (space after code). Returns the LAST line text.
 */
function smtp_read_reply($sock) {
    $last = '';
    while (($l = fgets($sock, 512)) !== false) {
        $last = trim($l);
        if (strlen($l) > 3 && $l[3] === ' ') break;   // end of multiline reply
    }
    return $last;
}

/**
 * Drain the full 220 greeting (it can be multiline: 220-line / 220 line).
 * Otherwise leftover greeting lines corrupt the EHLO reply parsing.
 */
function smtp_drain_greeting($sock) {
    $last = '';
    while (($l = fgets($sock, 512)) !== false) {
        $last = trim($l);
        if (strlen($l) > 3 && $l[3] === ' ') break;
    }
    return $last;
}

function smtp_send($to, $subject, $html, $text = null) {
    global $SMTP;
    $text = $text ?? strip_tags(str_replace(['<br>', '<br/>', '</p>', '</div>', '</li>'], "\n", $html));
    $host = $SMTP['host']; $port = $SMTP['port'];
    $sock = @stream_socket_client("tcp://$host:$port", $errno, $errstr, 20);
    if (!$sock) return false;
    stream_set_timeout($sock, 20);
    smtp_drain_greeting($sock);                    // 220 (multiline-safe)
    fwrite($sock, "EHLO krtaker.com\r\n");
    smtp_read_reply($sock);                        // 250 EHLO (multiline-safe)
    fwrite($sock, "STARTTLS\r\n");
    $r = smtp_read_reply($sock);                   // 220 ready
    if (strpos($r, '220') !== false) {
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        fwrite($sock, "EHLO krtaker.com\r\n");
        smtp_read_reply($sock);                    // 250 EHLO after TLS
    }
    fwrite($sock, "AUTH LOGIN\r\n"); $r = smtp_read_reply($sock);   // 334
    fwrite($sock, base64_encode($SMTP['user']) . "\r\n"); $r = smtp_read_reply($sock); // 334
    fwrite($sock, base64_encode($SMTP['pass']) . "\r\n"); $r = smtp_read_reply($sock); // 235
    if (strpos($r, '235') === false) { fclose($sock); return false; }
    fwrite($sock, "MAIL FROM:<{$SMTP['from']}>\r\n"); smtp_read_reply($sock);
    fwrite($sock, "RCPT TO:<$to>\r\n"); $r = smtp_read_reply($sock);
    if (strpos($r, '250') === false) { fwrite($sock, "QUIT\r\n"); fclose($sock); return false; }
    fwrite($sock, "DATA\r\n"); smtp_read_reply($sock);            // 354
    $boundary = 'kr_' . md5(uniqid('', true));
    $msg  = "From: KRTaker <{$SMTP['from']}>\r\n";
    $msg .= "To: <$to>\r\n";
    $msg .= "Subject: $subject\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n\r\n";
    $msg .= "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n$text\r\n\r\n";
    $msg .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$html\r\n\r\n";
    $msg .= "--$boundary--\r\n.\r\n";
    fwrite($sock, $msg);
    $r = smtp_read_reply($sock);                   // 250 queued
    fwrite($sock, "QUIT\r\n");
    fclose($sock);
    return strpos($r, '250') !== false;
}

function esc($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/**
 * Send via PHP mail() (host local Exim — reliable on this cPanel host,
 * MX points at the server and SPF covers the IP). Used as fallback when
 * direct SMTP to mail.inceptia.io is refused (shared-IP policy).
 */
function mail_fallback($to, $subject, $html, $text = null) {
    $text = $text ?? strip_tags(str_replace(['<br>', '<br/>', '</p>', '</div>', '</li>'], "\n", $html));
    $boundary = 'kr_' . md5(uniqid('', true));
    $from = 'KRTaker <krtaker@krtaker.com>';
    $msg  = "From: $from\r\n";
    $msg .= "To: <$to>\r\n";
    $msg .= "Subject: $subject\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n\r\n";
    $msg .= "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n$text\r\n\r\n";
    $msg .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$html\r\n\r\n";
    $msg .= "--$boundary--\r\n";
    return @mail($to, $subject, $msg, '');
}

/**
 * Send email: try direct SMTP first, fall back to PHP mail().
 */
function send_mail($to, $subject, $html, $text = null) {
    if (smtp_send($to, $subject, $html, $text)) return true;
    return mail_fallback($to, $subject, $html, $text);
}

function otp_email_html($code, $name) {
    return '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">'
        . '<h2 style="margin:0 0 6px;color:#1A2433">KRTaker — verify your email</h2>'
        . '<p style="color:#5B6B83;font-size:14px">Hi ' . esc($name) . ', your one-time verification code:</p>'
        . '<div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#2F80ED;padding:14px;background:#F6F9FE;border-radius:12px;text-align:center;margin:14px 0">' . esc($code) . '</div>'
        . '<p style="color:#8A97AB;font-size:12.5px">The code expires in 5 minutes. If you didn\'t request this, you can ignore this email.</p>'
        . '<p style="color:#8A97AB;font-size:12px;border-top:1px solid #E4EAF3;padding-top:12px">KRTaker · Key Responsibility Taker · Dhaka, Bangladesh</p></div>';
}

function welcome_email_html($name, $trial_end) {
    return '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">'
        . '<h2 style="margin:0 0 6px;color:#1A2433">Welcome to KRTaker 🎉</h2>'
        . '<p style="color:#5B6B83;font-size:14px">Hi ' . esc($name) . ', your 14-day free trial is live until <b>' . esc($trial_end) . '</b>.</p>'
        . '<p style="color:#5B6B83;font-size:14px">Next step: log in, add your first property, and let the AI caretaker take over.</p>'
        . '<p style="margin:18px 0"><a href="https://krtaker.com/login.html" style="background:#2F80ED;color:#fff;padding:12px 26px;border-radius:12px;text-decoration:none;font-weight:700">Open your workspace</a></p>'
        . '<p style="color:#8A97AB;font-size:12px">Questions? Reply to this email — we reply within 24 hours.</p></div>';
}

function contact_email_html($c) {
    return '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">'
        . '<h2 style="margin:0 0 10px;color:#1A2433">New contact message</h2>'
        . '<p style="color:#5B6B83;font-size:14px"><b>Name:</b> ' . esc($c['name'] ?? '') . '<br>'
        . '<b>Email:</b> ' . esc($c['email'] ?? '') . '<br>'
        . '<b>Phone:</b> ' . esc($c['phone'] ?? '') . '<br>'
        . '<b>Topic:</b> ' . esc($c['subject'] ?? '') . '</p>'
        . '<div style="background:#F6F9FE;border-radius:12px;padding:16px;font-size:14px;color:#1A2433;white-space:pre-wrap">' . esc($c['message'] ?? '') . '</div></div>';
}

/* ---------- router ---------- */
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$seg  = preg_replace('#^api/#', '', $path);          // api/register -> register
$action = $seg ?: 'health';
$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $action !== 'health') {
    json_out(['ok' => false, 'error' => 'POST required.'], 405);
}

switch ($action) {
case 'health':
    json_out(['ok' => true, 'service' => 'krtaker-landing', 'php' => PHP_VERSION]);

case 'register': {
    $name  = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_out(['ok' => false, 'error' => 'Invalid name or email.'], 400);
    }
    $pdo = db();
    $st = $pdo->prepare('SELECT * FROM subscribers WHERE email = ?');
    $st->execute([$email]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row && $row['status'] === 'active') {
        json_out(['ok' => false, 'error' => 'This email is already registered. Please log in.'], 409);
    }
    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otp_hash = hash('sha256', $otp);
    $expires = gmdate('Y-m-d\TH:i:s', time() + 300);
    $trial_end = gmdate('d M Y', time() + TRIAL_DAYS * 86400);
    $org = $body['org'] ?? ''; $phone = $body['phone'] ?? '';
    $role = $body['role'] ?? 'owner'; $plan = $body['plan'] ?? 'Starter';
    if ($row) {
        $st = $pdo->prepare('UPDATE subscribers SET name=?, org=?, phone=?, role=?, plan=?, otp_hash=?, otp_expires=?, status="pending" WHERE email=?');
        $st->execute([$name, $org, $phone, $role, $plan, $otp_hash, $expires, $email]);
    } else {
        $st = $pdo->prepare('INSERT INTO subscribers (name, org, email, phone, role, plan, status, trial_end, otp_hash, otp_expires) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $st->execute([$name, $org, $email, $phone, $role, $plan, 'pending', $trial_end, $otp_hash, $expires]);
    }
$ok = send_mail($email, 'Your KRTaker verification code', otp_email_html($otp, $name));
    json_out(['ok' => true, 'otp_sent' => $ok, 'trial_days' => TRIAL_DAYS]);
}

case 'verify-otp': {
    $email = strtolower(trim($body['email'] ?? ''));
    $otp   = trim($body['otp'] ?? '');
    $pdo = db();
    $st = $pdo->prepare('SELECT * FROM subscribers WHERE email = ?');
    $st->execute([$email]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) json_out(['ok' => false, 'error' => 'No registration found for this email.'], 404);
    $now = gmdate('Y-m-d\TH:i:s');
    if (!$row['otp_hash'] || $row['otp_expires'] < $now) {
        json_out(['ok' => false, 'error' => 'Code expired. Resend a new one.'], 400);
    }
    if (hash('sha256', $otp) !== $row['otp_hash']) {
        json_out(['ok' => false, 'error' => 'Invalid code.'], 400);
    }
    $trial_end = $row['trial_end'] ?: gmdate('d M Y', time() + TRIAL_DAYS * 86400);
    $st = $pdo->prepare('UPDATE subscribers SET status="active", otp_hash=NULL, verified_at=? WHERE id=?');
    $st->execute([$now, $row['id']]);
send_mail($email, 'Welcome to KRTaker 🎉', welcome_email_html($row['name'], $trial_end));
    json_out(['ok' => true, 'trial_end' => $trial_end, 'trial_days' => TRIAL_DAYS]);
}

case 'resend-otp': {
    $email = strtolower(trim($body['email'] ?? ''));
    $pdo = db();
    $st = $pdo->prepare('SELECT * FROM subscribers WHERE email = ?');
    $st->execute([$email]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) json_out(['ok' => false, 'error' => 'No registration found for this email.'], 404);
    if ($row['status'] === 'active') json_out(['ok' => false, 'error' => 'Account already verified.'], 409);
    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires = gmdate('Y-m-d\TH:i:s', time() + 300);
    $st = $pdo->prepare('UPDATE subscribers SET otp_hash=?, otp_expires=? WHERE id=?');
    $st->execute([hash('sha256', $otp), $expires, $row['id']]);
$ok = send_mail($email, 'Your KRTaker verification code', otp_email_html($otp, $row['name']));
    json_out(['ok' => true, 'otp_sent' => $ok]);
}

case 'newsletter': {
    $email = strtolower(trim($body['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['ok' => false, 'error' => 'Invalid email.'], 400);
    $pdo = db();
    try {
        $pdo->prepare('INSERT INTO newsletter_emails (email) VALUES (?)')->execute([$email]);
    } catch (PDOException $e) {
        json_out(['ok' => true, 'already' => true]);
    }
send_mail(ADMIN_EMAIL, "[KRTaker] Newsletter signup: $email",
        '<p>New newsletter subscriber: <b>' . esc($email) . '</b></p>');
    json_out(['ok' => true]);
}

case 'contact': {
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $msg  = trim($body['message'] ?? '');
    if (!$name || !$email || !$msg) json_out(['ok' => false, 'error' => 'Name, email and message are required.'], 400);
    $pdo = db();
    $st = $pdo->prepare('INSERT INTO contacts (name, email, phone, subject, message) VALUES (?,?,?,?,?)');
    $st->execute([$name, $email, $body['phone'] ?? '', $body['subject'] ?? '', $msg]);
send_mail(ADMIN_EMAIL, "[KRTaker] Contact: $name", contact_email_html($body));
    json_out(['ok' => true]);
}

default:
    json_out(['ok' => false, 'error' => 'Unknown endpoint.'], 404);
}
