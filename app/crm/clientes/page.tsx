import {database} from "@/lib/http";
import {captureMode,settings} from "@/lib/config";
import {operationalDataMode} from "@/lib/crm-lifecycle";
import {listCustomers} from "@/lib/crm-customers";
import {CustomerWorkspace} from "@/components/customer-workspace";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {crmPageAccess} from "@/lib/crm-page-access";
import {supabaseCrmPageAccess,supabaseCrmReadEnabled} from "@/lib/supabase-crm-access";
import {getSupabaseCustomerDetail,listSupabaseCustomers} from "@/lib/supabase-crm-customers";
import {SupabaseCustomersReadonly} from "@/components/supabase-customers-readonly";
import {uuidSchema} from "@/lib/validation";

export const dynamic="force-dynamic";
type CustomersPageProps={searchParams?:Promise<{selected?:string|string[]}>};
export default async function CustomersPage({searchParams}:CustomersPageProps){
  const s=settings();
  if(supabaseCrmReadEnabled(s)){
    const access=await supabaseCrmPageAccess();
    if(!access)return <CrmAccessGate status={401} returnTo="/crm/clientes"/>;
    const {customers,total}=await listSupabaseCustomers(access.client);
    const query=await searchParams;
    const requested=typeof query?.selected==="string"?query.selected:null;
    const selectedId=requested&&uuidSchema.safeParse(requested).success?requested:null;
    const selected=customers.find(item=>item.id===selectedId)||customers[0]||null;
    const detail=selected?await getSupabaseCustomerDetail(access.client,selected.id):null;
    return <SupabaseCustomersReadonly actor={access.actor} customers={customers} total={total} selected={selected} detail={detail}/>;
  }
  const access=await crmPageAccess();
  if(!access.actor)return <CrmAccessGate status={access.status} returnTo="/crm/clientes"/>;
  const dataMode=operationalDataMode(captureMode(s));
  const initial=await listCustomers(database(s),{sourceMode:dataMode});
  return <CustomerWorkspace initial={initial} operator={access.actor.displayName} role={access.actor.role} dataMode={dataMode}/>;
}
