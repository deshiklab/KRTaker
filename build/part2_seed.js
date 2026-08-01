// === KRTaker seed data (v1.0 demo) ===
const SEED = {
  properties: [
    { id:'P-001', name:'Green View Residency', type:'Flat', jurisdiction:'Dhaka North', holding:'12/5, Mirpur-10', khatian:{cs:'CS 452', sa:'SA 1180', rs:'RS 2277', bs:'BS 3301'}, mortgage:{bank:'Islami Bank', interest:420000}, sqft:18000, value:82000000, status:'Active' },
    { id:'P-002', name:'Banani Commercial Tower', type:'Commercial', jurisdiction:'Dhaka North', holding:'32/K, Banani C/A', khatian:{cs:'CS 88', sa:'SA 210', rs:'RS 990', bs:'BS 1402'}, mortgage:{bank:'BRAC Bank', interest:1800000}, sqft:45000, value:320000000, status:'Active' },
    { id:'P-003', name:'Gulshan Lakeside Plot', type:'Plot', jurisdiction:'Dhaka North', holding:'Plot 7, Block SE(D)', khatian:{cs:'CS 1210', sa:'SA 3400', rs:'RS 501', bs:'BS 920'}, mortgage:null, sqft:0, value:150000000, status:'Active' },
    { id:'P-004', name:'Chattogram Industrial Shed', type:'Industrial', jurisdiction:'Chattogram', holding:'KEPZ Plot 18, Patenga', khatian:{cs:'CS 77', sa:'SA 190', rs:'RS 305', bs:'BS 610'}, mortgage:{bank:'Agrani Bank', interest:950000}, sqft:30000, value:175000000, status:'Active' },
    { id:'P-005', name:'Dhanmondi Apartment', type:'Flat', jurisdiction:'Dhaka South', holding:'Road 9/A, Dhanmondi', khatian:{cs:'CS 655', sa:'SA 1711', rs:'RS 2088', bs:'BS 3020'}, mortgage:null, sqft:2450, value:18500000, status:'Active' }
  ],
  units: [
    { id:'U-001', property:'P-001', name:'Flat 3B', floor:'3rd', sqft:1450, status:'Leased' },
    { id:'U-002', property:'P-001', name:'Flat 4A', floor:'4th', sqft:1650, status:'Leased' },
    { id:'U-003', property:'P-001', name:'Flat 5C', floor:'5th', sqft:1200, status:'Vacant' },
    { id:'U-004', property:'P-002', name:'Floor 1 (Retail)', floor:'1st', sqft:6000, status:'Leased' },
    { id:'U-005', property:'P-002', name:'Floor 2 (Office)', floor:'2nd', sqft:5200, status:'Leased' },
    { id:'U-006', property:'P-002', name:'Floor 3 (Office)', floor:'3rd', sqft:5200, status:'Leased' },
    { id:'U-007', property:'P-003', name:'Plot 7 (SE(D))', floor:'—', sqft:3600, status:'Vacant' },
    { id:'U-008', property:'P-004', name:'Shed A', floor:'Ground', sqft:18000, status:'Leased' },
    { id:'U-009', property:'P-004', name:'Shed B', floor:'Ground', sqft:12000, status:'Maintenance' },
    { id:'U-010', property:'P-005', name:'Apartment 7B', floor:'7th', sqft:2450, status:'Leased' }
  ],
  tenants: [
    { id:'T-001', name:'Rafiqul Islam', phone:'+8801711-223344', nid:'1990123456789', nrb:false, email:'rafiqul@gmail.com', kind:'Individual' },
    { id:'T-002', name:'Sultana Rahman', phone:'+8801812-445566', nid:'1985112233445', nrb:false, email:'sultana.r@yahoo.com', kind:'Individual' },
    { id:'T-003', name:'Orbit Textiles Ltd', phone:'+8809611-778899', nid:'BIN-004512367', nrb:false, email:'accounts@orbittextiles.com', kind:'Corporate' },
    { id:'T-004', name:'Dr. Nadia Karim', phone:'+8801913-556677', nid:'1988889900112', nrb:true, email:'nadia.karim@outlook.com', kind:'Individual' },
    { id:'T-005', name:'Bengal Agro Foods', phone:'+8809613-889900', nid:'BIN-006734512', nrb:false, email:'finance@bengalagro.com', kind:'Corporate' },
    { id:'T-006', name:'Tanvir Hossain', phone:'+8801614-223344', nid:'1993223445566', nrb:false, email:'tanvir.h@gmail.com', kind:'Individual' },
    { id:'T-007', name:'Maria Chowdhury (NRB)', phone:'+1 646-555-0182', nid:'1975123456780', nrb:true, email:'maria.chowdhury@nyc.com', kind:'Individual' },
    { id:'T-008', name:'Ahmed & Sons Traders', phone:'+8801715-990011', nid:'BIN-009812345', nrb:false, email:'ahmedsons@outlook.com', kind:'Corporate' }
  ],
  leases: [
    { id:'L-001', unit:'U-001', tenant:'T-001', start:'2026-01-01', end:'2026-12-31', rent:25000, advance:25000, residential:true, regMeta:null, status:'Active' },
    { id:'L-002', unit:'U-002', tenant:'T-004', start:'2025-11-01', end:'2027-10-31', rent:32000, advance:32000, residential:true, regMeta:{office:'Sub-Registry Mirpur', deed:'DL-4521/2025', date:'2025-11-12'}, status:'Active' },
    { id:'L-003', unit:'U-004', tenant:'T-003', start:'2025-06-01', end:'2027-05-31', rent:450000, advance:450000, residential:false, regMeta:{office:'Sub-Registry Gulshan', deed:'DL-3877/2025', date:'2025-06-20'}, status:'Active' },
    { id:'L-004', unit:'U-005', tenant:'T-005', start:'2026-03-01', end:'2027-02-28', rent:380000, advance:380000, residential:false, regMeta:null, status:'Pending Registration' },
    { id:'L-005', unit:'U-006', tenant:'T-008', start:'2024-07-01', end:'2026-06-30', rent:350000, advance:700000, residential:false, regMeta:{office:'Sub-Registry Gulshan', deed:'DL-2110/2024', date:'2024-07-15'}, status:'Active' },
    { id:'L-006', unit:'U-008', tenant:'T-006', start:'2026-02-01', end:'2026-10-31', rent:210000, advance:210000, residential:false, regMeta:null, status:'Active' },
    { id:'L-007', unit:'U-010', tenant:'T-002', start:'2026-01-15', end:'2026-12-14', rent:40000, advance:40000, residential:true, regMeta:null, status:'Active' },
    { id:'L-008', unit:'U-002', tenant:'T-007', start:'2023-03-01', end:'2024-02-29', rent:28000, advance:56000, residential:true, regMeta:{office:'Sub-Registry Dhanmondi', deed:'DL-1108/2023', date:'2023-03-20'}, status:'Expired' },
    { id:'L-009', unit:'U-009', tenant:'T-005', start:'2025-09-01', end:'2026-08-31', rent:180000, advance:180000, residential:false, regMeta:null, status:'Terminated' },
    { id:'L-010', unit:'U-001', tenant:'T-006', start:'2026-06-01', end:'2028-05-31', rent:28000, advance:56000, residential:true, regMeta:null, status:'Pending Registration' }
  ],
  invoices: [
    { id:'INV-2026-001', lease:'L-001', month:'2026-06', gross:25000, tdsRate:0, tds:0, net:25000, status:'Paid' },
    { id:'INV-2026-002', lease:'L-002', month:'2026-06', gross:32000, tdsRate:0, tds:0, net:32000, status:'Paid' },
    { id:'INV-2026-003', lease:'L-003', month:'2026-06', gross:450000, tdsRate:0.10, tds:45000, net:405000, status:'Paid' },
    { id:'INV-2026-004', lease:'L-004', month:'2026-06', gross:380000, tdsRate:0.10, tds:38000, net:342000, status:'Unpaid' },
    { id:'INV-2026-005', lease:'L-005', month:'2026-06', gross:350000, tdsRate:0.10, tds:35000, net:315000, status:'Unpaid' },
    { id:'INV-2026-006', lease:'L-006', month:'2026-06', gross:210000, tdsRate:0, tds:0, net:210000, status:'Overdue' },
    { id:'INV-2026-007', lease:'L-007', month:'2026-06', gross:40000, tdsRate:0, tds:0, net:40000, status:'Paid' },
    { id:'INV-2026-008', lease:'L-004', month:'2026-07', gross:380000, tdsRate:0.10, tds:38000, net:342000, status:'Overdue' }
  ],
  receipts: [
    { id:'RCP-0001', invoice:'INV-2026-001', amount:25000, date:'2026-06-05', method:'bKash', sig:'SIG-9f3a21c8' },
    { id:'RCP-0002', invoice:'INV-2026-002', amount:32000, date:'2026-06-08', method:'Bank', sig:'SIG-4b71d90e' },
    { id:'RCP-0003', invoice:'INV-2026-003', amount:405000, date:'2026-06-10', method:'bKash', sig:'SIG-c2e58a77' },
    { id:'RCP-0004', invoice:'INV-2026-007', amount:40000, date:'2026-06-12', method:'Nagad', sig:'SIG-77d21f0a' }
  ],
  tickets: [
    { id:'MT-001', unit:'U-008', desc:'Roof structural crack over Shed A', reported:'2026-06-18', liability:'Landlord', status:'Open', contractor:'Rahim Steel Works', cost:0, note:'' },
    { id:'MT-002', unit:'U-001', desc:'Kitchen sink leakage', reported:'2026-06-21', liability:'Tenant', status:'Open', contractor:'', cost:0, note:'' },
    { id:'MT-003', unit:'U-010', desc:'Water pump failure (common line)', reported:'2026-06-24', liability:'Landlord', status:'In Progress', contractor:'Kazi Plumbing', cost:8500, note:'Invoice #CP-221 validated' },
    { id:'MT-004', unit:'U-009', desc:'Flooring damage from tenant forklift', reported:'2026-06-27', liability:'Tenant', status:'Awaiting Payment', contractor:'Meghna Builders', cost:42000, note:'' }
  ],
  payments: [
    { id:'PAY-001', invoice:'INV-2026-001', amount:25000, method:'bKash', ref:'BK-7f2a', date:'2026-06-05', status:'Success' },
    { id:'PAY-002', invoice:'INV-2026-003', amount:405000, method:'bKash', ref:'BK-91cd', date:'2026-06-10', status:'Success' },
    { id:'PAY-003', invoice:'INV-2026-007', amount:40000, method:'Nagad', ref:'NG-33ab', date:'2026-06-12', status:'Success' }
  ],
  users: [
    { id:'USR-ADM', role:'superadmin', name:'Kabir (Platform)', avatar:'KB', scope:{} },
    { id:'USR-OWN', role:'owner', name:'Rofiqul Islam', avatar:'RI', scope:{} },
    { id:'USR-MGR', role:'manager', name:'Shakil Ahmed', avatar:'SA', scope:{properties:['P-001','P-005']} },
    { id:'USR-TEN', role:'tenant', name:'Sultana Rahman', avatar:'SR', scope:{tenant:'T-002', unit:'U-010'} },
    { id:'USR-PAR', role:'partner', name:'Rahim Steel Works', avatar:'RS', scope:{partner:'SP-01'} },
    { id:'USR-SVM', role:'svc_mgr', name:'Arif Chowdhury', avatar:'AC', scope:{} },
    { id:'USR-LEG', role:'legal', name:'Barrister Naima', avatar:'BN', scope:{} },
    { id:'USR-CRM', role:'crm', name:'Mithila Rahman', avatar:'MR', scope:{} },
    { id:'USR-ACC', role:'accountant', name:'Sohel Rana', avatar:'SR', scope:{} },
    { id:'USR-HR', role:'hr', name:'Nusrat Jahan', avatar:'NJ', scope:{} }
  ],
  staff: [
    { id:'ST-01', name:'Arif Chowdhury', role:'Service Manager', dept:'Operations', status:'Active' },
    { id:'ST-02', name:'Mithila Rahman', role:'CRM & Help Desk', dept:'Support', status:'Active' },
    { id:'ST-03', name:'Sohel Rana', role:'Accountant', dept:'Finance', status:'Active' },
    { id:'ST-04', name:'Nusrat Jahan', role:'HR & Admin', dept:'Admin', status:'Active' },
    { id:'ST-05', name:'Barrister Naima Karim', role:'Legal Counsel', dept:'Legal', status:'Active' },
    { id:'ST-06', name:'Tanvir Hasan', role:'Service Manager (Jr)', dept:'Operations', status:'Active' },
    { id:'ST-07', name:'Farzana Akter', role:'CRM Executive', dept:'Support', status:'Probation' },
    { id:'ST-08', name:'Mahmudul Islam', role:'Finance Officer', dept:'Finance', status:'Active' }
  ],
  partners: [
    { id:'SP-01', name:'Rahim Steel Works', trade:'Structural & Steel', rating:4.8, jobs:24, status:'Active' },
    { id:'SP-02', name:'Kazi Plumbing', trade:'Plumbing & Sanitary', rating:4.5, jobs:41, status:'Active' },
    { id:'SP-03', name:'Meghna Builders', trade:'Interior & Renovation', rating:4.2, jobs:17, status:'Active' },
    { id:'SP-04', name:'SecureLine Security', trade:'Security Services', rating:4.9, jobs:33, status:'Active' },
    { id:'SP-05', name:'CleanPro BD', trade:'Cleaning & Facility', rating:4.0, jobs:52, status:'Onboarding' }
  ],
  supportTickets: [
    { id:'SUP-001', from:'Rofiqul Islam (Owner)', subject:'Cannot upload registration deed for L-004', status:'Open', prio:'High', age:'2h', assignee:'' },
    { id:'SUP-002', from:'Orbit Textiles (Tenant)', subject:'TDS certificate not received for June', status:'Open', prio:'Medium', age:'5h', assignee:'' },
    { id:'SUP-003', from:'Sultana Rahman (Tenant)', subject:'How to submit repair invoice for deduction?', status:'In Progress', prio:'Low', age:'1d', assignee:'Mithila' },
    { id:'SUP-004', from:'Rahim Steel Works (Partner)', subject:'QC feedback on MT-001 — photos uploaded', status:'In Progress', prio:'Medium', age:'1d', assignee:'Arif' },
    { id:'SUP-005', from:'Dr. Nadia Karim (Tenant)', subject:'Payment failed — bKash timeout', status:'Resolved', prio:'High', age:'2d', assignee:'Sohel' },
    { id:'SUP-006', from:'Bengal Agro Foods (Tenant)', subject:'Need invoice re-issue with VAT', status:'Open', prio:'Medium', age:'3h', assignee:'' }
  ],
  platform: {
    subscribers: 128, mrr: 2480000, partners: 45, staff: 8, csat: 4.6,
    subsTrend: '+12 this month', arr: 29760000,
    subscriptions: [
      { id:'SUB-001', org:'Green View Residency', plan:'Business', seats:3, mrr:15000, status:'Active', next:'2026-07-01' },
      { id:'SUB-002', org:'Banani Commercial Tower', plan:'Enterprise', seats:10, mrr:45000, status:'Active', next:'2026-07-05' },
      { id:'SUB-003', org:'Chattogram Industrial Shed', plan:'Business', seats:2, mrr:15000, status:'Active', next:'2026-07-12' },
      { id:'SUB-004', org:'Dhanmondi Apartment', plan:'Starter', seats:1, mrr:5000, status:'Active', next:'2026-07-20' },
      { id:'SUB-005', org:'Gulshan Lakeside Plot', plan:'Starter', seats:1, mrr:5000, status:'Trial', next:'2026-06-28' }
    ],
    finance: [
      { id:'FIN-001', type:'Subscription revenue', month:'Jun 2026', amount:2480000, status:'Settled' },
      { id:'FIN-002', type:'Partner payout', month:'Jun 2026', amount:-420000, status:'Paid' },
      { id:'FIN-003', type:'Gateway fees (bKash/SSL)', month:'Jun 2026', amount:-96250, status:'Settled' },
      { id:'FIN-004', type:'TDS collected (platform)', month:'Jun 2026', amount:152000, status:'Payable' },
      { id:'FIN-005', type:'Legal add-on revenue', month:'Jun 2026', amount:180000, status:'Invoiced' },
      { id:'FIN-006', type:'Hosting & infra', month:'Jun 2026', amount:-78000, status:'Paid' }
    ]
  },
  ai_log: [
    { role:'ai', text:'Hello 👋 I\'m KR — your AI property caretaker. Ask me about leases, taxes, PRCA compliance, or say "generate invoice for L-003" and I\'ll take action.', ts:'2026-06-30 09:00' }
  ]
};
