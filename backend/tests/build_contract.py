# สร้าง OpenAPI จากโครง contract ภายใน; ไม่มี API ภายนอกหรือ credentials
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
uuid={'type':'string','format':'uuid'}
text={'type':'string'}
amount={'type':'number','multipleOf':0.01}
def obj(props,required=(),closed=False):
 d={'type':'object','properties':props}
 if required:d['required']=list(required)
 if closed:d['additionalProperties']=False
 return d
def ref(n):return {'$ref':'#/components/schemas/'+n}
def arr(n):return {'type':'array','items':ref(n)}
s={
 'Error':obj({'error':text},['error']),
 'RestError':obj({'code':text,'message':text,'details':{'type':['string','null']},'hint':{'type':['string','null']}},['code','message']),
 'Work':obj({'id':uuid,'author_id':uuid,'kind':{'enum':['novel','manga']},'title':text,'slug':text,'synopsis':text,'cover_path':{'type':['string','null']},'category':{'type':['string','null']},'tags':{'type':'array','items':text},'rating':{'enum':['general','18+']},'status':{'enum':['draft','published','suspended','takedown']},'published_at':{'type':['string','null'],'format':'date-time'},'completed':{'type':'boolean'},'price_full_work':{'type':['integer','null'],'minimum':1}},['id','author_id','kind','title','slug','rating','status']),
 'AuthorPublic':obj({'id':uuid,'display_name':text,'bio':{'type':['string','null']}},['id','display_name']),
 'Chapter':obj({'id':uuid,'work_id':uuid,'number':{'type':'integer','minimum':1},'title':text,'pricing':{'enum':['free','coin']},'coin_price':{'type':'integer','minimum':0},'status':{'enum':['draft','published','suspended','takedown']},'publish_at':{'type':['string','null'],'format':'date-time'},'content_type':{'enum':['novel','manga']}},['id','work_id','number','pricing','coin_price']),
 'ChapterContent':obj({'chapter_id':uuid,'body':{'type':'string','maxLength':1000000}},['chapter_id','body']),
 'ChapterPage':obj({'id':uuid,'chapter_id':uuid,'page_number':{'type':'integer','minimum':1},'storage_path':text},['id','chapter_id','page_number']),
 'Pack':obj({'id':uuid,'name':text,'coins':{'type':'integer','minimum':1},'amount_thb':amount,'active':{'type':'boolean'},'is_example_data':{'const':True}},['id','name','coins','amount_thb','is_example_data']),
 'TopupResult':obj({'payment_id':uuid,'transaction_id':uuid,'balance':amount,'replayed':{'type':'boolean'},'mock':{'const':True}},['payment_id','transaction_id','balance','replayed','mock']),
 'UnlockResult':obj({'transaction_id':uuid,'balance':amount,'replayed':{'type':'boolean'},'free':{'type':'boolean'}},['balance','replayed']),
 'LedgerEntry':obj({'id':{'type':'integer'},'transaction_id':uuid,'account':{'enum':['wallet','writer_payable','clearing','platform_revenue','adjustment_clearing','payout_clearing']},'user_id':{'type':['string','null'],'format':'uuid'},'author_id':{'type':['string','null'],'format':'uuid'},'amount':amount,'created_at':{'type':'string','format':'date-time'}},['id','transaction_id','account','amount']),
 'Shelf':obj({'user_id':uuid,'work_id':uuid,'created_at':{'type':'string','format':'date-time'}},['user_id','work_id']),
 'Progress':obj({'user_id':uuid,'work_id':uuid,'chapter_id':uuid,'position':{'type':'number','minimum':0,'maximum':1},'updated_at':{'type':'string','format':'date-time'}},['user_id','work_id','chapter_id','position']),
 'AuthorApply':obj({'user_id':uuid,'display_name':{'type':'string','minLength':1,'maxLength':80},'bio':{'type':'string','maxLength':2000},'contract_version':{'type':'string','minLength':1,'maxLength':80}},['user_id','display_name','contract_version'],True),
 'Author':obj({'id':uuid,'user_id':uuid,'display_name':text,'status':{'enum':['pending','approved','rejected','suspended']},'contract_version':text,'contract_accepted_at':{'type':'string','format':'date-time'},'approved_at':{'type':['string','null'],'format':'date-time'}},['id','user_id','display_name','status']),
 'Payout':obj({'id':uuid,'author_id':uuid,'amount':amount,'bank_document_id':uuid,'status':{'enum':['pending','approved','paid','rejected','cancelled']},'is_example_data':{'const':True}},['id','author_id','amount','status']),
 'Report':obj({'reporter_id':uuid,'work_id':uuid,'chapter_id':uuid,'target_user_id':uuid,'reason':{'type':'string','minLength':10,'maxLength':2000}},['reporter_id','reason'],True),
 'Takedown':obj({'requester_id':uuid,'work_id':uuid,'claim':{'type':'string','minLength':20,'maxLength':5000},'evidence_path':text},['requester_id','work_id','claim','evidence_path'],True),
}
api={'openapi':'3.1.0','info':{'title':'Coin Reader — mock backend MVP','version':'0.1.0','description':'6 พ.ย. 2569 (2026-11-06) เวลาไทย; mock-only ไม่มี VIP/refund/gateway จริง. admin HTTP เป็น design-only. PostgREST ขึ้นกับ grants/RLS ใน schema.sql.','license':{'name':'Private — internal design only'}},'servers':[{'url':'http://127.0.0.1:54321','description':'Supabase local เท่านั้น ไม่ใช่ deployment ที่เปิดแล้ว'}],'security':[{'ApiKey':[],'BearerAuth':[]}],'tags':[{'name':n,'description':d} for n,d in [('Catalog','อ่าน published general; paid body ต้อง unlock'),('Wallet','บัญชี mock เท่านั้น'),('Reader','ชั้นหนังสือและความคืบหน้า'),('Author','ลงทะเบียน/ถอนจำลอง'),('Moderation','รายงานและ takedown'),('Admin','RPC ที่ทำแล้วและ HTTP design-only'),('Auth','Supabase managed Auth')]],'paths':{},'components':{'securitySchemes':{'ApiKey':{'type':'apiKey','in':'header','name':'apikey'},'BearerAuth':{'type':'http','scheme':'bearer','bearerFormat':'JWT'}},'schemas':s}}
def content(schema):return {'application/json':{'schema':schema}}
def response(schema=None,description='สำเร็จ'):
 d={'description':description}
 if schema:d['content']=content(schema)
 return d
