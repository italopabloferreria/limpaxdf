import type {SupabaseClient} from "@supabase/supabase-js";
import {ApiError} from "./http";

export type SupabaseCustomer={id:string;kind:"person"|"organization";name:string;tradeName:string|null;sourceMode:string;updatedAt:number};
export type SupabaseCustomerDetail={contacts:Array<{id:string;name:string;phone:string|null;email:string|null}>;locations:Array<{id:string;label:string;address:string|null;city:string|null;state:string|null}>};

export async function listSupabaseCustomers(client:SupabaseClient){
  const {data,error,count}=await client.from("customers")
    .select("id,kind,name,trade_name,source_mode,updated_at",{count:"exact"})
    .is("archived_at",null).order("updated_at",{ascending:false}).limit(50);
  if(error)throw new ApiError(503,"Não foi possível consultar os clientes.");
  const customers:SupabaseCustomer[]=(data||[]).map(row=>({
    id:String(row.id),kind:row.kind==="organization"?"organization":"person",
    name:String(row.name),tradeName:row.trade_name?String(row.trade_name):null,
    sourceMode:String(row.source_mode),updatedAt:Number(row.updated_at)
  }));
  return {customers,total:Number(count||0)};
}

export async function getSupabaseCustomerDetail(client:SupabaseClient,id:string):Promise<SupabaseCustomerDetail>{
  const [contacts,locations]=await Promise.all([
    client.from("customer_contacts").select("id,name,phone,email").eq("customer_id",id).order("is_primary",{ascending:false}).order("created_at"),
    client.from("service_locations").select("id,label,address,city,state").eq("customer_id",id).order("is_primary",{ascending:false}).order("created_at")
  ]);
  if(contacts.error||locations.error)throw new ApiError(503,"Não foi possível abrir o cliente.");
  return {contacts:(contacts.data||[]).map(row=>({id:String(row.id),name:String(row.name),phone:row.phone?String(row.phone):null,email:row.email?String(row.email):null})),locations:(locations.data||[]).map(row=>({id:String(row.id),label:String(row.label),address:row.address?String(row.address):null,city:row.city?String(row.city):null,state:row.state?String(row.state):null}))};
}
