import {test} from "node:test";
import assert from "node:assert/strict";

type Detail={lead:{id:string;status:string};marker:string};
type SelectionModule={
  acceptLeadResponse<T>(selectedId:string|null,requestId:string,value:T):T|null;
  applyLeadUpdate<T extends {lead:{id:string}}>(current:T|null,selectedId:string|null,requestId:string,update:Record<string,unknown>):T|null;
};
async function selectionModule():Promise<SelectionModule|null>{
  try{return await import("../lib/crm-selection-state") as SelectionModule}catch{return null}
}

test("a late detail response cannot replace the lead selected after its request started",async()=>{
  const selection=await selectionModule();
  assert.ok(selection,"CRM selection state module must implement stale-response protection");
  const stale:Detail={lead:{id:"lead-a",status:"novo"},marker:"late"};
  assert.equal(selection.acceptLeadResponse("lead-b","lead-a",stale),null);
  assert.equal(selection.acceptLeadResponse("lead-a","lead-a",stale),stale);
});

test("a late update response cannot mutate the newly selected lead detail",async()=>{
  const selection=await selectionModule();
  assert.ok(selection,"CRM selection state module must implement stale-update protection");
  const current:Detail={lead:{id:"lead-b",status:"novo"},marker:"current"};
  assert.equal(selection.applyLeadUpdate(current,"lead-b","lead-a",{status:"ganho"}),current);
  assert.deepEqual(selection.applyLeadUpdate(current,"lead-b","lead-b",{status:"qualificado"}),{
    lead:{id:"lead-b",status:"qualificado"},
    marker:"current"
  });
});