def operation(tag,summary,oid,result,body=None,public=False,rest=False):
 d={'tags':[tag],'summary':summary,'operationId':oid,'responses':{'200':response(result),'400':response(ref('RestError' if rest else 'Error'),'ข้อมูลไม่ถูกต้อง'),'401':response(ref('RestError' if rest else 'Error'),'ต้อง login / token ไม่ถูกต้อง'),'403':response(ref('RestError' if rest else 'Error'),'ไม่อนุญาต'),'409':response(ref('RestError' if rest else 'Error'),'ราคา/ยอด/สถานะ/idempotency ขัดแย้ง'),'500':response(ref('RestError' if rest else 'Error'),'ข้อผิดพลาดภายใน')}}
 if body:d['requestBody']={'required':True,'content':content(body)}
 if public:d['security']=[{'ApiKey':[]}]
 return d
for path,tag,model,pub,summary in [
 ('works','Catalog','Work',True,'รายการเรื่อง — published general ตาม RLS'),('author_public','Catalog','AuthorPublic',True,'นามปากกาสาธารณะ ไม่มี KYC/สัญญา'),('chapters','Catalog','Chapter',True,'สารบัญ metadata ไม่รวม paid body'),('chapter_contents','Catalog','ChapterContent',True,'body ตอนฟรีหรือที่ caller ปลดล็อกแล้ว'),('chapter_pages','Catalog','ChapterPage',True,'page metadata; ไม่ใช่ signed image URL'),('coin_packs','Wallet','Pack',True,'แพ็กตัวอย่าง active'),('coin_ledger','Wallet','LedgerEntry',False,'รายการบัญชีของ caller / finance'),('bookshelf','Reader','Shelf',False,'ชั้นหนังสือตนเอง'),('reading_progress','Reader','Progress',False,'ตำแหน่งอ่านตนเอง'),('authors','Author','Author',False,'ข้อมูลสมัครนักเขียนตนเอง'),('payout_requests','Author','Payout',False,'คำขอถอนจำลองของตนเอง')]:
 op=operation(tag,summary,'list_'+path,arr(model),public=pub,rest=True)
 op['parameters']=[{'name':'limit','in':'query','schema':{'type':'integer','minimum':1,'maximum':100},'description':'client ควรจำกัด 100; ต้องตั้ง PostgREST max_rows เพิ่มที่ deployment'}]
 if path in ['works','chapters','chapter_contents','chapter_pages']:
  name='work_id' if path=='chapters' else 'chapter_id' if path in ['chapter_contents','chapter_pages'] else 'id'
  op['parameters'].append({'name':name,'in':'query','schema':{'type':'string'},'description':'PostgREST filter เช่น eq.<uuid>'})
 api['paths']['/rest/v1/'+path]={'get':op}
