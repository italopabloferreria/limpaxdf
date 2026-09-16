import {getChatGPTUser,type ChatGPTUser} from "@/app/chatgpt-auth";
import {settings} from "./config";
import {ApiError,requireOrigin} from "./http";
export {crmStatuses,statusLabels,type CrmStatus} from "./crm-shared";

export async function requireCrmUser():Promise<ChatGPTUser>{
  const user=await getChatGPTUser();
  if(!user)throw new ApiError(401,"Entre com a conta autorizada para acessar o CRM.");
  const allowed=(settings().CRM_ADMIN_EMAILS||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
  if(!allowed.length)throw new ApiError(503,"Defina os e-mails autorizados do CRM antes de liberar a equipe.");
  if(!allowed.includes(user.email.toLowerCase()))throw new ApiError(403,"Sua conta não está autorizada para o CRM.");
  return user;
}

export async function requireCrmMutation(req:Request){const s=settings();requireOrigin(req,s);return requireCrmUser()}

export function toDateTime(value:string|undefined){
  if(!value)return null;
  if(!/(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw new ApiError(400,"Informe a data com fuso horário.");
  const time=Date.parse(value);
  if(!Number.isFinite(time))throw new ApiError(400,"Data inválida.");
  return time;
}
