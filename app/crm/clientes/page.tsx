import {database} from "@/lib/http";
import {captureMode,settings} from "@/lib/config";
import {operationalDataMode} from "@/lib/crm-lifecycle";
import {listCustomers} from "@/lib/crm-customers";
import {CustomerWorkspace} from "@/components/customer-workspace";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {crmPageAccess} from "@/lib/crm-page-access";

export const dynamic="force-dynamic";
export default async function CustomersPage(){
  const access=await crmPageAccess();
  if(!access.actor)return <CrmAccessGate status={access.status} returnTo="/crm/clientes"/>;
  const s=settings(),dataMode=operationalDataMode(captureMode(s));
  const initial=await listCustomers(database(s),{sourceMode:dataMode});
  return <CustomerWorkspace initial={initial} operator={access.actor.displayName} role={access.actor.role} dataMode={dataMode}/>;
}