for path,tag,model in [('bookshelf','Reader','Shelf'),('reading_progress','Reader','Progress'),('authors','Author','AuthorApply'),('reports','Moderation','Report'),('takedown_requests','Moderation','Takedown')]:
 op=operation(tag,'เพิ่มข้อมูลด้วย caller JWT และ RLS','create_'+path,None,body=ref(model),rest=True)
 op['responses'].pop('200');op['responses']['201']=response(None,'เพิ่มสำเร็จ; ส่ง Prefer:return=representation เพื่อขอแถวคืน')
 op['description']='ห้ามส่ง status/admin fields; server/RLS กำหนดเอง.'
 if path in ['bookshelf','reading_progress']:
  op['parameters']=[{'name':'Prefer','in':'header','schema':{'type':'string','enum':['resolution=merge-duplicates']},'description':'upsert ตาม primary key; timestamp progress ให้ client ตั้งหรือปรับ server trigger ก่อน production'}]
 api['paths'].setdefault('/rest/v1/'+path,{})['post']=op
api['paths']['/rest/v1/bookshelf']['delete']=operation('Reader','ลบรายการชั้นหนังสือตัวเอง','delete_bookshelf',None,rest=True)
api['paths']['/rest/v1/bookshelf']['delete']['parameters']=[{'name':'work_id','in':'query','required':True,'schema':text,'description':'eq.<uuid>; RLS บังคับ user_id ตนเอง'}]
api['paths']['/rest/v1/bookshelf']['delete']['responses'].pop('200');api['paths']['/rest/v1/bookshelf']['delete']['responses']['204']=response(None,'ลบแล้ว')
op=operation('Wallet','เติมเหรียญจำลอง — local เท่านั้น','mock_topup',ref('TopupResult'),obj({'pack_id':uuid},['pack_id'],True))
op['parameters']=[{'name':'Idempotency-Key','in':'header','required':True,'schema':uuid,'description':'UUID เดิมสำหรับ retry request เดียวกัน; key ผูกกับ pack'}]
api['paths']['/functions/v1/mock-topup']={'post':op}
target={'oneOf':[obj({'chapter_id':uuid,'expected_price':{'type':'integer','minimum':0,'maximum':2147483647}},['chapter_id','expected_price'],True),obj({'work_id':uuid,'expected_price':{'type':'integer','minimum':1,'maximum':2147483647}},['work_id','expected_price'],True)]}
api['paths']['/functions/v1/unlock-chapter']={'post':operation('Wallet','ปลดล็อกตอนหรือทั้งเรื่องใน DB transaction เดียว','unlock_content',ref('UnlockResult'),target)}
op=operation('Catalog','signed URL 120 วินาที; paid watermark ยังเป็น stub','get_manga_page_url',obj({'url':{'type':'string','format':'uri'},'expires_in':{'const':120},'watermarked':{'const':False},'mock':{'const':True}},['url','expires_in','watermarked','mock']),obj({'page_id':uuid},['page_id'],True),public=True)
op['description']='anonymous ใช้ได้เฉพาะ free. ส่ง Authorization JWT สำหรับ paid. default paid ตอบ 501; bypass เฉพาะ local demo.'
op['responses']['501']=response(ref('Error'),'WATERMARK_NOT_IMPLEMENTED')
api['paths']['/functions/v1/get-manga-page-url']={'post':op}
for name,tag,body,result,desc in [
 ('my_wallet','Wallet',obj({},closed=True),amount,'ยอด wallet ของ caller จาก SUM ledger'),
 ('request_payout','Author',obj({'p_amount':amount,'p_bank_document':uuid,'p_request':uuid},['p_amount','p_bank_document','p_request'],True),uuid,'ขอถอนจำลอง; reserve available แบบ lock author'),
 ('admin_adjust_wallet','Admin',obj({'p_user':uuid,'p_delta':{'type':'integer'},'p_reason':{'type':'string','minLength':10,'maxLength':1000}},['p_user','p_delta','p_reason'],True),uuid,'finance adjustment พร้อมเหตุผล ไม่ใช่ refund'),
 ('admin_review_payout','Admin',obj({'p_payout':uuid,'p_status':{'enum':['approved','rejected']},'p_note':{'type':'string','minLength':10}},['p_payout','p_status','p_note'],True),None,'finance review pending payout จำลอง'),
 ('admin_mock_pay_payout','Admin',obj({'p_payout':uuid,'p_note':{'type':'string','minLength':10}},['p_payout','p_note'],True),uuid,'finance บันทึก paid จำลองเท่านั้น ไม่โอนเงินจริง')]:
 api['paths']['/rest/v1/rpc/'+name]={'post':operation(tag,desc,name,result,body,rest=True)}
