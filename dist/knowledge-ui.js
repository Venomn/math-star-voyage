import {topics,status} from './learning.js?v=7';
import {links,relations,foundationPlan,topicById,START_TOPIC,restoreSupport} from './knowledge.js?v=7';
import {sectors} from './journey.js?v=7';
const $=id=>document.getElementById(id),sectorOf=id=>sectors.findIndex(s=>s.ids.includes(id));
export function knowledgeUI(api){
 let selected=START_TOPIC,positions=[],support=null,announced='';
 try{support=restoreSupport(sessionStorage.getItem('math-support'));}catch{}
 function save(){try{support?sessionStorage.setItem('math-support',JSON.stringify(support)):sessionStorage.removeItem('math-support');}catch{}}
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;}
 function supportLesson(id){const origin=support?.origin||api.active();if(origin&&origin!==id){support={origin,target:id};save();}api.open(id);}
 function render(id=selected){
  selected=id;const state=api.state(),r=relations(state,id);if(!r.topic)return;
  $('relationTitle').textContent=r.topic.name+(id===START_TOPIC?' · 基础起点':'');
  $('relationLocation').textContent=sectors[sectorOf(id)].name+' · '+status(state,id);
  $('relationIntro').textContent=id===START_TOPIC?'从这里开始：先练习加减乘除与运算顺序，再沿航线拓展。已会的孩子可以直接挑战其他知识。':'箭头从基础指向后续知识，表示支撑关系或建议学习顺序，不是强制解锁。';
  for(const [key,items] of [['before',r.before],['after',r.after]]){
   const box=$(key==='before'?'priorKnowledge':'nextKnowledge');box.replaceChildren();
   if(!items.length){const p=document.createElement('p');p.textContent=key==='before'?'这是本版统一起点，没有更早的前置主题。':'本版暂未收录更后续的主题，可以巩固或探索其他支线。';box.append(p);}
   for(const e of items){const row=document.createElement('article');row.className='relation-item';const b=button(`${e.topic.name} · ${e.status} ↗`,()=>{api.select(e.topic.id);$('relationPanel').open=true;});row.append(b);const p=document.createElement('p');p.textContent=e.reason;row.append(p);const small=document.createElement('small');small.textContent=sectors[sectorOf(e.topic.id)].name+(sectorOf(e.topic.id)!==api.current()?' · 跨星系':'');row.append(small);box.append(row);}
  }
  const remote=sectorOf(id)!==api.current();$('relationPractice').textContent=remote?'前往这颗星球 · 自由探索':'降落练习 · '+r.topic.name;
  $('relationPractice').onclick=()=>api.visit(id);
  $('basisBanner').hidden=!support;
  if(support){$('basisBannerText').textContent=`补给航线：${topicById(support.origin).name} → ${topicById(support.target).name}。进度已保留，可继续补基础或返回原挑战。`;}
  draw();
 }
 function guide(show=false){
  const id=api.active();if(!id)return;const plan=foundationPlan(api.state(),id),target=topicById(plan.target);
  const text=plan.target===id?'这里就是基础起点。先看一个小提示，再尝试下一题，不着急。':plan.review?`基础练习已有掌握记录。我们也可以复习「${target.name}」，检查这一步，再回来继续。`:`我们先检查「${target.name}」，再回到「${topicById(id).name}」。这是一条建议路线，还不能仅凭这道题判断基础不会。`;
  $('foundationGuide').hidden=!show;
  if(show){$('foundationText').textContent=text;$('foundationPath').textContent=plan.route.map(x=>topicById(x).name).join(' → ');$('foundationGo').textContent=plan.target===id?'三三，给我基础提示':`免费补基础 · ${target.name}`;$('foundationGo').onclick=()=>plan.target===id?api.hint():supportLesson(plan.target);
   const key=id+':'+plan.target;if(announced!==key){api.message('三三的补给建议：'+text);announced=key;}}
  $('returnChallenge').hidden=!support;$('returnChallenge').textContent=support?`返回原挑战 · ${topicById(support.origin).name}`:'';
 }
 function back(){if(!support)return;const id=support.origin;support=null;save();api.open(id);render();}
 $('returnChallenge').onclick=back;$('resumeChallenge').onclick=back;
 $('resumeBasis').onclick=()=>{if(support)api.open(support.target);};
 $('startPoint').onclick=()=>{api.select(START_TOPIC);$('relationPanel').open=true;};
 $('foundationStart').onclick=()=>api.open(START_TOPIC);
 $('showFoundations').onclick=()=>guide(true);
 function draw(){
  const svg=$('knowledgeLines'),box=$('routeLines');box.replaceChildren();if(!positions.length)return;
  const state=api.state(),plan=foundationPlan(state,selected),path=plan?.route||[];
  for(const e of links){const a=positions.find(p=>p.id===e.from),b=positions.find(p=>p.id===e.to);if(!a?.visible||!b?.visible||[a,b].some(p=>p.x<.02||p.x>.98||p.y<.1||p.y>.88))continue;
   const line=document.createElementNS('http://www.w3.org/2000/svg','line');let dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.03)continue;const gap=.012/len;
   for(const [k,v]of Object.entries({x1:(a.x+dx*gap)*1000,y1:(a.y+dy*gap)*1000,x2:(b.x-dx*gap)*1000,y2:(b.y-dy*gap)*1000}))line.setAttribute(k,v);
   const highlighted=e.to===selected||e.from===selected;const repair=status(state,selected)==='补强'&&path.includes(e.from)&&path.includes(e.to);
   line.setAttribute('class',repair?'repair':highlighted?'active':status(state,e.from)==='掌握'?'mastered':'');line.setAttribute('marker-end','url(#routeArrow)');box.append(line);
  }
  svg.hidden=false;
 }
 return {render,positions(p,flying){positions=p;draw();$('knowledgeLines').hidden=!!flying;},selected(){return selected;},lesson(){announced='';guide(false);render();},difficulty(){guide(true);render();},refresh(){render();if(!$('foundationGuide').hidden)guide(true);}};
}
