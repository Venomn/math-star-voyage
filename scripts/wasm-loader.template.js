// Count compressed download bytes, not fabricated timer progress.
(()=>{
  const original=window.fetch.bind(window);
  const report=data=>parent.postMessage(JSON.stringify({type:'loading',...data}),location.origin);
  report({phase:'prepare'});
  window.fetch=async(input,options)=>{
    const url=new URL(input instanceof Request?input.url:String(input),location.href);
    if(url.origin!==location.origin||!url.pathname.endsWith('/engine.wasm'))return original(input,options);
    try{
      if(typeof DecompressionStream==='undefined')throw new Error('请使用新版浏览器，或打开轻量知识图谱。');
      report({phase:'download',loaded:0,total:__ZIP_SIZE__});
      const response=await original(new URL('engine.wasm.gz',url),options);
      if(!response.ok)throw new Error('引擎下载失败，请重试。');
      let loaded=0;
      const counter=new TransformStream({
        transform(chunk,controller){loaded+=chunk.byteLength;report({phase:'download',loaded,total:__ZIP_SIZE__});controller.enqueue(chunk);},
        flush(){report({phase:'start'});}
      });
      const stream=response.body.pipeThrough(counter).pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream,{headers:{'Content-Type':'application/wasm','Content-Length':'__RAW_SIZE__'}});
    }catch(error){report({phase:'error',message:error.message});throw error;}
  };
})();
