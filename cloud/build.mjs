import {topics,question} from '../dist/learning.js';import{writeFileSync}from'node:fs';
writeFileSync(new URL('catalog.json',import.meta.url),JSON.stringify(Object.fromEntries(topics.map(t=>[t.id,{...t,questions:Array.from({length:35},(_,n)=>question(t.id,n))}]))));
