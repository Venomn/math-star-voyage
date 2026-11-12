import {topics,status} from './learning.js';
export const START_TOPIC='count';
const reasons={
 'count:fraction':'分数与比例中的计算，需要先会四则运算。','count:signed':'在四则运算基础上，学习正负数的运算。',
 'signed:power':'先理解正负数，才能区分负数的平方和平方根。','signed:expr':'合并同类项时，需要正确计算带正负号的系数。',
 'expr:factor':'因式分解把整式的和改写成积，要先认识项和系数。','expr:equation':'解方程时要合并同类项，整理含未知数的式子。',
 'equation:system':'消元后会得到一元一次方程。','equation:ineq':'借助解方程的经验学习变形，再注意不等号的方向。',
 'factor:quad':'因式分解是解一元二次方程的一种方法。','equation:quad':'二次方程化成一次方程后，还需要求出每个根。',
 'equation:linear':'方程与一次函数共同描述数量关系，求交点时会用到方程。',
 'fraction:inverse':'反比例函数涉及除法和两个数量的乘积关系。','linear:inverse':'对比一次函数，学习另一种变化规律；这是建议学习顺序。',
 'quad:parabola':'二次函数与横轴的交点对应一元二次方程的根。','linear:parabola':'从一次函数的图像出发，比较二次函数的图像与变化。',
 'count:angle':'求未知角常常需要加减运算。','angle:triangle':'三角形中的角度问题需要角与平行线的知识。',
 'triangle:pyth':'先认识直角三角形，才能分清直角边与斜边。','power:pyth':'勾股定理需要平方运算和开平方。',
 'triangle:similar':'先认识三角形的边与角，再判断对应关系。','fraction:similar':'相似图形用对应边的比例联系起来。',
 'angle:circle':'圆心角、圆周角的问题需要角度关系。','power:circle':'圆的长度与几何计算中会用到平方和平方根。',
 'count:stats':'平均数要先求和，再除以个数。','fraction:prob':'概率可表示为有利结果数与全部结果数的比。','stats:prob':'先会整理、计数数据，再研究随机结果。'
};
export const links=topics.flatMap(t=>t.pre.map(from=>({from,to:t.id,reason:reasons[from+':'+t.id]})));
export const topicById=id=>topics.find(t=>t.id===id);
export function ancestors(id){const out=new Set();function visit(key){for(const p of topicById(key)?.pre||[]){if(!out.has(p)){out.add(p);visit(p);}}}visit(id);return [...out];}
export function relations(state,id){return {topic:topicById(id),before:links.filter(e=>e.to===id).map(e=>({...e,topic:topicById(e.from),status:status(state,e.from)})),after:links.filter(e=>e.from===id).map(e=>({...e,topic:topicById(e.to),status:status(state,e.to)}))};}
// A suggested check, never evidence that an untested prerequisite is weak.
export function foundationPlan(state,id){
 const t=topicById(id);if(!t)return null;
 function path(key,trail){const node=topicById(key);for(const p of node.pre){if(status(state,p)!=='掌握'||ancestors(p).some(a=>status(state,a)==='补强'))return path(p,[p,...trail]);}return trail;}
 const route=path(id,[id]);
 if(route.length>1)return {target:route[0],route,review:false};
 if(t.pre.length)return {target:t.pre[0],route:[t.pre[0],id],review:true};
 return {target:id,route:[id],review:true};
}
export function restoreSupport(raw){try{const v=JSON.parse(raw);return topicById(v?.origin)&&ancestors(v.origin).includes(v.target)?{origin:v.origin,target:v.target}:null;}catch{return null;}}
