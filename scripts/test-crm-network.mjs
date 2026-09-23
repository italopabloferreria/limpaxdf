// Renders the real workspace in a browser. Every API request is synthetic/intercepted.
import {build} from "esbuild";
import {createServer} from "node:http";
import {once} from "node:events";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";

const {chromium}=await import(process.env.LIMPAX_PLAYWRIGHT_MODULE
  ?pathToFileURL(process.env.LIMPAX_PLAYWRIGHT_MODULE).href:"playwright");
const bundle=await build({
  entryPoints:["tests/crm-network-fixture.tsx"],bundle:true,write:false,
  platform:"browser",format:"esm",jsx:"automatic",
  alias:{"next/link":path.resolve("tests/next-link-stub.tsx")},
  define:{"process.env.NODE_ENV":'"development"'}
});
const server=createServer((request,response)=>{
  if(request.url==="/fixture.js"){
    response.writeHead(200,{"Content-Type":"text/javascript"}).end(bundle.outputFiles[0].text);
  }else{
    response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end('<!doctype html><html lang="pt-BR"><title>CRM network QA</title><div id="root"></div><script type="module" src="/fixture.js"></script></html>');
  }
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
let browser;
let failed=0;
const reports=[];
const leads=["A","B"].map((label,index)=>({
  id:`00000000-0000-4000-8000-00000000000${index+1}`,
  seq:index+1,status:"novo",mode:"review",createdAt:1_800_000_000_000,
  updatedAt:1_800_000_000_000,assignedTo:null,nextActionAt:null,
  contact:{name:`Cliente sintético ${label}`,phone:"",email:"",problem:"outro",region:"DF",property:"casa"}
}));
const listing={leads,total:2,page:1,pageSize:50,pages:1,totals:{novo:2}};
const details=leads.map(lead=>({lead:{...lead,payload:{},privacyVersion:"test",marketing:0},activities:[],tasks:[],attachments:[],linkedCustomer:null}));

async function fixture(intercept){
  const context=await browser.newContext();
  const page=await context.newPage();
  page.setDefaultTimeout(3500);
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  context.on("close",()=>{
    if(errors.length){failed++;reports.push({name:"uncaught browser errors",status:"FAIL",errors});}
  });
  await page.route("**/api/**",async route=>{
    const request=route.request();
    if(await intercept?.(route,request))return;
    const url=new URL(request.url());
    if(url.pathname==="/api/crm/workspace")return route.fulfill({json:listing});
    const detail=details.find(item=>url.pathname===`/api/crm/leads/${item.lead.id}`);
    if(detail&&request.method()==="GET")return route.fulfill({json:detail});
    return route.fulfill({status:500,json:{error:"Unexpected synthetic API request"}});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  return {page,context,errors};
}
async function test(name,run){
  try{await run();reports.push({name,status:"PASS"});}
  catch(error){failed++;reports.push({name,status:"FAIL",error:error.message});}
}
async function ready(page){await page.getByRole("heading",{name:"Cliente sintético A",exact:true}).waitFor();}
async function verifyNoAlert(page){await page.getByRole("alert").waitFor({state:"hidden"});}

try{
  browser=await chromium.launch({headless:true,...(process.env.LIMPAX_BROWSER_CHANNEL?{channel:process.env.LIMPAX_BROWSER_CHANNEL}:{})});
  await test("detail GET failure offers retry and clears error after recovery",async()=>{
    let attempts=0;
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith(leads[0].id)&&request.method()==="GET"&&++attempts===1){
        await route.fulfill({status:503,json:{error:"Detalhe indisponível no teste."}});return true;
      }
    });
    try{
      await page.getByRole("alert").filter({hasText:"Detalhe indisponível"}).waitFor();
      await page.getByRole("button",{name:"Tentar abrir atendimento novamente"}).click();
      await ready(page);await verifyNoAlert(page);assert.equal(attempts,2);
    }finally{await context.close();}
  });
  await test("listing GET failure offers independent retry",async()=>{
    let attempts=0;
    const {page,context}=await fixture(async(route,request)=>{
      if(new URL(request.url()).pathname==="/api/crm/workspace"&&++attempts===1){
        await route.fulfill({status:503,json:{error:"Lista indisponível no teste."}});return true;
      }
    });
    try{
      await ready(page);
      await page.getByRole("alert").filter({hasText:"Lista indisponível"}).waitFor();
      await page.getByRole("button",{name:"Tentar carregar atendimentos novamente"}).click();
      await verifyNoAlert(page);assert.equal(attempts,2);
    }finally{await context.close();}
  });
  await test("lost task response preserves draft and retries with the same idempotency key",async()=>{
    const requests=[];
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/tasks")&&request.method()==="POST"){
        requests.push({key:request.headers()["idempotency-key"],body:request.postData()});
        if(requests.length===1)await route.abort("connectionfailed");
        else await route.fulfill({status:200,json:{id:"synthetic-task",replayed:true}});
        return true;
      }
    });
    try{
      await ready(page);
      await page.locator("#crm-task").fill("Retornar contato sintético");
      await page.locator('[name="dueAt"]').fill("2026-09-24T14:00");
      await page.locator('[name="assignee"]').fill("Equipe sintética");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator("#crm-task").inputValue(),"Retornar contato sintético");
      assert.equal(await page.locator('[name="dueAt"]').inputValue(),"2026-09-24T14:00");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await verifyNoAlert(page);
      await page.waitForFunction(()=>document.getElementById("crm-task")?.value==="");
      assert.equal(requests.length,2);assert.ok(requests[0].key);
      assert.deepEqual(requests[1],requests[0]);
    }finally{await context.close();}
  });
  await test("a failed note preserves its text and a successful task refresh preserves the note draft",async()=>{
    let taskRefreshServed=false;
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/activities")){await route.fulfill({status:400,json:{error:"Nota rejeitada no teste."}});return true;}
      if(request.url().endsWith("/tasks")){await route.fulfill({status:201,json:{id:"synthetic-task"}});return true;}
      if(request.url().endsWith(leads[0].id)&&request.method()==="GET"&&taskRefreshServed){
        await route.fulfill({json:{...details[0],activities:[{id:"refresh",kind:"note",body:"Refresh concluído",author:"QA",created_at:Date.now()}]}});
        return true;
      }
    });
    try{
      await ready(page);await page.locator("#crm-note").fill("Texto para preservar");
      await page.getByRole("button",{name:"Adicionar nota",exact:true}).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator("#crm-note").inputValue(),"Texto para preservar");
      await page.locator("#crm-task").fill("Outra tarefa");
      taskRefreshServed=true;
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await verifyNoAlert(page);
      await page.getByText("Refresh concluído").waitFor();
      assert.equal(await page.locator("#crm-note").inputValue(),"Texto para preservar");
    }finally{await context.close();}
  });
  await test("a late note response cannot clear the draft of another selected lead",async()=>{
    let resolvePost;
    const postArrived=new Promise(resolve=>{resolvePost=resolve;});
    let releasePost;
    const released=new Promise(resolve=>{releasePost=resolve;});
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/activities")){
        resolvePost();await released;
        await route.fulfill({status:201,json:{saved:true}});return true;
      }
    });
    try{
      await ready(page);await page.locator("#crm-note").fill("Nota A");
      await page.getByRole("button",{name:"Adicionar nota",exact:true}).click();await postArrived;
      await page.getByRole("button",{name:/Cliente sintético B/}).click();
      await page.getByRole("heading",{name:"Cliente sintético B",exact:true}).waitFor();
      await page.locator("#crm-note").fill("Rascunho B");
      releasePost();
      await page.getByRole("button",{name:"Adicionar nota",exact:true}).waitFor();
      await page.waitForFunction(()=>!document.querySelector(".crm-timeline button")?.disabled);
      assert.equal(await page.locator("#crm-note").inputValue(),"Rascunho B");
    }finally{releasePost();await context.close();}
  });
  await test("edited task payload and a new task after success use new keys",async()=>{
    const keys=[];
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/tasks")){
        keys.push(request.headers()["idempotency-key"]);
        if(keys.length===1)await route.fulfill({status:400,json:{error:"Rejeição sintética."}});
        else await route.fulfill({status:201,json:{id:`task-${keys.length}`}});
        return true;
      }
    });
    try{
      await ready(page);await page.locator("#crm-task").fill("Tarefa inicial");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.getByRole("alert").waitFor();
      await page.locator("#crm-task").fill("Tarefa corrigida");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.waitForFunction(()=>document.getElementById("crm-task")?.value==="");
      await page.locator("#crm-task").fill("Tarefa corrigida");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.waitForFunction(()=>document.getElementById("crm-task")?.value==="");
      assert.equal(keys.length,3);assert.equal(new Set(keys).size,3);
    }finally{await context.close();}
  });
  await test("text edited during a note submission survives the successful refresh",async()=>{
    let release;
    const released=new Promise(resolve=>{release=resolve;});
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/activities")){
        await released;await route.fulfill({status:201,json:{saved:true}});return true;
      }
    });
    try{
      await ready(page);await page.locator("#crm-note").fill("Texto enviado");
      await page.getByRole("button",{name:"Adicionar nota",exact:true}).click();
      await page.locator("#crm-note").fill("Novo rascunho durante envio");
      const refreshed=page.waitForResponse(response=>response.url().endsWith(leads[0].id));
      release();await refreshed;
      await page.waitForFunction(()=>!document.querySelector(".crm-timeline button")?.disabled);
      assert.equal(await page.locator("#crm-note").inputValue(),"Novo rascunho durante envio");
    }finally{release();await context.close();}
  });
  await test("non-JSON server error exposes useful text and preserves note draft",async()=>{
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/activities")){
        await route.fulfill({status:502,contentType:"text/html",body:"<h1>Bad Gateway</h1>"});return true;
      }
    });
    try{
      await ready(page);await page.locator("#crm-note").fill("Rascunho preservado");
      await page.getByRole("button",{name:"Adicionar nota",exact:true}).click();
      await page.getByRole("alert").filter({hasText:"Não foi possível confirmar o envio"}).waitFor();
      assert.equal(await page.locator("#crm-note").inputValue(),"Rascunho preservado");
    }finally{await context.close();}
  });
  await test("selecting the same lead after detail failure keeps the retry state",async()=>{
    let attempts=0;
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith(leads[0].id)&&request.method()==="GET"&&++attempts===1){
        await route.fulfill({status:503,json:{error:"Detalhe ainda indisponível."}});return true;
      }
    });
    try{
      await page.getByRole("alert").filter({hasText:"Detalhe ainda indisponível"}).waitFor();
      await page.getByRole("button",{name:/Cliente sintético A/}).click();
      await page.getByRole("button",{name:"Tentar abrir atendimento novamente"}).waitFor();
      assert.equal(attempts,1);
    }finally{await context.close();}
  });
  await test("returning to an uncertain task payload reuses its original key",async()=>{
    const requests=[];
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/tasks")){
        requests.push({key:request.headers()["idempotency-key"],body:request.postData()});
        if(requests.length<4)await route.abort("connectionfailed");
        else await route.fulfill({status:201,json:{id:"task-final"}});
        return true;
      }
    });
    try{
      await ready(page);
      await page.locator("#crm-task").fill("Tentativa X");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.getByRole("alert").waitFor();
      await page.locator("#crm-task").fill("Tentativa Y");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.getByRole("alert").waitFor();
      await page.locator("#crm-task").fill("Tentativa X");
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await page.getByRole("alert").waitFor();
      await page.getByRole("button",{name:"Criar tarefa",exact:true}).click();
      await verifyNoAlert(page);
      assert.equal(requests.length,4);
      assert.equal(requests[0].key,requests[2].key);
      assert.notEqual(requests[0].key,requests[1].key);
      assert.deepEqual(requests[3],requests[2]);
    }finally{await context.close();}
  });
}finally{
  await browser?.close();server.close();await once(server,"close");
}
console.log(JSON.stringify({scope:"local-browser-synthetic-network",passed:reports.length-failed,failed,reports},null,2));
process.exitCode=failed?1:0;
