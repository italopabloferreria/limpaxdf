import assert from "node:assert/strict";
import {beforeEach,test} from "node:test";
import {POST} from "../app/api/supabase/crm/leads/route";

type MockState={enabled:boolean;origin:string;actor:null|{isSuperAdmin:boolean};rpcError:null|{code:string};calls:Array<{name:string;args:Record<string,unknown>}>};
const state=globalThis as typeof globalThis & {__leadWriteMock:MockState};

beforeEach(()=>{
  state.__leadWriteMock={enabled:true,origin:"https://preview.example.test",actor:{isSuperAdmin:true},rpcError:null,calls:[]};
});

function request(body:unknown,origin="https://preview.example.test"){
  return {headers:new Headers({origin,"content-type":"application/json"}),json:async()=>body} as Parameters<typeof POST>[0];
}

const valid={action:"create",id:"123e4567-e89b-42d3-a456-426614174000",name:"Atendimento Fictício",phone:"",email:"",problem:"Solicitação de teste",region:"",status:"novo",expectedUpdatedAt:null};

test("bloqueia quando o modo de escrita Preview está desligado",async()=>{
  state.__leadWriteMock.enabled=false;
  assert.equal((await POST(request(valid))).status,503);
  assert.equal(state.__leadWriteMock.calls.length,0);
});

test("rejeita origem, campos extras, versão e estado inválidos",async()=>{
  assert.equal((await POST(request(valid,"https://other.example.test"))).status,403);
  assert.equal((await POST(request({...valid,extra:"unexpected"}))).status,400);
  assert.equal((await POST(request({...valid,expectedUpdatedAt:10}))).status,400);
  assert.equal((await POST(request({...valid,status:"concluido"}))).status,400);
  assert.equal((await POST(request({...valid,email:"invalid"}))).status,400);
  assert.equal(state.__leadWriteMock.calls.length,0);
});

test("exige perfil aprovado e privilégio de proprietário",async()=>{
  state.__leadWriteMock.actor=null;
  assert.equal((await POST(request(valid))).status,401);
  state.__leadWriteMock.actor={isSuperAdmin:false};
  assert.equal((await POST(request(valid))).status,403);
  assert.equal(state.__leadWriteMock.calls.length,0);
});

test("cria atendimento de revisão usando função protegida",async()=>{
  const response=await POST(request(valid));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{id:valid.id});
  assert.deepEqual(state.__leadWriteMock.calls,[{name:"crm_save_review_lead",args:{
    p_action:"create",p_id:valid.id,p_name:valid.name,p_phone:"",p_email:"",
    p_problem:valid.problem,p_region:"",p_status:"novo",p_expected_updated_at:null
  }}]);
});

test("edita com versão e informa conflito de concorrência",async()=>{
  const edit={...valid,action:"update",status:"em_contato",expectedUpdatedAt:123};
  state.__leadWriteMock.rpcError={code:"P0002"};
  assert.equal((await POST(request(edit))).status,409);
  state.__leadWriteMock.rpcError=null;
  assert.equal((await POST(request(edit))).status,200);
  assert.equal(state.__leadWriteMock.calls.length,2);
  assert.equal(state.__leadWriteMock.calls[1].args.p_expected_updated_at,123);
});
