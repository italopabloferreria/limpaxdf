import {test} from "node:test";
import assert from "node:assert/strict";
import {listCrmLeadsFromSupabase,listCrmWorkspaceLeads,type SupabaseLeadReadClient} from "../lib/crm-data";
import {createSupabaseUserClient,isSupabasePublicKey} from "../lib/supabase";
import {normalizeSupabaseAccessToken,readSupabaseAccessToken} from "../lib/supabase-session";

type Row={seq:number;id:string;payload:Record<string,unknown>|string|null;status:string;mode:string;created_at:number;updated_at:number|null;assigned_to:string|null;next_action_at:number|null};

const rows:Row[]=Array.from({length:12},(_,i)=>({
  seq:i+1,
  id:"lead-"+String(i).padStart(2,"0"),
  payload:{name:"Cliente "+i,phone:"1199999999"+i,email:"cliente"+i+"@example.test",problem:"fossa",region:i%2?"Norte":"Sul",property:"residencia"},
  status:i<3?"qualificado":"novo",
  mode:"review",
  created_at:1_800_000_000_000+i,
  updated_at:i===0?null:1_800_000_001_000+i,
  assigned_to:i===1?"ana@example.test":null,
  next_action_at:i===2?1_800_100_000_000:null
}));

test("Supabase lead adapter maps, filters and paginates CRM workspace reads",async()=>{
  const client=fakeSupabase(rows);
  const first=await listCrmLeadsFromSupabase(client,{page:1,pageSize:10});
  assert.equal(first.total,12);
  assert.equal(first.pages,2);
  assert.equal(first.leads.length,10);
  assert.equal(first.totals.qualificado,3);
  assert.equal(first.leads[0].contact.name,"Cliente 11");
  assert.equal(first.leads[0].createdAt,1_800_000_000_011);

  const filtered=await listCrmLeadsFromSupabase(client,{search:"Norte",status:"novo",pageSize:10});
  assert.equal(filtered.total,5);
  assert.equal(filtered.leads.every(lead=>lead.status==="novo"&&lead.contact.region==="Norte"),true);
  assert.equal(filtered.totals.qualificado,3);
});

test("Supabase lead adapter converts string payloads and fails closed on read errors",async()=>{
  const payload=rows[0].payload as Record<string,unknown>;
  const client=fakeSupabase([{...rows[0],payload:JSON.stringify({...payload,name:"Texto JSON"})}]);
  const result=await listCrmLeadsFromSupabase(client,{pageSize:10});
  assert.equal(result.leads[0].contact.name,"Texto JSON");
  await assert.rejects(listCrmLeadsFromSupabase(fakeSupabase(rows,{fail:true}),{pageSize:10}),{status:503});
});

test("Supabase read mode requires an explicit Supabase session token",async()=>{
  await assert.rejects(listCrmWorkspaceLeads({SUPABASE_DATA_MODE:"read_only"},{pageSize:10}),{status:503});
});

test("Supabase session token is extracted from one explicit bearer source only",()=>{
  const token=jwt("crm-member");
  assert.equal(readSupabaseAccessToken(new Request("https://test",{headers:{authorization:"Bearer "+token}})),token);
  assert.equal(readSupabaseAccessToken(new Request("https://test",{headers:{"x-supabase-access-token":token}})),token);
  assert.equal(readSupabaseAccessToken(new Request("https://test")),undefined);
  assert.throws(()=>readSupabaseAccessToken(new Request("https://test",{headers:{authorization:"Token "+token}})),{status:400});
  assert.throws(()=>readSupabaseAccessToken(new Request("https://test",{headers:{authorization:"Bearer "+token,"x-supabase-access-token":token}})),{status:400});
  assert.throws(()=>normalizeSupabaseAccessToken("not-a-jwt"),{status:400});
});

test("Supabase user client forwards bearer token without requiring a refresh token",async()=>{
  const token=jwt("crm-member");
  const previous=globalThis.fetch;
  try{
    let authorization:string|null=null;
    globalThis.fetch=async(_input,init)=>{
      authorization=new Headers(init?.headers).get("authorization");
      return new Response(JSON.stringify([]),{headers:{"content-type":"application/json","content-range":"0-0/0"}});
    };
    const client=createSupabaseUserClient({
      SUPABASE_URL:"https://lkamarbpjqlibxlmcico.supabase.co",
      SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test",
      SUPABASE_PROJECT_REF:"lkamarbpjqlibxlmcico"
    },token);
    assert(client);
    await client.from("leads").select("id").limit(1);
    assert.equal(authorization,"Bearer "+token);
  }finally{
    globalThis.fetch=previous;
  }
});

function fakeSupabase(seed:Row[],options:{fail?:boolean}={}):SupabaseLeadReadClient{
  return {from(table:"leads"){assert.equal(table,"leads");return {select(_columns:string,selectOptions?:{count?: "exact";head?:boolean}){return new Query(seed,options.fail??false,selectOptions?.head??false)}}}} as unknown as SupabaseLeadReadClient;
}

