import {settings} from "@/lib/config";
import {database} from "@/lib/http";
import {CrmWorkspace} from "@/components/crm-workspace";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {listCrmLeads} from "@/lib/crm-data";
import {listCrmLeadsFromSupabase,type SupabaseLeadReadClient} from "@/lib/crm-data";
import {crmPageAccess} from "@/lib/crm-page-access";
import {supabaseCrmPageAccess,supabaseCrmReadEnabled,supabaseCrmWriteEnabled} from "@/lib/supabase-crm-access";
import {SupabaseCrmReadonly} from "@/components/supabase-crm-readonly";
import {uuidSchema} from "@/lib/validation";
import {crmStatuses} from "@/lib/crm-shared";
import {redirect} from "next/navigation";

export const dynamic="force-dynamic";
type CrmPageProps={searchParams?:Promise<{selected?:string|string[];page?:string|string[];search?:string|string[];status?:string|string[]}>};
export default async function CrmPage({searchParams}:CrmPageProps){
  const s=settings();
  if(supabaseCrmReadEnabled(s)){
    const access=await supabaseCrmPageAccess();
    if(!access)redirect("/supabase/homologacao");
    const query=await searchParams;
    const pageValue=typeof query?.page==="string"?Number(query.page):1;
    const page=Number.isSafeInteger(pageValue)&&pageValue>0?pageValue:1;
    const search=typeof query?.search==="string"?query.search.trim().slice(0,120):"";
    const status=crmStatuses.find(value=>value===query?.status);
    const requested=typeof query?.selected==="string"?query.selected:null;
    const selectedId=requested&&uuidSchema.safeParse(requested).success?requested:null;
    const listing=await listCrmLeadsFromSupabase(access.client as unknown as SupabaseLeadReadClient,{page,pageSize:50,search,status});
    return <SupabaseCrmReadonly listing={listing} actor={access.actor} selectedId={selectedId} search={search} status={status} writeEnabled={supabaseCrmWriteEnabled(s)&&access.actor.isSuperAdmin}/>;
  }
  const access=await crmPageAccess();
  if(!access.actor)return <CrmAccessGate status={access.status} returnTo="/crm"/>;
  const query=await searchParams;
  const requested=typeof query?.selected==="string"?query.selected:null;
  const initialSelected=requested&&uuidSchema.safeParse(requested).success?requested:null;
  const initial=await listCrmLeads(database(s),{page:1,pageSize:50});
  return <CrmWorkspace initial={initial} initialSelected={initialSelected} operator={access.actor.displayName} role={access.actor.role}/>;
}
