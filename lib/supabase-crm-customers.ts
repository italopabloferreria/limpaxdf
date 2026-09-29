import type {SupabaseClient} from "@supabase/supabase-js";
import {ApiError} from "./http";

export type SupabaseCustomer={id:string;kind:"person"|"organization";name:string;tradeName:string|null;sourceMode:string;updatedAt:number};
export type SupabaseCustomerDetail={contacts:Array<{id:string;name:string;phone:string|null;email:string|null}>;locations:Array<{id:string;label:string;address:string|null;city:string|null;state:string|null}>};
export type SupabaseCustomerListOptions={page?:number;pageSize?:number;search?:string};

export async function listSupabaseCustomers(client:SupabaseClient,{page=1,pageSize=30,search=""}:SupabaseCustomerListOptions={}){
  const size=Math.min(100,Math.max(10,Math.trunc(pageSize)));
  const wanted=Math.max(1,Math.trunc(page));
  const filter=<T extends {is:(column:string,value:null)=>T;or:(value:string)=>T}>(query:T)=>{
    let current=query.is("archived_at",null);
    if(search){
      const pattern=("%"+search.replace(/[\\%_]/g,match=>"\\"+match)+"%").replace(/\\/g,"\\\\").replace(/"/g,'\\"');
      current=current.or(`name.ilike."${pattern}",trade_name.ilike."${pattern}"`);
    }
    return current;
  };
  const countResult=await filter(client.from("customers").select("id",{count:"exact",head:true}));
  if(countResult.error)throw new ApiError(503,"Não foi possível consultar os clientes.");
  const total=Number(countResult.count||0),pages=Math.max(1,Math.ceil(total/size)),currentPage=Math.min(wanted,pages);
  const {data,error}=await filter(client.from("customers")
    .select("id,kind,name,trade_name,source_mode,updated_at"))
    .order("updated_at",{ascending:false}).order("id",{ascending:false})
    .range((currentPage-1)*size,currentPage*size-1);
  if(error)throw new ApiError(503,"Não foi possível consultar os clientes.");
  const customers:SupabaseCustomer[]=(data||[]).map(row=>({
    id:String(row.id),kind:row.kind==="organization"?"organization":"person",
    name:String(row.name),tradeName:row.trade_name?String(row.trade_name):null,
    sourceMode:String(row.source_mode),updatedAt:Number(row.updated_at)
  }));
  return {customers,total,page:currentPage,pageSize:size,pages};
}

export async function getSupabaseCustomerDetail(client:SupabaseClient,id:string):Promise<SupabaseCustomerDetail>{
  const [contacts,locations]=await Promise.all([
    client.from("customer_contacts").select("id,name,phone,email").eq("customer_id",id).order("is_primary",{ascending:false}).order("created_at"),
    client.from("service_locations").select("id,label,address,city,state").eq("customer_id",id).order("is_primary",{ascending:false}).order("created_at")
  ]);
  if(contacts.error||locations.error)throw new ApiError(503,"Não foi possível abrir o cliente.");
  return {contacts:(contacts.data||[]).map(row=>({id:String(row.id),name:String(row.name),phone:row.phone?String(row.phone):null,email:row.email?String(row.email):null})),locations:(locations.data||[]).map(row=>({id:String(row.id),label:String(row.label),address:row.address?String(row.address):null,city:row.city?String(row.city):null,state:row.state?String(row.state):null}))};
}
