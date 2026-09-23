import {build} from "esbuild";
import {createServer} from "node:http";
import {once} from "node:events";
import assert from "node:assert/strict";
import path from "node:path";
import {pathToFileURL} from "node:url";

const {chromium}=await import(process.env.LIMPAX_PLAYWRIGHT_MODULE
  ?pathToFileURL(process.env.LIMPAX_PLAYWRIGHT_MODULE).href:"playwright");
const bundle=await build({
  entryPoints:["tests/customer-network-fixture.tsx"],bundle:true,write:false,
  platform:"browser",format:"esm",jsx:"automatic",
  alias:{"next/link":path.resolve("tests/next-link-stub.tsx")},
  plugins:[{
    name:"css-module-proxy",
    setup(build){
      build.onLoad({filter:/\.module\.css$/},()=>({
        contents:"export default new Proxy({}, { get: (_, key) => String(key) });",
        loader:"js"
      }));
    }
  }],
  define:{"process.env.NODE_ENV":'"development"'}
});
const server=createServer((request,response)=>{
  if(request.url==="/fixture.js"){
    response.writeHead(200,{"Content-Type":"text/javascript"}).end(bundle.outputFiles[0].text);
  }else{
    response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end('<!doctype html><html lang="pt-BR"><title>Customer network QA</title><div id="root"></div><script type="module" src="/fixture.js"></script></html>');
  }
});
server.listen(0,"127.0.0.1");
await once(server,"listening");

let browser;
let failed=0;
const reports=[];
const customers=["A","B"].map((label,index)=>({
  id:`10000000-0000-4000-8000-00000000000${index+1}`,
  kind:index?"organization":"person",
  name:`Cliente cadastro ${label}`,
  tradeName:index?`Empresa ${label}`:null,
  taxId:null,
  notes:null,
  sourceMode:"review",
  origin:"synthetic",
  archivedAt:null,
  createdAt:1_800_000_000_000,
  updatedAt:1_800_000_000_000,
  contacts:0,
  locations:0,
  primaryPhone:null,
  primaryEmail:null
}));
const listing={customers,total:2,page:1,pageSize:30,pages:1};
const details=customers.map(customer=>({
  ...customer,
  contactList:[],
  locationList:[],
  linkedLeads:[]
}));

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
    if(url.pathname==="/api/crm/customers")return route.fulfill({json:listing});
    const detail=details.find(item=>url.pathname===`/api/crm/customers/${item.id}`);
    if(detail&&request.method()==="GET")return route.fulfill({json:detail});
    return route.fulfill({status:500,json:{error:"Unexpected synthetic API request"}});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  return {page,context};
}

async function test(name,run){
  try{await run();reports.push({name,status:"PASS"});}
  catch(error){failed++;reports.push({name,status:"FAIL",error:error.message});}
}

async function ready(page){await page.getByRole("heading",{name:"Cliente cadastro A",exact:true}).waitFor();}
async function verifyNoAlert(page){await page.getByRole("alert").waitFor({state:"hidden"});}

try{
  browser=await chromium.launch({headless:true,...(process.env.LIMPAX_BROWSER_CHANNEL?{channel:process.env.LIMPAX_BROWSER_CHANNEL}:{})});
  await test("listing GET failure offers retry and keeps current detail",async()=>{
    let attempts=0;
    const {page,context}=await fixture(async(route,request)=>{
      if(new URL(request.url()).pathname==="/api/crm/customers"&&++attempts===1){
        await route.fulfill({status:503,json:{error:"Lista de clientes indisponível."}});return true;
      }
    });
    try{
      await ready(page);
      await page.getByRole("alert").filter({hasText:"Lista de clientes indisponível"}).waitFor();
      await page.getByRole("button",{name:"Tentar carregar clientes novamente"}).click();
      await verifyNoAlert(page);
      assert.equal(attempts,2);
    }finally{await context.close();}
  });

  await test("detail GET failure offers retry and selecting same customer keeps retry",async()=>{
    let attempts=0;
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith(customers[0].id)&&request.method()==="GET"&&++attempts===1){
        await route.fulfill({status:503,json:{error:"Cliente indisponível."}});return true;
      }
    });
    try{
      await page.getByRole("alert").filter({hasText:"Cliente indisponível"}).waitFor();
      await page.getByRole("button",{name:/Cliente cadastro A/}).click();
      await page.getByRole("button",{name:"Tentar abrir cliente novamente"}).waitFor();
      await page.getByRole("button",{name:"Tentar abrir cliente novamente"}).click();
      await ready(page);
      assert.equal(attempts,2);
    }finally{await context.close();}
  });

  await test("failed inline contact creation preserves draft",async()=>{
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/contacts")&&request.method()==="POST"){
        await route.fulfill({status:503,json:{error:"Contato recusado no teste."}});return true;
      }
    });
    try{
      await ready(page);
      await page.locator('[name="name"]').fill("Contato preservado");
      await page.locator('[name="phone"]').fill("(61) 99999-0000");
      await page.getByRole("button",{name:"Adicionar contato"}).click();
      await page.getByRole("alert").filter({hasText:"Contato recusado"}).waitFor();
      assert.equal(await page.locator('[name="name"]').inputValue(),"Contato preservado");
      assert.equal(await page.locator('[name="phone"]').inputValue(),"(61) 99999-0000");
    }finally{await context.close();}
  });

  await test("failed inline location creation preserves draft",async()=>{
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith("/locations")&&request.method()==="POST"){
        await route.fulfill({status:503,json:{error:"Local recusado no teste."}});return true;
      }
    });
    try{
      await ready(page);
      await page.locator('[name="label"]').fill("Local preservado");
      await page.locator('[name="address"]').fill("Rua sintética");
      await page.getByRole("button",{name:"Adicionar local"}).click();
      await page.getByRole("alert").filter({hasText:"Local recusado"}).waitFor();
      assert.equal(await page.locator('[name="label"]').inputValue(),"Local preservado");
      assert.equal(await page.locator('[name="address"]').inputValue(),"Rua sintética");
    }finally{await context.close();}
  });

  await test("non-JSON modal update error preserves edited customer draft",async()=>{
    const {page,context}=await fixture(async(route,request)=>{
      if(request.url().endsWith(customers[0].id)&&request.method()==="PATCH"){
        await route.fulfill({status:502,contentType:"text/html",body:"<h1>Bad Gateway</h1>"});return true;
      }
    });
    try{
      await ready(page);
      await page.getByRole("button",{name:"Editar dados"}).click();
      const dialog=page.getByRole("dialog");
      await dialog.getByLabel("Nome ou razão social").fill("Cliente editado");
      await dialog.getByRole("button",{name:"Salvar alterações"}).click();
      await dialog.getByRole("alert").filter({hasText:"Não foi possível atualizar o cliente"}).waitFor();
      assert.equal(await dialog.getByLabel("Nome ou razão social").inputValue(),"Cliente editado");
    }finally{await context.close();}
  });
}finally{
  await browser?.close();server.close();await once(server,"close");
}
console.log(JSON.stringify({scope:"local-browser-synthetic-customer-network",passed:reports.length-failed,failed,reports},null,2));
process.exitCode=failed?1:0;
