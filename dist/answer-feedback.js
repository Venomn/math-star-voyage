export function answerResult({correct,helped=false,awarded=false,wins=0,previousWins=0,buildings=0,previousBuildings=0}){
 const count=Math.min(3,wins),built=buildings>previousBuildings;
 const house=built?'新小屋 +1 层！星球已建 '+buildings+' 层。':'这道题的小屋已建好，不重复盖楼。';
 if(!correct)return {kind:'retry',title:'这一步还差一点',detail:'看看下面的解析，或让三三带你补基础。',count};
 if(awarded)return {kind:'reward',title:'星球点亮啦！',detail:house+' 独立挑战 3 / 3，点亮环已解锁。',count};
 if(helped)return {kind:'success',title:built?'答对啦！小屋长高了':'答对啦！',detail:house+` 这题有提示，不计入独立通关。当前 ${count} / 3，下一题自己试试！`,count};
 if(wins<=previousWins)return {kind:'success',title:'复习也答对啦！',detail:house+` 独立挑战 ${count} / 3，本次不重复计数。`,count};
 return {kind:'success',title:built?'答对啦！小屋长高了':'答对啦！',detail:house+` 独立挑战 ${count} / 3 · ${count<3?'再完成 '+(3-count)+' 道不同题目，就能点亮星球！':'三颗星光已集齐，继续巩固吧！'}`,count};
}
const $=id=>document.getElementById(id);
export function clearAnswerFeedback(){
 const notice=$('answerNotice');if(notice){notice.hidden=true;notice.replaceChildren();}
 $('lesson').classList.remove('answer-celebration');$('check').textContent='验证答案';$('feedback').className='';
}
export function showAnswerFeedback(input){
 const result=answerResult(input),lesson=$('lesson');let notice=$('answerNotice');
 if(!notice){notice=document.createElement('section');notice.id='answerNotice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');notice.tabIndex=-1;lesson.querySelector('.dialog-top').after(notice);}
 notice.replaceChildren();notice.className=result.kind;notice.hidden=false;
 const icon=document.createElement('span');icon.className='answer-icon';icon.setAttribute('aria-hidden','true');icon.textContent=input.correct?'⌂':'↻';if(input.correct&&input.buildings>input.previousBuildings){icon.classList.add('tiny-house');icon.textContent='';for(let i=0;i<Math.min(input.buildings,4);i++){const floor=document.createElement('i');floor.textContent='▪ ▪';icon.append(floor);}}
 const copy=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('p');title.textContent=result.title;detail.textContent=result.detail;copy.append(title,detail);
 const next=document.createElement('button');next.type='button';next.textContent='继续挑战 →';next.onclick=()=>$('next').click();notice.append(icon,copy,next);
 if(input.correct&&input.buildings>input.previousBuildings&&document.body.classList.contains('voyage')){const view=document.createElement('button');view.type='button';view.textContent='去看看新小屋';view.onclick=()=>dispatchEvent(new Event('view-construction'));notice.append(view);}
 if(input.awarded&&!document.body.classList.contains('voyage')){const back=document.createElement('button');back.type='button';back.textContent=document.body.classList.contains('voyage')?'看看点亮的星球':'返回知识星图';back.onclick=()=>$('close').click();notice.append(back);}
 $('check').textContent=input.correct?'✓ 答对了':'已验证';
 lesson.classList.toggle('answer-celebration',input.correct);
 $('answer').blur();lesson.scrollTop=0;notice.focus({preventScroll:true});
}
