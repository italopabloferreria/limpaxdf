import {z} from "zod";
export const leadSchema=z.object({
problem:z.enum(["fossa","gordura","entupimento","esgoto","odor","pragas","outro"]),
location:z.string().trim().min(2).max(160),
property:z.enum(["residencia","condominio","empresa"]),
urgency:z.enum(["agora","planejar","nao-sei"]),
access:z.string().trim().min(2).max(500),
region:z.string().trim().min(2).max(100),
cep:z.string().regex(/^([0-9]{8})?$/),
name:z.string().trim().min(2).max(100),
phone:z.string().regex(/^[1-9][0-9]{9,10}$/),
email:z.union([z.literal(""),z.string().email().max(150)]),
notes:z.string().trim().max(1200),
marketing:z.boolean(),
privacy:z.literal(true),
reviewAcknowledged:z.boolean(),
website:z.string().max(0)
}).strict();
export const eventSchema=z.object({event:z.enum(["check_started","check_completed","diagnosis_selected"]),consent:z.literal(true)}).strict();
export const idempotencySchema=z.string().uuid();
export const uuidSchema=z.string().uuid();
export function imageType(bytes:Uint8Array):string|null{
if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return "image/png";
if(String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
return null;
}
export type LeadInput=z.infer<typeof leadSchema>;

