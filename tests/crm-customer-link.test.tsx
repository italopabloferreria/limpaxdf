import {test} from "node:test";
import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";

type Fetcher=(input:string|URL|Request,init?:RequestInit)=>Promise<Response>;
type LinkModule={
  searchLinkableCustomers(fetcher:Fetcher,query:string,sourceMode?:"review"|"live"):Promise<Array<{id:string;name:string}>>;
  loadLinkableCustomer(fetcher:Fetcher,id:string):Promise<{id:string;contactList:Array<{id:string;primary:boolean}>;locationList:Array<{id:string;primary:boolean}>}>;
  saveLeadCustomerLink(fetcher:Fetcher,leadId:string,selection:{customerId:string;contactId?:string;locationId?:string}):Promise<void>;
  removeLeadCustomerLink(fetcher:Fetcher,leadId:string):Promise<void>;
  defaultLinkSelection(detail:{id:string;contactList:Array<{id:string;primary:boolean}>;locationList:Array<{id:string;primary:boolean}>}):{customerId:string;contactId?:string;locationId?:string};
};
async function linkModule():Promise<LinkModule|null>{
  try{return await import("../lib/crm-customer-link") as LinkModule}catch{return null}
}

test("customer search trims and encodes the query, returning the API customer options",async()=>{
  const link=await linkModule();
  assert.ok(link,"customer link service must exist");
  let requested="";
  const fetcher:Fetcher=async input=>{
    requested=String(input);
    return Response.json({customers:[{id:"customer-1",name:"Condomínio Águas",tradeName:null}]});
  };
  const result=await link.searchLinkableCustomers(fetcher,"  Águas & Sul  ","review");
  assert.equal(requested,"/api/crm/customers?pageSize=10&search=%C3%81guas+%26+Sul&mode=review");
  assert.deepEqual(result,[{id:"customer-1",name:"Condomínio Águas",tradeName:null}]);
});

test("link service preserves customer/contact/location identifiers and supports unlink",async()=>{
  const link=await linkModule();
  assert.ok(link,"customer link service must exist");
  const calls:Array<{url:string;method:string;body:string|null}>=[];
  const fetcher:Fetcher=async(input,init)=>{
    calls.push({url:String(input),method:init?.method||"GET",body:typeof init?.body==="string"?init.body:null});
    return Response.json({linked:true});
  };
  await link.saveLeadCustomerLink(fetcher,"lead-1",{customerId:"customer-1",contactId:"contact-1",locationId:"location-1"});
  await link.removeLeadCustomerLink(fetcher,"lead-1");
  assert.deepEqual(calls,[
    {url:"/api/crm/leads/lead-1/customer",method:"POST",body:'{"customerId":"customer-1","contactId":"contact-1","locationId":"location-1"}'},
    {url:"/api/crm/leads/lead-1/customer",method:"DELETE",body:null}
  ]);
});

test("default selection chooses primary contact and location from customer detail",async()=>{
  const link=await linkModule();
  assert.ok(link,"customer link service must exist");
  assert.deepEqual(link.defaultLinkSelection({
    id:"customer-1",
    contactList:[{id:"contact-secondary",primary:false},{id:"contact-primary",primary:true}],
    locationList:[{id:"location-primary",primary:true}]
  }),{customerId:"customer-1",contactId:"contact-primary",locationId:"location-primary"});
});

test("link API errors are exposed as useful interface errors",async()=>{
  const link=await linkModule();
  assert.ok(link,"customer link service must exist");
  const fetcher:Fetcher=async()=>Response.json({error:"Cliente arquivado."},{status:409});
  await assert.rejects(link.saveLeadCustomerLink(fetcher,"lead-1",{customerId:"customer-1"}),/Cliente arquivado/);
});

test("linker renders accessible unlinked and linked states",async()=>{
  let componentModule:null|typeof import("../components/lead-customer-linker")=null;
  try{componentModule=await import("../components/lead-customer-linker")}catch{}
  assert.ok(componentModule,"lead customer linker component must exist");
  const unlinked=renderToStaticMarkup(<componentModule.LeadCustomerLinker leadId="lead-1" linkedCustomer={null} onChanged={()=>{}}/>);
  assert.match(unlinked,/Buscar cliente/);
  assert.match(unlinked,/Vincular atendimento/);
  const linked=renderToStaticMarkup(<componentModule.LeadCustomerLinker leadId="lead-1" linkedCustomer={{customerId:"customer-1",customerName:"Cliente Teste",customerKind:"person",contactId:null,locationId:null,linkedAt:1,linkedBy:"admin@example.test"}} onChanged={()=>{}}/>);
  assert.match(linked,/Cliente Teste/);
  assert.match(linked,/Desvincular/);
});
