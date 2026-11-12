export const topics=[
 ['count','四则运算','数与代数',[],12,45,'先乘除，后加减；有括号先算括号。'],
 ['fraction','分数与比例','数与代数',['count'],22,27,'分数相加先通分；比例表示两个数量之间的倍数关系。'],
 ['signed','有理数','数与代数',['count'],25,63,'数轴右边的数更大；异号相加，取绝对值之差，符号跟较大的绝对值。'],
 ['power','乘方与平方根','数与代数',['signed'],37,79,'平方是自己乘自己；算术平方根取非负的那个数。'],
 ['expr','整式运算','数与代数',['signed'],39,48,'只有字母和字母指数都相同的项才能合并。'],
 ['factor','因式分解','数与代数',['expr'],49,65,'把和的形式变成积的形式，先观察能否提取公因式。'],
 ['equation','一元一次方程','方程与函数',['expr'],48,29,'等式两边做相同的运算，等式仍成立。'],
 ['system','二元一次方程组','方程与函数',['equation'],60,17,'用代入或加减消元，把两个未知数化成一个。'],
 ['ineq','一元一次不等式','方程与函数',['equation'],61,43,'两边乘或除以负数时，不等号要反向。'],
 ['quad','一元二次方程','方程与函数',['factor','equation'],69,64,'乘积为零时，至少有一个因式为零；别漏掉另一个根。'],
 ['linear','一次函数','方程与函数',['equation'],73,29,'y = kx + b 中，k 决定变化快慢，b 是 x 为 0 时的 y。'],
 ['inverse','反比例函数','方程与函数',['fraction','linear'],86,16,'反比例函数 y = k/x，x 和 y 的乘积恒为 k，且 x 不为 0。'],
 ['parabola','二次函数','方程与函数',['quad','linear'],88,48,'顶点式 y = a(x-h)²+k 的顶点是 (h,k)，注意括号内的减号。'],
 ['angle','角与平行线','图形与几何',['count'],14,81,'平角为 180°；两直线平行，同位角相等。'],
 ['triangle','三角形','图形与几何',['angle'],30,94,'三角形三个内角之和是 180°。'],
 ['pyth','勾股定理','图形与几何',['triangle','power'],51,94,'直角三角形的两直角边平方和等于斜边平方。'],
 ['similar','相似与比例','图形与几何',['triangle','fraction'],68,90,'相似图形对应边的比相等，面积比是边长比的平方。'],
 ['circle','圆','图形与几何',['angle','power'],86,85,'同弧所对的圆心角是圆周角的两倍。'],
 ['stats','统计与平均数','统计与概率',['count'],9,13,'平均数是总和除以个数；中位数需要先排序。'],
 ['prob','概率初步','统计与概率',['fraction','stats'],40,9,'等可能结果下，概率等于有利结果数除以全部结果数。']
].map(([id,name,group,pre,x,y,lesson])=>({id,name,group,pre,x,y,lesson}));
export const blank=()=>({version:1,stage:'start',records:{},total:0});
export function record(s,id){return s.records[id]||{seen:[],wins:[],miss:0,attempts:0};}
export function status(s,id){let r=record(s,id);return r.miss?'补强':r.wins.length>=3?'掌握':r.attempts?'练习':'未探索';}
export function applyAnswer(s,id,q,correct,helped){let r=record(s,id);r={...r,seen:[...new Set([...r.seen,q.key])],wins:[...r.wins],attempts:r.attempts+1};if(correct&&!helped&&!r.helpedKeys?.includes(q.key)){if(!r.wins.includes(q.key))r.wins.push(q.key);r.miss=0;}else if(!correct){r.miss++;r.wins=r.wins.slice(-1);}s.records[id]=r;s.total++;return s;}
export function recommend(s){let weak=topics.filter(t=>status(s,t.id)==='补强');if(weak.length){let t=weak[0];return topics.find(p=>t.pre.includes(p.id)&&status(s,p.id)!=='掌握')||t;}let starts={start:'count',middle:'signed',exam:'equation'};let first=topics.find(t=>t.id===starts[s.stage]);if(first&&!record(s,first.id).attempts)return first;return topics.find(t=>status(s,t.id)!=='掌握'&&t.pre.every(p=>status(s,p)==='掌握'))||topics.find(t=>status(s,t.id)!=='掌握')||topics[0];}
export function question(id,n=0){let a=2+n%7,b=3+Math.floor(n/7)%5;let q,ans,hint,explain;
switch(id){
case'count':q=`${a} + ${b} × 2 = ?`;ans=a+b*2;hint='先算乘法，再把结果加上前面的数。';explain=`先算 ${b} × 2 = ${b*2}，再加 ${a}，得到 ${ans}。`;break;
case'fraction':q=`${a} / 10 + ${b} / 10 = ?（填小数或分数）`;ans=(a+b)/10;hint='分母相同，分母不变，分子相加。';explain=`结果是 ${a+b}/10，即 ${ans}。`;break;
case'signed':q=`−${a+b} + ${a} = ?`;ans=-b;hint='在数轴上，从负数的位置向右走。';explain=`绝对值之差为 ${b}，较大绝对值对应负号，所以是 −${b}。`;break;
case'power':q=`${a*a} 的算术平方根是多少？`;ans=a;hint='哪个非负数乘自己会得到这个数？';explain=`${a} × ${a} = ${a*a}，算术平方根是 ${a}。`;break;
case'expr':q=`${a}x + ${b}x = ?x（填系数）`;ans=a+b;hint='同类项合并，只把系数相加。';explain=`(${a}+${b})x = ${ans}x。`;break;
case'factor':q=`${a}x + ${a*b} = ${a}(x + □)，□ 是多少？`;ans=b;hint=`把每一项都除以公因式 ${a}。`;explain=`${a*b} ÷ ${a} = ${b}，所以填 ${b}。`;break;
case'equation':q=`${a}x + ${b} = ${a*4+b}，x = ?`;ans=4;hint=`先在两边同时减去 ${b}，再除以 ${a}。`;explain=`${a}x = ${a*4}，所以 x = 4。`;break;
case'system':q=`x + y = ${a+b}，x − y = ${a-b}，x = ?`;ans=a;hint='把两个等式相加，y 和 −y 抵消。';explain=`2x = ${2*a}，所以 x = ${a}。`;break;
case'ineq':q=`−${a}x > −${a*b}，解为 x < □，□ = ?`;ans=b;hint='除以负数要改变不等号方向。';explain=`两边除以 −${a}，得到 x < ${b}。`;break;
case'quad':q=`(x − ${a})(x + ${b}) = 0，较大的根是？`;ans=a;hint='分别让每个因式为零，比较两个根。';explain=`两个根是 ${a} 和 −${b}，较大的根是 ${a}。`;break;
case'linear':q=`y = ${a}x + ${b}，当 x = 2 时，y = ?`;ans=2*a+b;hint='把 x 替换为 2，再按运算顺序计算。';explain=`y = ${a} × 2 + ${b} = ${ans}。`;break;
case'inverse':q=`y = ${a*b}/x，当 x = ${a} 时，y = ?`;ans=b;hint='把分母 x 替换成给定的数。';explain=`y = ${a*b} ÷ ${a} = ${b}。`;break;
case'parabola':q=`y = (x − ${a})² + ${b} 的最小值是？`;ans=b;hint='一个数的平方最小是 0。';explain=`x = ${a} 时平方项为 0，所以最小值是 ${b}。`;break;
case'angle':q=`一个角是 ${a*10}°，它的补角是多少度？`;ans=180-a*10;hint='两个互补的角相加为 180°。';explain=`180 − ${a*10} = ${ans}°。`;break;
case'triangle':q=`三角形的两个角为 ${a*10}° 和 ${b*10}°，第三个角是多少度？`;ans=180-(a+b)*10;hint='用 180° 减去已知的两个角。';explain=`180 − ${a*10} − ${b*10} = ${ans}°。`;break;
case'pyth':q=`直角三角形的两直角边长为 ${3*a} 和 ${4*a}，斜边长是多少？`;ans=5*a;hint='先求两条直角边的平方和，再开平方。';explain=`斜边² = ${9*a*a} + ${16*a*a} = ${25*a*a}，斜边 = ${ans}。`;break;
case'similar':q=`两个相似三角形的对应边之比为 1:${a}，面积之比为 1:□，□ = ?`;ans=a*a;hint='面积比等于对应边长比的平方。';explain=`面积之比为 1:${a}²，即 1:${ans}。`;break;
case'circle':q=`同一条弧所对的圆心角为 ${a*20}°，圆周角是多少度？`;ans=a*10;hint='圆周角是同弧所对圆心角的一半。';explain=`${a*20} ÷ 2 = ${ans}°。`;break;
case'stats':q=`${a}、${a+2}、${a+4} 的平均数是多少？`;ans=a+2;hint='把三个数加起来，再除以 3。';explain=`(${a}+${a+2}+${a+4}) ÷ 3 = ${ans}。`;break;
case'prob':q=`袋里有 ${a} 个红球、${10-a} 个蓝球，随机摸出一球，红球的概率是多少？`;ans=a/10;hint='红球数除以总球数。可填小数或分数。';explain=`共有 10 个球，所以概率是 ${a}/10 = ${ans}。`;break;
default:throw Error('Unknown topic');}
return {key:`${id}:${q}`,q,ans,hint,explain};}
export function parseAnswer(raw){let s=raw.normalize('NFKC').replace(/[−–]/g,'-').trim();if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return Number(s);if(/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(s)){let [a,b]=s.split('/').map(Number);return b?a/b:NaN;}if(/^[+-]?\d+(?:\.\d+)?%$/.test(s))return Number(s.slice(0,-1))/100;return NaN;}
export function load(raw){try{let s=JSON.parse(raw);if(s?.version!==1||!['start','middle','exam'].includes(s.stage)||!s.records) return blank();let out=blank();out.stage=s.stage;for(let t of topics){let r=s.records[t.id];if(r&&Array.isArray(r.wins)&&Array.isArray(r.seen)&&Number.isInteger(r.miss)&&r.miss>=0&&Number.isInteger(r.attempts)&&r.attempts>=0){out.records[t.id]={wins:[...new Set(r.wins.filter(k=>typeof k==='string'&&k.startsWith(t.id+':')))],seen:r.seen.filter(k=>typeof k==='string'),miss:r.miss,attempts:r.attempts,...(Array.isArray(r.helpedKeys)?{helpedKeys:r.helpedKeys.filter(k=>typeof k==='string'&&k.startsWith(t.id+':'))}:{})};out.total+=r.attempts;}}return out;}catch{return blank();}}
