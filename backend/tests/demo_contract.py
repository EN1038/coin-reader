"""สัญญา mock สำหรับพรีเซนต์; client adapter เป็นงานส้ม ไม่สร้าง frontend ที่นี่"""
def add_demo_contract(api, obj, ref, uuid, amount, text, operation, response, content):
 s=api['components']['schemas']
 status={'enum':['open','reviewing','resolved','rejected']}
 dt={'type':'string','format':'date-time'}
 reason={'type':'string','minLength':10,'maxLength':1000}
 source={'enum':['edge-stub','client-mock']}
 def envelope(data):return obj({'mock':{'const':True},'source':source,'data':data},['mock','source','data'],True)
 s['DemoAuthorReview']=obj({'author_id':uuid,'status':{'enum':['approved','rejected']},'approved_at':{'type':['string','null'],'format':'date-time'},'replayed':{'type':'boolean'}},['author_id','status','approved_at','replayed'],True)
 s['DemoReport']=obj({'id':uuid,'reporter_id':uuid,'work_id':{'type':['string','null'],'format':'uuid'},'chapter_id':{'type':['string','null'],'format':'uuid'},'target_user_id':{'type':['string','null'],'format':'uuid'},'reason':text,'status':status,'created_at':dt},['id','reporter_id','reason','status','created_at'])
 s['DemoReportList']=obj({'items':{'type':'array','items':ref('DemoReport')},'limit':{'type':'integer','minimum':1,'maximum':100},'offset':{'type':'integer','minimum':0,'maximum':10000}},['items','limit','offset'],True)
 s['DemoTakedownReceipt']=obj({'id':uuid,'work_id':uuid,'status':{'const':'open'},'created_at':dt},['id','work_id','status','created_at'],True)
 s['DemoPayoutReceipt']=obj({'payout_id':uuid,'amount':amount,'status':{'enum':['pending','approved','paid','rejected','cancelled']},'request_id':uuid},['payout_id','amount','status','request_id'],True)
 s['DemoWriterDashboard']=obj({'author_id':uuid,'author_status':{'enum':['pending','approved','rejected','suspended']},'metrics_origin':{'const':'mock-fixture'},'works_count':{'type':'integer','minimum':0},'unlock_count':{'type':'integer','minimum':0},'earnings':obj({k:dict(amount,minimum=0) for k in ['pending','available','reserved','paid']},['pending','available','reserved','paid'],True),'policy':obj({'writer_share_bps':{'const':7000},'hold_days':{'const':14},'minimum_payout':{'const':100},'placeholder':{'const':True}},['writer_share_bps','hold_days','minimum_payout','placeholder'],True)},['author_id','author_status','metrics_origin','works_count','unlock_count','earnings','policy'],True)
 def add(name,tag,summary,roles,body,result,edge=False,errors=None):
  op=operation(tag,summary+' — MOCK สำหรับพรีเซนต์', 'demo_'+name.replace('-','_'),envelope(result),body)
  op['x-mock-contract']=True
  op['x-allowed-roles']=roles
  op['x-implementation-status']='edge-demo-stub' if edge else 'client-mock-contract'
  op['x-runtime']={'client':'สัญญาสำหรับ adapter/mock store ของส้ม; ยังไม่ได้ตรวจ implementation UI','edge':f'edge-functions/{name}/index.ts (local only, not deployed)' if edge else 'ไม่มี Edge wrapper ในชุดนี้; ใช้ client mock เท่านั้น'}
  op['description']='ทุก success มี mock=true และ source. ภายนอกใช้ client mock ของส้ม ไม่มีการเรียกเงินจริง/ยืนยัน KYC จริง. '+('Edge ทางเลือกต้อง APP_ENV=local และ DEMO_BACKEND_ENABLED=true, JWT ตรวจ Auth; สิทธิ์ตาม RPC/RLS. ' if edge else 'นี่เป็นสัญญาสำหรับ client adapter ไม่ใช่ HTTP endpoint ที่ deploy แล้ว; UI demo-role ไม่ใช่ระบบ security จริง. ')
  if errors:op['description']+='Error codes: '+errors
  op['responses']['404']=response(ref('Error'),'NOT_FOUND / AUTHOR_NOT_FOUND ตามชนิดข้อมูล')
  op['responses']['413']=response(ref('Error'),'BODY_TOO_LARGE (>4096 bytes ทั้ง body)')
  op['responses']['415']=response(ref('Error'),'JSON_REQUIRED')
  op['responses']['503']=response(ref('Error'),'SERVER_NOT_CONFIGURED / upstream ไม่พร้อม')
  op['responses']['403']['description']='FORBIDDEN / DEMO_DISABLED / MOCK_DISABLED'
  api['paths']['/functions/v1/'+name]={'post':op}
  return op
 add('admin-author-review','Admin','อนุมัติ/ปฏิเสธนักเขียน',['moderator','superadmin'],obj({'author_id':uuid,'decision':{'enum':['approved','rejected']},'reason':reason},['author_id','decision','reason'],True),ref('DemoAuthorReview'),True,'400 INVALID_REVIEW, 404 AUTHOR_NOT_FOUND, 409 AUTHOR_REVIEW_CONFLICT. same decision replay=true; opposite final decision conflict.')
 add('admin-reports-list','Moderation','รายการรายงานพร้อมแบ่งหน้า',['moderator','superadmin'],obj({'status':status,'limit':{'type':'integer','minimum':1,'maximum':100,'default':20},'offset':{'type':'integer','minimum':0,'maximum':10000,'default':0}},closed=True),ref('DemoReportList'),True,'400 INVALID_STATUS / INVALID_PAGINATION; ไม่มี total หากไม่ได้คำนวณจริง')
 add('admin-reports-review','Moderation','ทบทวนรายงาน',['moderator','superadmin'],obj({'report_id':uuid,'status':{'enum':['reviewing','resolved','rejected']},'reason':reason},['report_id','status','reason'],True),obj({'report_id':uuid,'status':status},['report_id','status'],True),errors='404 NOT_FOUND, 409 INVALID_TRANSITION; open→reviewing→resolved/rejected, replay same status ไม่เพิ่ม audit ซ้ำ; ไม่ระงับงานอัตโนมัติ')
 add('create-takedown','Moderation','รับคำร้องลิขสิทธิ์จำลอง',['authenticated'],obj({'work_id':uuid,'claim':{'type':'string','minLength':20,'maxLength':3000},'evidence_path':{'type':'string','maxLength':240}},['work_id','claim','evidence_path'],True),ref('DemoTakedownReceipt'),True,'400 INVALID_EVIDENCE_PATH / INVALID_REFERENCE; prefix evidence_path ต้องเป็น user_id ของ caller. รับเรื่องแล้วไม่ระงับงานเอง; fixture เท่านั้น ไม่ใช่การแจ้งทางกฎหมาย')
 add('admin-takedown-review','Admin','ทบทวน/ระงับงานจากคำร้องจำลอง',['moderator','superadmin'],obj({'request_id':uuid,'decision':{'enum':['reviewing','takedown','rejected']},'reason':reason},['request_id','decision','reason'],True),obj({'request_id':uuid,'status':status,'work_id':uuid,'work_status':{'enum':['draft','published','suspended','takedown']}},['request_id','status','work_id','work_status'],True),errors='404 NOT_FOUND, 409 INVALID_TRANSITION; open→reviewing; reviewing→takedown/rejected. takedown ต้องเปลี่ยน request=resolved + work=takedown แบบ atomic ใน mock store; ห้าม refund')
 add('request-payout','Author','ขอถอนค่าตอบแทนจำลอง',['approved-writer-owner'],obj({'amount':dict(amount,exclusiveMinimum=0,maximum=1000000000),'bank_document_id':uuid,'request_id':uuid},['amount','bank_document_id','request_id'],True),ref('DemoPayoutReceipt'),True,'403 AUTHOR_UNAVAILABLE; 409 PAYOUT_UNAVAILABLE / AUTHOR_FUNDS_HELD / BANK_NOT_VERIFIED / IDEMPOTENCY_CONFLICT. request_id เดิม payload เดิมคืนคำขอเดิม; ไม่จ่ายเงินจริง')
 add('admin-payout-review','Admin','อนุมัติ/ปฏิเสธคำขอถอนจำลอง',['finance','superadmin'],obj({'payout_id':uuid,'decision':{'enum':['approved','rejected']},'reason':reason},['payout_id','decision','reason'],True),obj({'payout_id':uuid,'status':{'enum':['approved','rejected']}},['payout_id','status'],True),errors='400 INVALID_REVIEW; 409 PAYOUT_UNAVAILABLE. pending เท่านั้น; replay ไม่รับประกันใน RPC เดิม')
 add('admin-payout-pay','Admin','บันทึกจ่ายจำลอง ไม่โอนเงิน',['finance','superadmin'],obj({'payout_id':uuid,'note':reason,'mode':{'const':'mock'}},['payout_id','note','mode'],True),obj({'payout_id':uuid,'status':{'const':'paid'},'transaction_id':uuid},['payout_id','status','transaction_id'],True),errors='409 PAYOUT_UNAVAILABLE; approved→paid, paid ซ้ำคืน transaction เดิม. ห้ามรับ mode=real')
 add('writer-apply','Author','ส่งใบสมัครนักเขียนจำลอง',['authenticated'],obj({'display_name':{'type':'string','minLength':1,'maxLength':80},'bio':{'type':'string','maxLength':2000},'contract_version':{'type':'string','minLength':1,'maxLength':80}},['display_name','contract_version'],True),obj({'author_id':uuid,'status':{'const':'pending'},'contract_accepted_at':dt},['author_id','status','contract_accepted_at'],True),errors='409 ALREADY_EXISTS; user_id และเวลา acceptance มาจาก mock session/server ไม่รับจาก body')
 add('writer-dashboard','Author','dashboard นักเขียนตนเองจาก fixture',['writer-owner-pending-or-approved'],obj({},closed=True),ref('DemoWriterDashboard'),errors='404 AUTHOR_NOT_FOUND; pending แสดงสถานะใบสมัครพร้อม metrics=0; approved แสดง fixture ติดป้าย ไม่ใช่ยอดใช้งานจริง')
 add('admin-content-review','Admin','เผยแพร่/ระงับเนื้อหาจำลอง',['moderator','superadmin'],obj({'target_kind':{'enum':['work','chapter']},'target_id':uuid,'decision':{'enum':['published','suspended']},'reason':reason},['target_kind','target_id','decision','reason'],True),obj({'target_id':uuid,'status':{'enum':['published','suspended']}},['target_id','status'],True),errors='404 NOT_FOUND; 409 CONTENT_NOT_READY; publication checks เป็น mock เท่านั้น ไม่ใช่การตรวจลิขสิทธิ์/18+ จริง')
 # success/error examples ให้ mock adapter เริ่มได้โดยไม่อ่าน implementation
 for name,data in {
  'admin-author-review':{'author_id':'30000000-0000-4000-8000-000000000001','status':'approved','approved_at':'2026-11-06T11:49:00+07:00','replayed':False},
  'admin-reports-list':{'items':[],'limit':20,'offset':0},
  'request-payout':{'payout_id':'80000000-0000-4000-8000-000000000001','amount':100,'status':'pending','request_id':'60000000-0000-4000-8000-000000000001'},
 }.items():
  op=api['paths']['/functions/v1/'+name]['post']
  op['responses']['200']['content']['application/json']['example']={'mock':True,'source':'edge-stub','data':data}
 api['paths']['/functions/v1/request-payout']['post']['responses']['409']['content']['application/json']['example']={'error':'BANK_NOT_VERIFIED'}
 api['info']['version']='0.2.0-demo'
 api['info']['description']='6 พ.ย. 2569 (2026-11-06) เวลาไทย: mock contract สำหรับพรีเซนต์. UI ภายนอกใช้ client mock ของส้ม. Edge wrappers เป็นทางเลือก local ยังไม่ deploy. ไม่มีเงินจริง/gateway/webhook/VIP. source บอก runtime จริงของแต่ละ response.'
 for tag in api['tags']:
  if tag['name']=='Admin':tag['description']='mock contracts สำหรับพรีเซนต์; ดู x-runtime แยก client mock กับ local Edge'
