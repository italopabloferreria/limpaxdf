import {requireCrmAdmin} from "@/lib/crm";
import {changeCustomerArchiveState} from "@/lib/crm-customer-lifecycle";
import {settings} from "@/lib/config";
import {ApiError,database,failure,json,readJson} from "@/lib/http";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";

const schema=z.object({archived:z.boolean()}).strict();

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireCrmAdmin(req),{id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const parsed=schema.safeParse(await readJson(req));
    if(!parsed.success)throw new ApiError(400,"Estado de arquivamento inválido.");
    return json(await changeCustomerArchiveState(database(settings()),id,parsed.data.archived,actor.email));
  }catch(error){return failure(error)}
}
