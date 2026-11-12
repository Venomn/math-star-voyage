from pathlib import Path
import importlib, zipfile
root=Path(__file__).parent
with zipfile.ZipFile(root/'package.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for name in ['handler.py','catalog.json']:archive.write(root/name,name)
 for name in ['boto3','botocore','s3transfer','jmespath','dateutil','urllib3','six']:
  path=Path(importlib.import_module(name).__file__)
  if path.name=='__init__.py':
   for f in path.parent.rglob('*'):
    if not f.is_file() or '__pycache__' in f.parts or f.suffix=='.pyc':continue
    rel=f.relative_to(path.parent)
    if name=='botocore' and len(rel.parts)>2 and rel.parts[0]=='data' and rel.parts[1] not in ['bedrock-agentcore','dynamodb','lambda']:continue
    archive.write(f,str(Path(name)/rel))
  else:archive.write(path,path.name)
print('Lambda package bytes:',(root/'package.zip').stat().st_size)