class Query implements PromiseLike<{data:Row[]|null;error:{message:string}|null;count?:number|null}>{
  private status:string|null=null;
  private pattern:string|null=null;
  private orders:{column:string;ascending:boolean;nullsFirst:boolean}[]=[];
  private bounds:{from:number;to:number}|null=null;
  constructor(private readonly seed:Row[],private readonly fail:boolean,private readonly head:boolean){}
  eq(column:string,value:string){assert.equal(column,"status");this.status=value;return this}
  or(filters:string){
    const match=/^payload->>name\.ilike\.("(?:\\.|[^"\\])*")/.exec(filters);
    assert(match,"Search must extract JSON as text and quote the pattern");
    this.pattern=JSON.parse(match[1]).replace(/^%|%$/g,"").toLowerCase();return this;
  }
  order(column:string,options:{ascending?:boolean;nullsFirst?:boolean}={}){this.orders.push({column,ascending:options.ascending??true,nullsFirst:options.nullsFirst??true});return this}
  range(from:number,to:number){this.bounds={from,to};return this}
  then<TResult1={data:Row[]|null;error:{message:string}|null;count?:number|null},TResult2=never>(resolve?:((value:{data:Row[]|null;error:{message:string}|null;count?:number|null})=>TResult1|PromiseLike<TResult1>)|null,reject?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null){return Promise.resolve(this.execute()).then(resolve,reject)}
  private execute(){
    if(this.fail)return {data:null,error:{message:"boom"},count:null};
    let data=this.seed.slice();
    if(this.status)data=data.filter(row=>row.status===this.status);
    if(this.pattern)data=data.filter(row=>JSON.stringify(row.payload).toLowerCase().includes(this.pattern!));
    const count=data.length;
    for(const order of this.orders.slice().reverse()){
      data=data.slice().sort((a,b)=>compareValues(a[order.column as keyof Row],b[order.column as keyof Row],order.ascending,order.nullsFirst));
    }
    if(this.bounds)data=data.slice(this.bounds.from,this.bounds.to+1);
    else data=data.slice(0,1000); // Mimic the Data API default row limit.
    return {data:this.head?null:data,error:null,count};
  }
}

function compareValues(a:unknown,b:unknown,ascending:boolean,nullsFirst:boolean){
  const aNull=a==null,bNull=b==null;
  if(aNull||bNull){
    if(aNull&&bNull)return 0;
    if(aNull)return nullsFirst?-1:1;
    return nullsFirst?1:-1;
  }
  const result=typeof a==="number"&&typeof b==="number"?a-b:String(a).localeCompare(String(b),undefined,{numeric:true});
  return ascending?result:-result;
}

test("Supabase totals remain exact above the Data API row cap",async()=>{
  const many=Array.from({length:1205},(_,i)=>({...rows[0],id:`large-${i}`,seq:i,status:"novo"}));
  const result=await listCrmLeadsFromSupabase(fakeSupabase(many),{pageSize:10});
  assert.equal(result.total,1205);
  assert.equal(result.totals.novo,1205);
  assert.equal(result.leads.length,10);
});

test("only publishable and legacy anon keys can reach the browser",()=>{
  const legacy=(role:string)=>`e30.${Buffer.from(JSON.stringify({role})).toString('base64url')}.signature`;
  assert.equal(isSupabasePublicKey('sb_publishable_test'),true);
  assert.equal(isSupabasePublicKey(legacy('anon')),true);
  assert.equal(isSupabasePublicKey(legacy('service_role')),false);
  assert.equal(isSupabasePublicKey('sb_secret_test'),false);
  assert.equal(isSupabasePublicKey('invalid-key'),false);
});

test("real Supabase client serializes JSON text search without filter injection",async()=>{
  const previous=globalThis.fetch;
  const requests:{url:URL;method:string}[]=[];
  try{
    globalThis.fetch=async(input,init)=>{
      requests.push({url:new URL(String(input)),method:init?.method||'GET'});
      return new Response(init?.method==='HEAD'?null:'[]',{headers:{'content-type':'application/json','content-range':'*/0'}});
    };
    const client=createSupabaseUserClient({SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},jwt('test'));
    assert(client);
    await listCrmLeadsFromSupabase(client as unknown as SupabaseLeadReadClient,{search:'Ana, ("Sul")'});
    const filter=requests[0].url.searchParams.get('or');
    assert(filter?.startsWith('(payload->>name.ilike."%Ana, (\\"Sul\\")%"'));
    assert.equal(requests.filter(request=>request.method==='GET').length,1);
    assert.equal(requests.filter(request=>request.method==='HEAD').length,10);
  }finally{globalThis.fetch=previous}
});

function jwt(seed:string){
  const part=Buffer.from(seed).toString("base64url");
  return [part,part,part].join(".");
}