for name,description in [('admin-author-review','ตรวจ KYC/อนุมัตินักเขียน'),('admin-content-review','เผยแพร่/ระงับเรื่องและตอน'),('admin-takedown-review','ตรวจร้องเรียนและระงับเรื่องใน transaction เดียว')]:
 api['paths']['/functions/v1/'+name]={'post':{'tags':['Admin'],'summary':description+' — ยังไม่ implement','operationId':name.replace('-','_'),'x-implementation-status':'design-only','description':'ไม่มี function นี้ใน deliverable; ผู้รับงานต้องพัฒนา role check + audit actor ก่อนใช้. 501 เป็นผลที่ router ในอนาคตควรคืน ไม่ใช่ endpoint ที่ deploy แล้ว.','requestBody':{'required':True,'content':content(obj({'target_id':uuid,'action':text,'reason':{'type':'string','minLength':10}},['target_id','action','reason'],True))},'responses':{'501':response(ref('Error'),'NOT_IMPLEMENTED')}}}
api['paths']['/auth/v1/otp']={'post':{'tags':['Auth'],'summary':'Supabase managed email OTP/magic link (ไม่ใช่ custom backend)','operationId':'managed_auth_otp','security':[{'ApiKey':[]}],'description':'เปิด email provider/redirect allowlist ใน Supabase local ก่อน; production ต้องตั้ง CAPTCHA/rate limit. Google/LINE ต้อง provider setup แยก ไม่ได้ตั้งค่าในงานนี้.','requestBody':{'required':True,'content':content(obj({'email':{'type':'string','format':'email'},'create_user':{'type':'boolean'}},['email'],True))},'responses':{'200':response(None,'Supabase managed response'),'429':response(None,'Auth rate limited')}}}
# ตัวอย่างสำหรับ frontend; ทุกค่าเป็น mock fixture ไม่ใช่ข้อมูลผู้ใช้จริง
api['paths']['/functions/v1/mock-topup']['post']['requestBody']['content']['application/json']['example']={'pack_id':'10000000-0000-4000-8000-000000000100'}
api['paths']['/functions/v1/mock-topup']['post']['responses']['200']['content']['application/json']['example']={'payment_id':'60000000-0000-4000-8000-000000000001','transaction_id':'90000000-0000-4000-8000-000000000001','balance':100,'replayed':False,'mock':True}
api['paths']['/functions/v1/unlock-chapter']['post']['requestBody']['content']['application/json']['example']={'chapter_id':'50000000-0000-4000-8000-000000000001','expected_price':10}
api['paths']['/functions/v1/unlock-chapter']['post']['responses']['409']['content']['application/json']['examples']={'insufficient':{'value':{'error':'INSUFFICIENT_COINS'}},'priceChanged':{'value':{'error':'PRICE_CHANGED'}}}
for path,item in api['paths'].items():
 if path.startswith('/functions/v1/') and 'x-implementation-status' not in item['post']:
  for status,description in [('404','ไม่พบหรือไม่มีสิทธิ์อ่าน'),('413','body เกิน 4096 bytes'),('415','ต้องเป็น application/json'),('503','server/signing ไม่พร้อม')]:
   item['post']['responses'][status]=response(ref('Error'),description)
 if path.startswith('/rest/v1/') and 'get' in item:
  item['get']['parameters'].append({'name':'offset','in':'query','schema':{'type':'integer','minimum':0},'description':'PostgREST offset pagination; ตั้ง order คงที่ใน client เมื่อใช้งานจริง'})

# JSON เป็น YAML 1.2 subset; emitter ให้ไฟล์อ่านแบบ YAML ทั่วไปโดยไม่พึ่ง dependency

def emit(v,level=0):
 pad='  '*level
 if isinstance(v,dict):
  if not v:return '{}'
  return '\n'.join(pad+json.dumps(k,ensure_ascii=False)+':'+(('\n'+emit(x,level+1)) if isinstance(x,(dict,list)) and x else ' '+emit(x,0)) for k,x in v.items())
 if isinstance(v,list):
  if not v:return '[]'
  return '\n'.join(pad+'-'+(('\n'+emit(x,level+1)) if isinstance(x,(dict,list)) else ' '+emit(x,0)) for x in v)
 return json.dumps(v,ensure_ascii=False)
(root/'openapi.yaml').write_text('# Generated from tests/build_contract.py · 2026-11-06 Asia/Bangkok\n'+emit(api)+'\n')
