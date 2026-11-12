"""Deploy only this game's named stack; keep local deployment identifiers out of Git."""
import boto3,hashlib,json,time
from pathlib import Path
root=Path(__file__).parent
session=boto3.Session(region_name='us-east-1')
account=session.client('sts').get_caller_identity()['Account']
s3=session.client('s3');cf=session.client('cloudformation')
bucket='math-star-voyage-artifacts-'+account+'-us-east-1'
try:s3.head_bucket(Bucket=bucket)
except Exception:
 s3.create_bucket(Bucket=bucket)
 s3.put_public_access_block(Bucket=bucket,PublicAccessBlockConfiguration={k:True for k in ['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets']})
 s3.put_bucket_encryption(Bucket=bucket,ServerSideEncryptionConfiguration={'Rules':[{'ApplyServerSideEncryptionByDefault':{'SSEAlgorithm':'AES256'}}]})
blob=(root/'package.zip').read_bytes();key='lambda/'+hashlib.sha256(blob).hexdigest()+'.zip'
s3.put_object(Bucket=bucket,Key=key,Body=blob,ServerSideEncryption='AES256')
# Existing Runtime is explicitly selected for this deployment; never bundled into public source.
import os
runtime=os.environ['DEPLOY_RUNTIME_ARN']
params=[{'ParameterKey':k,'ParameterValue':v} for k,v in {'RuntimeArn':runtime,'ArtifactBucket':bucket,'ArtifactKey':key,'AllowedOrigin':'https://venomn.github.io','DailyLimit':'200'}.items()]
args={'StackName':'math-star-voyage-api','TemplateBody':(root/'template.yaml').read_text(),'Parameters':params,'Capabilities':['CAPABILITY_IAM'],'Tags':[{'Key':'Project','Value':'math-star-voyage'}]}
try:cf.describe_stacks(StackName=args['StackName']);exists=True
except cf.exceptions.ClientError as e:
 if 'does not exist' not in str(e):raise
 exists=False
if exists:
 try:cf.update_stack(**args)
 except cf.exceptions.ClientError as e:
  if 'No updates are to be performed' not in str(e):raise
else:cf.create_stack(**args)
print(json.dumps({'stack':args['StackName'],'artifactUploaded':True,'action':'update' if exists else 'create'}),flush=True)
