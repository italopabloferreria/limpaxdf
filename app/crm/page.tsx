import {getChatGPTUser,chatGPTSignInPath} from "@/app/chatgpt-auth";
import {settings} from "@/lib/config";
import {database} from "@/lib/http";
import {CrmWorkspace} from "@/components/crm-workspace";
import {listCrmLeads} from "@/lib/crm-data";
export const dynamic="force-dynamic";
export default async function CrmPage(){const user=await getChatGPTUser();const allowed=(settings().CRM_ADMIN_EMAILS||"").split(",").map(value=>value.trim().toLowerCase()).filter(Boolean);if(!user)return <main className="crm-gate"><p className="eyebrow">LIMPAX / CRM</p><h1>Acesso da equipe.</h1><p>Entre com uma conta autorizada para abrir a central de atendimentos.</p><a className="button" href={chatGPTSignInPath("/crm")}>Entrar no CRM</a></main>;if(!allowed.length||!allowed.includes(user.email.toLowerCase()))return <main className="crm-gate"><p className="eyebrow">LIMPAX / CRM</p><h1>CRM protegido.</h1><p>{allowed.length?"Esta conta não está na lista autorizada.":"Defina CRM_ADMIN_EMAILS nas configurações de produção para liberar a equipe."}</p></main>;const initial=await listCrmLeads(database(settings()),{page:1,pageSize:50});return <CrmWorkspace initial={initial} operator={user.displayName}/>}
