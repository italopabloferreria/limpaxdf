import {getChatGPTUser,type ChatGPTUser} from "@/app/chatgpt-auth";
import {settings} from "./config";
import {ApiError,database,requireOrigin} from "./http";
export {crmStatuses,statusLabels,type CrmStatus} from "./crm-shared";

export type CrmRole="admin"|"attendant";
export type CrmActor=ChatGPTUser&{role:CrmRole};

function emailList(value:string|undefined){return (value||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean)}
export function crmRoleFor(email:string,s=settings()):CrmRole|null{const normalized=email.toLowerCase();if(emailList(s.CRM_ADMIN_EMAILS).includes(normalized))return "admin";if(emailList(s.CRM_ATTENDANT_EMAILS).includes(normalized))return "attendant";return null}

export async function requireCrmUser():Promise<CrmActor>{
  const user=await getChatGPTUser();
  if(!user)throw new ApiError(401,"Entre com a conta autorizada para acessar o CRM.");
  const s=settings();
  const db=database(s);
  const email=user.email.toLowerCase();

  let profile:{role:string;active:number}|null;
  try{
    profile=await db.prepare(
      "SELECT role,active FROM crm_user_profiles WHERE email=?"
    ).bind(email).first<{role:string;active:number}>();
  }catch{
    // A failed lookup cannot establish absence or undo a persisted revocation.
    throw new ApiError(503,"Acesso ao CRM temporariamente indisponível.");
  }

  let role:CrmRole|null;
  if(profile){
    if(profile.active!==1)throw new ApiError(403,"Sua conta no CRM está desativada.");
    if(profile.role!=="admin"&&profile.role!=="attendant"){
      throw new ApiError(403,"Sua conta não está autorizada para o CRM.");
    }
    role=profile.role;
  }else{
    // Explicit allowlist remains the bootstrap path only after a successful lookup.
    role=crmRoleFor(email,s);
  }
  if(!role)throw new ApiError(403,"Sua conta não está autorizada para o CRM.");

  if(profile){
    try{
      await db.prepare(
        "UPDATE crm_user_profiles SET last_seen_at=? WHERE email=?"
      ).bind(Date.now(),email).run();
    }catch{
      // Activity telemetry must not change an already resolved access decision.
    }
  }
  return {...user,role};
}

export async function requireCrmMutation(req:Request){const s=settings();requireOrigin(req,s);return requireCrmUser()}
export async function requireCrmAdmin(req?:Request){const user=req?await requireCrmMutation(req):await requireCrmUser();if(user.role!=="admin")throw new ApiError(403,"Ação disponível apenas para administradores.");return user}

export function toDateTime(value:string|undefined){
  if(!value)return null;
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if(!match)throw new ApiError(400,"Informe a data com fuso horário.");
  const [,yearText,monthText,dayText,hourText,minuteText,secondText="0",zone]=match;
  const year=Number(yearText),month=Number(monthText),day=Number(dayText),hour=Number(hourText),minute=Number(minuteText),second=Number(secondText);
  if(month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate()||hour>23||minute>59||second>59)throw new ApiError(400,"Data inválida.");
  if(zone!=="Z"){const [offsetHour,offsetMinute]=zone.slice(1).split(":").map(Number);if(offsetHour>23||offsetMinute>59)throw new ApiError(400,"Data inválida.")}
  const time=Date.parse(value);
  if(!Number.isFinite(time))throw new ApiError(400,"Data inválida.");
  return time;
}
