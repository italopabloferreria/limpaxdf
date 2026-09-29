import assert from "node:assert/strict";
import {beforeEach,test} from "node:test";
import {POST} from "../app/api/supabase/crm/customers/route";

type MockState={enabled:boolean;origin:string;actor:null|{isSuperAdmin:boolean};rpcError:null|{code:string};calls:unknown[]};
const state=globalThis as typeof globalThis & {__customerWriteMock:MockState};

beforeEach(()=>{
  state.__customerWriteMock={enabled:true,origin:"https://preview.example.test",actor:{isSuperAdmin:true},rpcError:null,calls:[]};
});

function request(body:unknown,origin="https://preview.example.test"){
  return {headers:new Headers({origin,"content-type":"application/json"}),json:async()=>body} as Parameters<typeof POST>[0];
}

const valid={action:"create",id:"123e4567-e89b-42d3-a456-426614174000",kind:"person",name:"Cliente Fictício",tradeName:null,expectedUpdatedAt:null};

test("bloqueia escrita quando a prévia está desligada",async()=>{
  state.__customerWriteMock.enabled=false;
  const response=await POST(request(valid));
  assert.equal(response.status,503);
  assert.equal(state.__customerWriteMock.calls.length,0);
});

test("rejeita origem externa e entrada inválida antes de chamar o banco",async()=>{
  assert.equal((await POST(request(valid,"https://other.example.test"))).status,403);
  assert.equal((await POST(request({...valid,expectedUpdatedAt:42}))).status,400);
  assert.equal((await POST(request({...valid,extra:"unexpected"}))).status,400);
  assert.equal(state.__customerWriteMock.calls.length,0);
});

test("exige sessão aprovada e privilégio de superadministrador",async()=>{
  state.__customerWriteMock.actor=null;
  assert.equal((await POST(request(valid))).status,401);
  state.__customerWriteMock.actor={isSuperAdmin:false};
  assert.equal((await POST(request(valid))).status,403);
  assert.equal(state.__customerWriteMock.calls.length,0);
});

test("cria cliente de revisão apenas com acesso de proprietário",async()=>{
  const response=await POST(request(valid));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{id:valid.id});
  assert.deepEqual(state.__customerWriteMock.calls,[{
    p_action:"create",p_id:valid.id,p_kind:"person",p_name:"Cliente Fictício",
    p_trade_name:null,p_expected_updated_at:null
  }]);
});

test("edita com versão e informa conflito de atualização",async()=>{
  const edit={...valid,action:"update",expectedUpdatedAt:123};
  state.__customerWriteMock.rpcError={code:"P0002"};
  assert.equal((await POST(request(edit))).status,409);
  state.__customerWriteMock.rpcError=null;
  assert.equal((await POST(request(edit))).status,200);
  assert.equal(state.__customerWriteMock.calls.length,2);
});
