import {settings} from "@/lib/config";
import {database} from "@/lib/http";
import {CrmWorkspace} from "@/components/crm-workspace";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {listCrmLeads} from "@/lib/crm-data";
import {crmPageAccess} from "@/lib/crm-page-access";
import {uuidSchema} from "@/lib/validation";

export const dynamic="force-dynamic";
type CrmPageProps={searchParams?:Promise<{selected?:string|string[]}>};
export default async function CrmPage({searchParams}:CrmPageProps={}){
  const access=await crmPageAccess();
  if(!access.actor)return <CrmAccessGate status={access.status} returnTo="/crm"/>;
  const query=await searchParams;
  const requested=typeof query?.selected==="string"?query.selected:null;
  const initialSelected=requested&&uuidSchema.safeParse(requested).success?requested:null;
  const initial=await listCrmLeads(database(settings()),{page:1,pageSize:50});
  return <CrmWorkspace initial={initial} initialSelected={initialSelected} operator={access.actor.displayName} role={access.actor.role}/>;
}
