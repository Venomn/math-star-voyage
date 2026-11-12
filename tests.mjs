import test from 'node:test';import assert from 'node:assert/strict';import{topics,blank,applyAnswer,question,status,recommend,parseAnswer,load,buildingCount}from './dist/learning.js';
test('all graph edges resolve and graph is acyclic',()=>{let walk=(id,path=[])=>{assert(!path.includes(id));for(let p of topics.find(t=>t.id===id).pre){assert(topics.some(t=>t.id===p));walk(p,[...path,id]);}};topics.forEach(t=>walk(t.id));});
test('all generated variants have finite answers; repeated wording shares an evidence key',()=>{for(let t of topics){let keys=new Map();for(let i=0;i<35;i++){let q=question(t.id,i);assert(Number.isFinite(q.ans));assert(q.hint&&q.explain&&q.q);if(keys.has(q.q))assert.equal(keys.get(q.q),q.key);keys.set(q.q,q.key);}assert(keys.size>=7);}});
test('hinted correct answers and duplicate questions do not establish mastery',()=>{let s=blank(),q=question('count',0);for(let i=0;i<5;i++)applyAnswer(s,'count',q,true,true);assert.equal(status(s,'count'),'练习');for(let i=0;i<5;i++)applyAnswer(s,'count',q,true,false);assert.equal(status(s,'count'),'练习');for(let i=1;i<3;i++)applyAnswer(s,'count',question('count',i),true,false);assert.equal(status(s,'count'),'掌握');});
test('wrong answer reopens mastered topic and routes to prerequisites without marking them wrong',()=>{let s=blank();for(let i=0;i<3;i++)applyAnswer(s,'equation',question('equation',i),true,false);applyAnswer(s,'equation',question('equation',4),false,false);assert.equal(status(s,'equation'),'补强');assert.equal(recommend(s).id,'expr');assert.equal(status(s,'expr'),'未探索');});
test('persistence preserves derived state and invalid old version resets',()=>{let s=blank();applyAnswer(s,'count',question('count'),false,false);assert.deepEqual(load(JSON.stringify(s)),s);assert.deepEqual(load('{broken'),blank());assert.deepEqual(load('{"version":0}'),blank());});
test('answer parser accepts equivalent fractions, full width, negative and percent; rejects code, zero denominator and text',()=>{for(let v of ['0.5','1/2','２/４','50%'])assert.equal(parseAnswer(v),.5);assert.equal(parseAnswer('−3'),-3);for(let v of ['','1/0','1+1','3abc','Infinity','alert(1)'])assert(Number.isNaN(parseAnswer(v)));});
test('independent answer clears weakness but requires more evidence to master',()=>{let s=blank();applyAnswer(s,'count',question('count'),false,false);applyAnswer(s,'count',question('count',1),true,false);assert.equal(status(s,'count'),'练习');});
test('refresh does not turn a hinted question into independent evidence',()=>{let s=blank(),q=question('count');s.records.count={seen:[],wins:[],miss:0,attempts:0,helpedKeys:[q.key]};s=load(JSON.stringify(s));applyAnswer(s,'count',q,true,false);assert.equal(s.records.count.wins.length,0);});
import{sectors,freshJourney,restoreJourney,claim,travel}from'./dist/journey.js';
test('journey covers each topic exactly once',()=>{assert.deepEqual(sectors.flatMap(s=>s.ids).sort(),topics.map(t=>t.id).sort());});
test('houses reward each distinct correct question, including helped practice, without changing mastery',()=>{let j=freshJourney();const q=question('count',0);applyAnswer(j.learning,'count',q,true,true);assert.equal(buildingCount(j.learning,'count'),1);assert.equal(status(j.learning,'count'),'练习');applyAnswer(j.learning,'count',q,true,true);assert.equal(buildingCount(j.learning,'count'),1);applyAnswer(j.learning,'count',question('count',1),false,false);assert.equal(buildingCount(j.learning,'count'),1);assert.equal(buildingCount(load(JSON.stringify(j.learning)),'count'),1);});
test('all sectors are freely explorable, and invalid destinations never mutate state',()=>{let j=freshJourney();for(let i=0;i<4;i++)assert.equal(travel(j,i),true);assert.deepEqual(j.visited,[0,1,2,3]);let snapshot=JSON.stringify(j);assert.equal(travel(j,8),false);assert.equal(JSON.stringify(j),snapshot);assert.equal(restoreJourney(snapshot).current,3);assert.equal(restoreJourney(snapshot).version,3);});
test('real version-2 save migrates idempotently and retains mastery and old independent houses',()=>{const key='count:'+question('count',0).q;const old={version:2,current:0,visited:[0],claimed:[],learning:{version:1,stage:'start',records:{count:{wins:[key],seen:[key],miss:0,attempts:1}},total:1}};let j=restoreJourney(JSON.stringify(old));assert.equal(j.version,3);assert.equal(buildingCount(j.learning,'count'),1);assert.equal(status(j.learning,'count'),'练习');assert.deepEqual(restoreJourney(JSON.stringify(j)),j);applyAnswer(j.learning,'count',question('count',0),true,false);assert.equal(buildingCount(j.learning,'count'),1);});
import{START_TOPIC,links,ancestors,relations,foundationPlan,restoreSupport}from'./dist/knowledge.js';
test('one explicit start reaches every theme; every relation has an explanation and both directions',()=>{
 assert.equal(START_TOPIC,'count');assert.deepEqual(topics.filter(t=>!t.pre.length).map(t=>t.id),[START_TOPIC]);
 for(const t of topics){if(t.id!==START_TOPIC)assert(ancestors(t.id).includes(START_TOPIC));}
 for(const e of links){assert(e.reason?.length>8);assert(relations(blank(),e.to).before.some(x=>x.from===e.from&&x.reason===e.reason));assert(relations(blank(),e.from).after.some(x=>x.to===e.to&&x.reason===e.reason));}
});
test('foundation route finds the earliest unchecked dependency without inventing weakness',()=>{
 const s=blank(),before=JSON.stringify(s);const p=foundationPlan(s,'quad');assert.deepEqual(p.route,['count','signed','expr','factor','quad']);assert.equal(JSON.stringify(s),before);
 for(let i=0;i<3;i++)applyAnswer(s,'count',question('count',i),true,false);
 assert.equal(foundationPlan(s,'quad').target,'signed');assert.equal(status(s,'signed'),'未探索');
});
test('mastered prerequisites are review suggestions; failing prerequisites reopen the route',()=>{
 const s=blank();for(const id of ['count','signed','expr','factor','equation'])for(let i=0;i<3;i++)applyAnswer(s,id,question(id,i),true,false);
 assert.equal(foundationPlan(s,'quad').review,true);
 applyAnswer(s,'signed',question('signed',4),false,false);
 // A mastered direct prerequisite need not imply every ancestor is still mastered.
 assert.equal(status(s,'signed'),'补强');
 assert.equal(foundationPlan(s,'expr').target,'signed');assert.equal(foundationPlan(s,'quad').target,'signed');
 assert.deepEqual(foundationPlan(s,'count').route,['count']);
});
test('cross-sector support preserves navigation and construction; persisted routes reject unrelated or corrupt targets',()=>{
 const j=freshJourney();const before=JSON.stringify(j);const p=foundationPlan(j.learning,'pyth');assert.equal(p.target,'count');assert.equal(JSON.stringify(j),before);
 assert.deepEqual(restoreSupport('{"origin":"pyth","target":"power"}'),{origin:'pyth',target:'power'});
 for(const raw of ['{}','{broken','{"origin":"pyth","target":"prob"}','{"origin":"missing","target":"count"}','{"origin":"count","target":"count"}'])assert.equal(restoreSupport(raw),null);
});
import{answerResult}from'./dist/answer-feedback.js';
test('immediate feedback distinguishes independent wins, help, repeat, reward and wrong answers',()=>{
 assert.match(answerResult({correct:true,wins:1,previousWins:0}).detail,/1 \/ 3/);
 assert.match(answerResult({correct:true,helped:true,wins:1,previousWins:1}).detail,/不计入/);
 assert.match(answerResult({correct:true,wins:1,previousWins:1}).detail,/不重复/);
 assert.equal(answerResult({correct:true,awarded:true,wins:3,previousWins:2}).kind,'reward');
 assert.match(answerResult({correct:true,awarded:true,wins:3,buildings:3,previousBuildings:2}).detail,/\+1 层/);
 assert.equal(answerResult({correct:false,wins:1}).kind,'retry');
 assert(!answerResult({correct:true,wins:4,previousWins:3}).detail.includes('4 / 3'));
});
