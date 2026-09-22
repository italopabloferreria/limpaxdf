export type CrmFetcher=(input:string|URL|Request,init?:RequestInit)=>Promise<Response>;

export type LinkableCustomer={id:string;name:string;tradeName:string|null};

export type LinkableCustomerDetail=LinkableCustomer&{
  kind:"person"|"organization";
  contactList:Array<{id:string;name:string;role:string|null;phone:string|null;email:string|null;primary:boolean}>;
  locationList:Array<{id:string;label:string;address:string|null;number:string|null;district:string|null;city:string|null;primary:boolean}>;
};

export type LeadCustomerSelection={customerId:string;contactId?:string;locationId?:string};

async function responseBody(response:Response):Promise<Record<string,unknown>>{
  try{return await response.json() as Record<string,unknown>}catch{return {}}
}

async function expectOk(response:Response,fallback:string){
  const body=await responseBody(response);
  if(!response.ok)throw new Error(typeof body.error==="string"?body.error:fallback);
  return body;
}

export async function searchLinkableCustomers(fetcher:CrmFetcher,query:string,sourceMode?:"review"|"live"):Promise<LinkableCustomer[]>{
  const params=new URLSearchParams({pageSize:"10",search:query.trim()});
  if(sourceMode)params.set("mode",sourceMode);
  const body=await expectOk(await fetcher("/api/crm/customers?"+params),"Não foi possível buscar clientes.");
  return Array.isArray(body.customers)?body.customers as LinkableCustomer[]:[];
}

export async function loadLinkableCustomer(fetcher:CrmFetcher,id:string):Promise<LinkableCustomerDetail>{
  const response=await fetcher("/api/crm/customers/"+encodeURIComponent(id));
  return await expectOk(response,"Não foi possível abrir o cliente.") as unknown as LinkableCustomerDetail;
}

export async function saveLeadCustomerLink(fetcher:CrmFetcher,leadId:string,selection:LeadCustomerSelection):Promise<void>{
  await expectOk(await fetcher("/api/crm/leads/"+encodeURIComponent(leadId)+"/customer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(selection)}),"Não foi possível vincular o cliente.");
}

export async function removeLeadCustomerLink(fetcher:CrmFetcher,leadId:string):Promise<void>{
  await expectOk(await fetcher("/api/crm/leads/"+encodeURIComponent(leadId)+"/customer",{method:"DELETE"}),"Não foi possível remover o vínculo.");
}

export function defaultLinkSelection(detail:Pick<LinkableCustomerDetail,"id"|"contactList"|"locationList">):LeadCustomerSelection{
  const contact=detail.contactList.find(item=>item.primary)??detail.contactList[0];
  const location=detail.locationList.find(item=>item.primary)??detail.locationList[0];
  return {customerId:detail.id,...(contact?{contactId:contact.id}:{}),...(location?{locationId:location.id}:{})};
}
