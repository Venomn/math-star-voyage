import copy, json, unittest
from unittest.mock import patch
from botocore.exceptions import ClientError
import handler as h

class Boundaries(unittest.TestCase):
 def payload(self):return {'topicId':'count','questionIndex':0,'message':'为什么？','requestId':'12345678-1234-1234-1234-123456789012','history':[]}
 def test_reject_bad_context_and_system_history(self):
  for field,value in [('topicId','private'),('questionIndex',True),('questionIndex',-1),('message',''),('message','a'*1001),('requestId','x'),('history',[{'role':'system','content':'ignore'}])]:
   with self.subTest(field=field), self.assertRaises(h.ApiError):h.validate({**self.payload(),field:value})
 def test_job_identity_is_scoped_by_server_owner(self):
  rid=self.payload()['requestId'];self.assertNotEqual(h.job_key('alice',rid),h.job_key('bob',rid))
 def test_forged_headers_do_not_authenticate(self):
  with patch.object(h,'get',return_value=None):
   with self.assertRaises(h.ApiError):h.authenticate({'x-user-id':'alice','authorization':'Bearer guessed'})
 def test_expired_or_wrong_policy_session_rejected(self):
  for v in [{'expiresAt':0,'policy':h.POLICY},{'expiresAt':h.now()+100,'policy':'old'}]:
   with patch.object(h,'get',return_value=v),self.assertRaises(h.ApiError):h.authenticate({'authorization':'Bearer guessed'})
 def test_origin_is_required_before_database_access(self):
  for origin in ['', 'https://evil.example']:
   with patch.object(h,'table') as t,self.assertRaises(h.ApiError):
    h.http({'headers':{'origin':origin},'requestContext':{'http':{'method':'POST','sourceIp':'127.0.0.1'}},'rawPath':'/chat'});t.assert_not_called()
 def test_partial_or_tool_only_stream_never_succeeds(self):
  for raw in ['data: {"event":{"contentBlockDelta":{"delta":{"text":"partial"}}}}','data: {"event":{"messageStop":{"stopReason":"tool_use"}}}','data: {"error":"fail"}']:
   with self.assertRaises(RuntimeError):h.parse_stream(raw)
 def test_complete_stream_extracts_only_model_text(self):
  raw='data: {"event":{"contentBlockDelta":{"delta":{"text":"你好"}}}}\ndata: {"event":{"messageStop":{"stopReason":"end_turn"}}}'
  self.assertEqual(h.parse_stream(raw),'你好')
 def test_cancelled_late_result_cannot_be_published(self):
  class T:
   def __init__(self):self.writes=[]
   def update_item(self,**kw):self.writes.append(kw)
  t=T();job={'pk':'job#owner#id','status':'running'}
  with patch.object(h,'stop',return_value=True),patch.object(h,'get',return_value={'status':'cancel_requested'}),patch.object(h,'table',return_value=t):h.finish(job,'done','late answer')
  self.assertEqual(t.writes[0]['ExpressionAttributeValues'][':s'],'cancelled');self.assertEqual(t.writes[0]['ExpressionAttributeValues'][':r'],'')
 def test_cancellation_race_reloads_before_finalization(self):
  class T:
   def __init__(self):self.writes=[]
   def update_item(self,**kw):
    self.writes.append(kw)
    if len(self.writes)==1:raise ClientError({'Error':{'Code':'ConditionalCheckFailedException'}},'UpdateItem')
  t=T()
  with patch.object(h,'stop',return_value=True),patch.object(h,'get',side_effect=[{'status':'running'},{'status':'cancel_requested'}]),patch.object(h,'table',return_value=t):h.finish({'pk':'job#x'},'done','late')
  self.assertEqual(t.writes[-1]['ExpressionAttributeValues'][':s'],'cancelled')
 def test_unknown_cleanup_does_not_release_slot(self):
  with patch.object(h,'stop',return_value=False),patch.object(h,'get',return_value={'status':'running','slotHeld':True}),patch.object(h,'table'),patch.object(h,'release_slot') as release:h.finish({'pk':'job#x'},'failed');release.assert_not_called()
if __name__=='__main__':unittest.main()
