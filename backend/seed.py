"""REM ERP Backend — seed data (mirrors the prototype's demo dataset)."""
import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from db import get_db, init_db

TODAY = datetime.utcnow().date()
def d(offset_days=0): return (TODAY + timedelta(days=offset_days)).isoformat()

def seed():
    init_db()
    conn = get_db()
    c = conn.cursor()

    # users (password: demo123 for all role users; admin: admin123)
    users = [
        ('Kabir Roni', 'admin@rembd.com', 'admin123', 'Super Admin', 'Management'),
        ('Hasanul Banna', 'sales@rembd.com', 'demo123', 'Sales Agent', 'Sales'),
        ('Nazma Akhter', 'finance@rembd.com', 'demo123', 'Finance', 'Finance'),
        ('Iftekhar Ahmad', 'engineer@rembd.com', 'demo123', 'Site Engineer', 'Construction'),
    ]
    for u in users:
        c.execute("INSERT INTO users(name,email,password_hash,role,dept) VALUES(?,?,?,?,?)",
                  (u[0], u[1], generate_password_hash(u[2]), u[3], u[4]))

    leads = [
        ('Tariqul Islam','+8801711000000','tariqul@example.com','Muktodhara - 5 Katha','Negotiation','High','Local','Bikroy.com',15000000,'Hasanul Banna','Today, 3:00 PM'),
        ('Dr. Rubina Ali','+14155550198','rubina.ali@yahoo.com','Jolshiri - Apt 4B','Installments','Medium','NRB','Referral',22000000,'Iftekhar Ahmad','Tomorrow, 11:00 AM'),
        ('Ahasan Habib','+8801819111111','ahasan@example.com','Muktodhara - 3 Katha','Negotiation','High','Local','Walk-in',9500000,'Hasanul Banna','Today, 5:00 PM'),
        ('Kamrul Hasan','+8801912222222','kamrul.hasan@gmail.com','Jolshiri - Apt 9A','Booking','Low','Local','PropertyBarta',18000000,'Sales Team A','—'),
        ('Fatima Begum','+8801711543210','fatima.begum@gmail.com','Jolshiri - 3 Katha','Site Visit','Medium','Local','NRB Direct',8500000,'Iftekhar Ahmad','Overdue — 3 days ago'),
        ('Mrs. Jahanara Begum','+8801712333333','jahanara@hotmail.com','Jolshiri - Apt 3C','Downpayment','Medium','Local','Referral',20000000,'Hasanul Banna','Today, 10:00 AM'),
        ('Engr. Salahuddin','+8801714555555','salahuddin@live.com','Muktodhara - Plot 22','Negotiation','Medium','Local','Real Estate Fair',5500000,'Iftekhar Ahmad','Today, 2:00 PM'),
        ('Md. Taher Uddin','+8801713444444','taher@example.com','Muktodhara - Plot 17','Contacted','Low','Local','Cold Call',4200000,'Sales Team A','Next week'),
        ('Nadia Akhter','+8801712545454','nadia.a@gmail.com','Jolshiri - 5 Katha','New Inquiry','Medium','NRB','NRB Direct',32000000,'Sales Team A','Today, 4:00 PM'),
        ('Shahidul Islam','+8801913232323','shahidul@outlook.com','Muktodhara - Plot 15','Site Visit','High','Local','Broker',18000000,'Hasanul Banna','Tomorrow, 10:00 AM'),
        ('Delwar Hossain','+8801817909090','delwar.h@yahoo.com','Muktodhara - Apt 4C','Downpayment','Medium','NRB','Broker',16000000,'Sales Team B','Sat, 12:00 PM'),
        ('Mizanur Rahman','+8801919343434','mizan.r@gmail.com','Jolshiri - 3 Katha','Site Visit','High','Local','Broker',20000000,'Hasanul Banna','Today, 5:30 PM'),
        ('Laily Akhter','+8801817121212','laily.a@gmail.com','Muktodhara Green Park - Plot 8','Booking','Low','Local','Referral',9500000,'Sales Team B','—'),
        ('Kazi Nizam','+8801715656565','kazi.n@gmail.com','Skyline Towers - Apt 12C','Booking','Medium','Local','Walk-in',75000000,'Sales Team A','—'),
        ('Rashida Begum','+8801718121212','rashida.b@email.com','Skyline - Apt 12A','Installments','Low','Local','Referral',38000000,'Sales Team A','Mon, 10:30 AM'),
    ]
    for l in leads:
        c.execute("INSERT INTO leads(name,phone,email,property,status,priority,type,source,value,owner,next_follow_up,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                  (l[0],l[1],l[2],l[3],l[4],l[5],l[6],l[7],l[8],l[9],l[10], d(-20)))

    customers = [
        ('Kamrul Hasan','01711-234567','kamrul.hasan@gmail.com','Jolshiri Abason - Apt 9A','Booking','Active',0,'Jolshiri'),
        ('Dr. Rubina Ali','01722-345678','rubina.ali@yahoo.com','Jolshiri Abason - Apt 4B','Installment','Overdue',1000000,'Jolshiri'),
        ('Tariqul Islam','01733-456789','tariq.islam@gmail.com','Muktodhara - Plot M-103','Installment','Active',0,'Muktodhara'),
        ('Engr. Salahuddin','01744-567890','salahuddin@live.com','Muktodhara - Plot 22','Booking','Overdue',1200000,'Muktodhara'),
        ('Fatima Begum','01755-678901','fatima.begum@gmail.com','Green Valley - Plot G-22','Installment','Overdue',3200000,'Green Valley'),
        ('Mrs. Jahanara Begum','01766-789012','jahanara@hotmail.com','Jolshiri Abason - Apt 3C','Owner','Overdue',12000000,'Jolshiri'),
        ('Md. Nazrul Islam','01777-890123','nazrul.islam@gmail.com','Muktodhara - Unit 201','Installment','Delinquent',1500000,'Muktodhara'),
        ('Shamima Akhter','01788-901234','shamima.akhter@yahoo.com','Muktodhara - Unit 305','Installment','Active',950000,'Muktodhara'),
        ('Abdur Rahim','01799-012345','abdur.rahim@live.com','Jolshiri Abason - Apt 5A','Booking','Active',500000,'Jolshiri'),
        ('Nurjahan Begum','01800-123456','nurjahan@gmail.com','Muktodhara - Plot 15','Owner','Active',0,'Muktodhara'),
    ]
    for cus in customers:
        c.execute("INSERT INTO customers(name,phone,email,property,type,status,dues_num,project) VALUES(?,?,?,?,?,?,?,?)", cus)

    # portal users (customer portal login; password: portal123 for all)
    for cus in customers:
        c.execute("INSERT OR IGNORE INTO portal_users(email,name,phone,password_hash) VALUES(?,?,?,?)",
                  (cus[2], cus[0], cus[1], generate_password_hash('portal123')))

    projects = [
        ('P-101','Jolshiri Abason','Purbachal','In Progress',65,6260000000,'Hasanul Banna','flat',0,70),
        ('P-102','Muktodhara','Savar','In Progress',58,7200000000,'Iftekhar Ahmad','land',40,0),
        ('P-103','Green Valley','Gazipur','Near Completion',82,3100000000,'Rofiqul Islam','land',25,0),
        ('P-104','Skyline Towers','Uttara','In Progress',47,8600000000,'Hasanul Banna','flat',0,60),
        ('P-105','Muktodhara Green Park','Savar','Planning',12,2200000000,'Iftekhar Ahmad','land',35,0),
        ('P-106','Uttara Rose Garden','Uttara','Planning',5,5400000000,'Rofiqul Islam','flat',0,70),
    ]
    for p in projects:
        c.execute("INSERT INTO projects(code,name,location,status,progress,budget,manager,type,plots,units) VALUES(?,?,?,?,?,?,?,?,?,?)", p)

    bookings = [
        ('BKG-101','Kamrul Hasan','Jolshiri Abason','Apt 9A',18000000,10000000,'Confirmed','Flat','10% down + 18 monthly','2026-03-15','Mar 15, 2026'),
        ('BKG-102','Dr. Rubina Ali','Jolshiri Abason','Apt 4B',22000000,5000000,'Pending Review','Flat','10% down + 18 monthly','2026-04-01','Apr 01, 2026'),
        ('BKG-103','Tariqul Islam','Muktodhara','Plot M-103',4600000,4600000,'Confirmed','Land','Full Payment','2026-05-10','May 10, 2026'),
        ('BKG-104','Fatima Begum','Green Valley','Plot G-22',3200000,0,'Pending Review','Land','12 monthly installments','2026-05-20','May 20, 2026'),
        ('BKG-105','Shahidul Islam','Muktodhara Green Park','Plot 15',18000000,1800000,'Confirmed','Land','10% down + 18 monthly','2026-06-01','Jun 01, 2026'),
        ('BKG-106','Mizanur Rahman','Jolshiri Abason','Plot 12',20000000,2000000,'Pending Review','Land','10% down + 18 monthly','2026-06-05','Jun 05, 2026'),
        ('BKG-107','Delwar Hossain','Muktodhara Green Park','Apt 4C',16000000,4800000,'Confirmed','Flat','30% down + 24 monthly','2026-06-08','Jun 08, 2026'),
        ('BKG-108','Laily Akhter','Muktodhara Green Park','Plot 8',9500000,475000,'Confirmed','Land','10% down + 18 monthly','2026-06-10','Jun 10, 2026'),
        ('BKG-109','Nadia Akhter','Jolshiri Abason','Plot 15',32000000,0,'Pending Review','Land','Full Payment','2026-06-12','Jun 12, 2026'),
        ('BKG-110','Kazi Nizam','Skyline Towers','Apt 12C',75000000,37500000,'Pending Review','Flat','50% down + 6 monthly','2026-06-15','Jun 15, 2026'),
        ('BKG-111','Md. Taher Uddin','Muktodhara Green Park','Plot 17',2800000,200000,'Confirmed','Land','12 monthly installments','2026-06-02','Jun 02, 2026'),
        ('BKG-112','Shamim Reza','Muktodhara Green Park','Plot 5',1500000,50000,'Confirmed','Land','18 monthly installments','2026-06-01','May 20, 2026'),
    ]
    for b in bookings:
        c.execute("INSERT INTO bookings(id,client,property,unit,price,advance,status,type,terms,sched_start,date) VALUES(?,?,?,?,?,?,?,?,?,?,?)", b)

    invoices = [
        ('INV-001','Kamrul Hasan','Jolshiri Abason','Apt 9A',18000000,5,0,0,900000,0,0,18900000,'','Sent', d(-10), d(-30), 'Booking balance — Apt 9A','Sales'),
        ('INV-002','Dr. Rubina Ali','Jolshiri Abason','Apt 4B',22000000,0,0,0,0,0,0,22000000,'','Overdue', d(-14), d(-42), 'Booking balance — Apt 4B','Sales'),
        ('INV-003','Kamrul Hasan','Jolshiri Abason','Apt 9A',18000000,0,0,0,0,0,0,18000000,'','Paid', d(-30), d(-60), 'Downpayment invoice','Sales'),
        ('INV-004','Mrs. Jahanara Begum','Jolshiri Abason','Apt 3C',20000000,0,0,0,0,0,0,20000000,'','Overdue', d(-14), d(-45), 'Final installment — Apt 3C','Sales'),
        ('INV-005','Tariqul Islam','Muktodhara','Plot M-103',4600000,0,0,0,0,0,0,4600000,'','Paid', d(-20), d(-45), 'Full payment — Plot M-103','Sales'),
        ('INV-006','Nadia Akhter','Jolshiri Abason','Plot 15',30000000,5,0,0,1500000,0,0,31500000,'CH-2026-1145','Sent', d(-5), d(-25), 'Downpayment — Plot 15','Sales'),
        ('INV-007','Rashida Begum','Skyline Towers','Apt 12A',38000000,0,0,0,0,0,0,38000000,'','Partial', d(-8), d(-30), 'Installment — Apt 12A','Sales'),
        ('INV-008','Delwar Hossain','Muktodhara','Apt 4C',466667,0,0,0,0,0,0,466667,'','Overdue', d(-3), d(-12), 'June installment — Apt 4C','Sales'),
    ]
    for i in invoices:
        c.execute("INSERT INTO invoices(id,client,project,unit,amount,vat_rate,tds_rate,ait_rate,vat,tds,ait,net,challan,status,due_date,issued_date,desc,type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", i)

    payments = [
        ('PAY-001','INV-002','Dr. Rubina Ali',5000000, d(-23),'Bank Transfer','TRF-2026-0451','Cleared','Full downpayment'),
        ('PAY-002','INV-002','Dr. Rubina Ali',16000000, d(-12),'Cheque','CHQ-448921','Cleared','Balance payment cleared'),
        ('PAY-003','INV-003','Kamrul Hasan',10000000, d(-40),'Bank Transfer','TRF-2026-0387','Cleared','Downpayment received'),
        ('PAY-004','INV-003','Kamrul Hasan',8000000, d(-28),'Online','ONL-PAY-8891','Cleared','Balance via bKash'),
        ('PAY-005','INV-007','Rashida Begum',5000000, d(-55),'Bank Transfer','TRF-2026-0302','Cleared','Booking advance'),
        ('PAY-006','INV-005','Tariqul Islam',4600000, d(-20),'Bank Transfer','TRF-2026-0440','Cleared','Full payment'),
        ('PAY-007','INV-008','Delwar Hossain',1500000, d(-10),'Cash','CASH-0021','Cleared','Partial installment'),
        ('PAY-008',None,'Mizanur Rahman',2000000, d(-6),'Bank Transfer','TRF-2026-0512','Pending','Downpayment — awaiting clearance'),
        ('PAY-009','INV-006','Nadia Akhter',5000000, d(-4),'Cheque','CHQ-455100','Pending','Downpayment — pending'),
        ('PAY-010',None,'Laily Akhter',475000, d(-2),'bKash','BK-8821','Cleared','Booking advance'),
        ('PAY-011','INV-002','Dr. Rubina Ali',1000000, d(-1),'Bank Transfer','TRF-2026-0577','Pending','Balance top-up — pending'),
        ('PAY-012','INV-008','Delwar Hossain',466667, d(-3),'Online','ONL-3355','Cleared','June installment'),
    ]
    for p in payments:
        c.execute("INSERT INTO payments(id,invoice_id,client,amount,date,method,reference,status,notes) VALUES(?,?,?,?,?,?,?,?,?)", p)

    dues = [
        ('Dr. Rubina Ali','Jolshiri Abason','Apt 4B',22000000,21000000,1000000, d(14),'Upcoming','15 Days',0,'01722-345678'),
        ('Mrs. Jahanara Begum','Jolshiri Abason','Apt 3C',20000000,8000000,12000000, d(-15),'Critical','60+ Days',45,'01766-789012'),
        ('Fatima Begum','Green Valley','Plot G-22',3200000,0,3200000, d(-18),'Overdue','30 Days',18,'01755-678901'),
        ('Engr. Salahuddin','Muktodhara','Plot 22',3200000,2000000,1200000, d(-30),'Critical','60+ Days',60,'01744-567890'),
        ('Md. Nazrul Islam','Muktodhara','Unit 201',6000000,1200000,1500000, d(-120),'Critical','60+ Days',90,'01777-890123'),
        ('Shamima Akhter','Muktodhara','Unit 305',4200000,840000,950000, d(-30),'Overdue','30 Days',30,'01788-901234'),
        ('Abdur Rahim','Jolshiri Abason','Apt 5A',3800000,760000,500000, d(-15),'Overdue','15 Days',15,'01799-012345'),
        ('Kamrul Hasan','Jolshiri Abason','Apt 9A',18000000,18000000,0, d(0),'Paid','Cleared',0,'01711-234567'),
    ]
    for du in dues:
        c.execute("INSERT INTO dues(customer,project,unit,total_price,paid,due,due_date,status,bucket,days_overdue,phone) VALUES(?,?,?,?,?,?,?,?,?,?,?)", du)

    txn = [
        ('RCP-8839', d(-5),'Booking money — Dr. Rubina','Dr. Rubina Ali','Jolshiri','Inflow','Booking','Received',2000000),
        ('RCP-8840', d(-4),'Installment — Kamrul Hasan','Kamrul Hasan','Jolshiri','Inflow','Installment','Received',8000000),
        ('EXP-9912', d(-6),'Site labor wages','','Muktodhara','Outflow','Labor','Paid',345000),
        ('RCP-8841', d(-3),'Booking — Shahidul Islam','Shahidul Islam','Muktodhara','Inflow','Booking','Received',1800000),
        ('PAY-3312', d(-7),'Brick supply payment','','Muktodhara','Outflow','Materials','Paid',450000),
        ('RCP-8842', d(-2),'Installment — Delwar Hossain','Delwar Hossain','Muktodhara','Inflow','Installment','Received',1500000),
        ('EXP-9911', d(-8),'Facebook ads campaign','','Jolshiri','Outflow','Marketing','Paid',50000),
        ('RCP-8843', d(-1),'Booking — Laily Akhter','Laily Akhter','Muktodhara','Inflow','Booking','Received',475000),
        ('PAY-3313', d(-9),'Monthly labor payroll','','Jolshiri','Outflow','Labor','Paid',1280000),
        ('RCP-8844', d(-3),'Booking — Kazi Nizam','Kazi Nizam','Skyline','Inflow','Booking','Received',37500000),
        ('EXP-9910', d(-10),'Office rent & utilities','','Corporate','Outflow','Admin','Paid',85000),
        ('RCP-8845', d(-2),'Installment — Rashida Begum','Rashida Begum','Skyline','Inflow','Installment','Received',5000000),
        ('PAY-3314', d(-11),'Marketing billboard rental','','Jolshiri','Outflow','Marketing','Pending',350000),
        ('RCP-8846', d(-4),'Downpayment — Nadia Akhter','Nadia Akhter','Jolshiri','Inflow','Downpayment','Pending',5000000),
        ('EXP-9909', d(-12),'Steel reinforcement — BSRM','','Muktodhara','Outflow','Materials','Paid',420000),
    ]
    for t in txn:
        c.execute("INSERT INTO transactions(id,date,desc,client,project,type,category,status,amount) VALUES(?,?,?,?,?,?,?,?,?)", t)

    assets = [
        ('FA-001','LND-01','Jolshiri Abason Land','Land & Building','2024-01-15',250000000,0,0,0,'Jolshiri','In Use'),
        ('FA-002','BLD-01','Head Office Building','Land & Building','2024-03-01',80000000,8000000,40,2000000,'Gulshan','In Use'),
        ('FA-003','VEH-01','Toyota Hiace (Site)','Vehicles','2024-05-10',5500000,550000,8,1031250,'Muktodhara Site','In Use'),
        ('FA-004','VEH-02','Pickup Truck (Muktodhara)','Vehicles','2024-07-01',3200000,320000,8,525000,'Muktodhara Site','In Use'),
        ('FA-005','EQP-01','Tower Crane','Equipment','2024-06-20',15000000,1500000,12,2187500,'Jolshiri','In Use'),
        ('FA-006','IT-01','IT Equipment & Computers','IT & Software','2024-04-01',1800000,180000,5,540000,'Head Office','In Use'),
    ]
    for a in assets:
        c.execute("INSERT INTO fixed_assets(id,code,name,category,purchase_date,cost,salvage,useful_life,accum_dep,location,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)", a)

    license_installments = [
        {'no':1,'label':'Advance (15%)','amount':120000,'due':d(-28),'status':'Paid','paidDate':d(-29)},
        {'no':2,'label':'Milestone 1 — Core CRM + Properties','amount':130000,'due':d(-1),'status':'Paid','paidDate':d(-5)},
        {'no':3,'label':'Milestone 2 — Finance + Payments','amount':130000,'due':d(30),'status':'Due','paidDate':''},
        {'no':4,'label':'Milestone 3 — HR + Procurement','amount':130000,'due':d(60),'status':'Upcoming','paidDate':''},
        {'no':5,'label':'Milestone 4 — Reports + Compliance','amount':110000,'due':d(90),'status':'Upcoming','paidDate':''},
        {'no':6,'label':'Milestone 5 — Portal + WhatsApp','amount':110000,'due':d(120),'status':'Upcoming','paidDate':''},
        {'no':7,'label':'Final — Go-live + Handover','amount':70000,'due':d(150),'status':'Upcoming','paidDate':''},
    ]
    license_checklist = [
        {'id':1,'title':'Server provisioning & hosting','due':'2026-07-10','status':'Done','owner':'BITSCOL'},
        {'id':2,'title':'Master data import','due':d(10),'status':'In Progress','owner':'BITSCOL'},
        {'id':3,'title':'Role configuration & user training','due':d(25),'status':'Pending','owner':'MARS'},
        {'id':4,'title':'Finance go-live','due':d(50),'status':'Pending','owner':'MARS'},
        {'id':5,'title':'Customer portal launch','due':d(120),'status':'Pending','owner':'BITSCOL'},
    ]
    c.execute("INSERT INTO license(id,status,contract,installments,checklist) VALUES(1,'Active',800000,?,?)",
              (json.dumps(license_installments), json.dumps(license_checklist)))

    conn.commit(); conn.close()
    print("Seeded:", len(users), "users,", len(leads), "leads,", len(customers), "customers,", len(projects), "projects,",
          len(bookings), "bookings,", len(invoices), "invoices,", len(payments), "payments,", len(dues), "dues,",
          len(txn), "transactions,", len(assets), "assets, license")

if __name__ == '__main__':
    seed()
