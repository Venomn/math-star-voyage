import test from 'node:test';import assert from 'node:assert/strict';import{topics,blank,applyAnswer,question,status,recommend,parseAnswer,load}from './dist/learning.js';
test('all graph edges resolve and graph is acyclic',()=>{let walk=(id,path=[])=>{assert(!path.includes(id));for(let p of topics.find(t=>t.id===id).pre){assert(topics.some(t=>t.id===p));walk(p,[...path,id]);}};topics.forEach(t=>walk(t.id));});
test('all generated variants have finite answers; repeated wording shares an evidence key',()=>{for(let t of topics){let keys=new Map();for(let i=0;i<35;i++){let q=question(t.id,i);assert(Number.isFinite(q.ans));assert(q.hint&&q.explain&&q.q);if(keys.has(q.q))assert.equal(keys.get(q.q),q.key);keys.set(q.q,q.key);}assert(keys.size>=7);}});
test('hinted correct answers and duplicate questions do not establish mastery',()=>{let s=blank(),q=question('count',0);for(let i=0;i<5;i++)applyAnswer(s,'count',q,true,true);assert.equal(status(s,'count'),'练习');for(let i=0;i<5;i++)applyAnswer(s,'count',q,true,false);assert.equal(status(s,'count'),'练习');for(let i=1;i<3;i++)applyAnswer(s,'count',question('count',i),true,false);assert.equal(status(s,'count'),'掌握');});
test('wrong answer reopens mastered topic and routes to prerequisites without marking them wrong',()=>{let s=blank();for(let i=0;i<3;i++)applyAnswer(s,'equation',question('equation',i),true,false);applyAnswer(s,'equation',question('equation',4),false,false);assert.equal(status(s,'equation'),'补强');assert.equal(recommend(s).id,'expr');assert.equal(status(s,'expr'),'未探索');});
test('persistence preserves derived state and invalid old version resets',()=>{let s=blank();applyAnswer(s,'count',question('count'),false,false);assert.deepEqual(load(JSON.stringify(s)),s);assert.deepEqual(load('{broken'),blank());assert.deepEqual(load('{"version":0}'),blank());});
test('answer parser accepts equivalent fractions, full width, negative and percent; rejects code, zero denominator and text',()=>{for(let v of ['0.5','1/2','２/４','50%'])assert.equal(parseAnswer(v),.5);assert.equal(parseAnswer('−3'),-3);for(let v of ['','1/0','1+1','3abc','Infinity','alert(1)'])assert(Number.isNaN(parseAnswer(v)));});
test('independent answer clears weakness but requires more evidence to master',()=>{let s=blank();applyAnswer(s,'count',question('count'),false,false);applyAnswer(s,'count',question('count',1),true,false);assert.equal(status(s,'count'),'练习');});
test('refresh does not turn a hinted question into independent evidence',()=>{let s=blank(),q=question('count');s.records.count={seen:[],wins:[],miss:0,attempts:0,helpedKeys:[q.key]};s=load(JSON.stringify(s));applyAnswer(s,'count',q,true,false);assert.equal(s.records.count.wins.length,0);});
import{sectors,freshJourney,restoreJourney,energy,claim,travel}from'./dist/journey.js';
test('journey covers each topic exactly once',()=>{assert.deepEqual(sectors.flatMap(s=>s.ids).sort(),topics.map(t=>t.id).sort());});
test('energy comes only from first mastery and is never farmed',()=>{let j=freshJourney();assert.equal(energy(j),0);assert.equal(claim(j,'count'),false);for(let i=0;i<3;i++)applyAnswer(j.learning,'count',question('count',i),true,false);assert.equal(claim(j,'count'),true);assert.equal(claim(j,'count'),false);assert.equal(energy(j),3);applyAnswer(j.learning,'count',question('count',4),false,false);assert.equal(energy(j),3);assert.equal(claim(j,'count'),false);});
test('new sectors cost once, returns are free and insufficient energy never mutates state',()=>{let j=freshJourney();let before=JSON.stringify(j);assert.equal(travel(j,1),false);assert.equal(JSON.stringify(j),before);for(let i=0;i<3;i++)applyAnswer(j.learning,'count',question('count',i),true,false);claim(j,'count');assert.equal(travel(j,1),true);assert.equal(energy(j),0);assert.equal(travel(j,0),true);assert.equal(travel(j,1),true);assert.equal(energy(j),0);assert.equal(travel(j,2),false);});
test('reload restores atomic destination and reward ledger; old mastered state migrates',()=>{let s=blank();for(let i=0;i<3;i++)applyAnswer(s,'count',question('count',i),true,false);let j=restoreJourney(null,JSON.stringify(s));assert.equal(energy(j),3);travel(j,1);let reload=restoreJourney(JSON.stringify(j),null);assert.equal(reload.current,1);assert.equal(energy(reload),0);assert.equal(claim(reload,'count'),false);});
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
test('cross-sector support preserves navigation and energy; persisted routes reject unrelated or corrupt targets',()=>{
 const j=freshJourney();const before=JSON.stringify(j);const p=foundationPlan(j.learning,'pyth');assert.equal(p.target,'count');assert.equal(JSON.stringify(j),before);
 assert.deepEqual(restoreSupport('{"origin":"pyth","target":"power"}'),{origin:'pyth',target:'power'});
 for(const raw of ['{}','{broken','{"origin":"pyth","target":"prob"}','{"origin":"missing","target":"count"}','{"origin":"count","target":"count"}'])assert.equal(restoreSupport(raw),null);
});
