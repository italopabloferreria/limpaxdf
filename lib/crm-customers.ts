import {ApiError} from "./http";

type Db={prepare:(query:string)=>D1PreparedStatement;batch:(statements:D1PreparedStatement[])=>Promise<unknown[]>};
export type CustomerSummary={id:string;kind:"person"|"organization";name:string;tradeName:string|null;taxId:string|null;notes:string|null;sourceMode:"review"|"live";origin:string;archivedAt:number|null;createdAt:number;updatedAt:number;contacts:number;locations:number;primaryPhone:string|null;primaryEmail:string|null};
export type CustomerDetail=CustomerSummary&{
  contactList:Array<{id:string;name:string;role:string|null;phone:string|null;email:string|null;primary:boolean}>;
  locationList:Array<{id:string;label:string;postalCode:string|null;address:string|null;number:string|null;complement:string|null;district:string|null;city:string|null;state:string|null;reference:string|null;accessNotes:string|null;primary:boolean}>;
  linkedLeads?:Array<{id:string;seq:number;status:string;createdAt:number;updatedAt:number;assignedTo:string|null;linkedAt:number;linkedBy:string}>;
};

type CustomerSummaryRow={
  id:string;kind:"person"|"organization";name:string;trade_name:string|null;tax_id:string|null;notes:string|null;
  source_mode:"review"|"live";origin:string;archived_at:number|null;created_at:number;updated_at:number;
  contacts:number;locations:number;primary_phone:string|null;primary_email:string|null;
};
type CustomerContactRow={id:string;name:string;role:string|null;phone:string|null;email:string|null;is_primary:number};
type ServiceLocationRow={id:string;label:string;postal_code:string|null;address:string|null;number:string|null;complement:string|null;district:string|null;city:string|null;state:string|null;reference:string|null;access_notes:string|null;is_primary:number};
type LinkedLeadRow={id:string;seq:number;status:string;created_at:number;updated_at:number;assigned_to:string|null;linked_at:number;linked_by:string};

export function digits(value:string|undefined|null){return (value||"").replace(/\D/g,"")||null}
export function cleanOptional(value:string|undefined|null){const result=value?.trim();return result||null}

/** Validate CPF (11 digits) checksum */
export function isValidCpf(raw:string):boolean{
  const d=raw.replace(/\D/g,"");
  if(d.length!==11)return false;
  if(/^(\d)\1{10}$/.test(d))return false;
  for(let t=9;t<=10;t++){let sum=0;for(let i=0;i<t;i++)sum+=Number(d[i])*(t+1-i);const rem=sum%11;const check=rem<2?0:11-rem;if(Number(d[t])!==check)return false}
  return true;
}

/** Validate CNPJ (14 digits) checksum */
export function isValidCnpj(raw:string):boolean{
  const d=raw.replace(/\D/g,"");
  if(d.length!==14)return false;
  if(/^(\d)\1{13}$/.test(d))return false;
  const w1=[5,4,3,2,9,8,7,6,5,4,3,2],w2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
  let sum=0;for(let i=0;i<12;i++)sum+=Number(d[i])*w1[i];let rem=sum%11;if(Number(d[12])!==(rem<2?0:11-rem))return false;
  sum=0;for(let i=0;i<13;i++)sum+=Number(d[i])*w2[i];rem=sum%11;
  return Number(d[13])===(rem<2?0:11-rem);
}

/** Validate a tax ID string (CPF or CNPJ). Returns null if empty, true/false if present. */
export function validateTaxId(raw:string|null|undefined):{valid:boolean;normalized:string|null}{
  if(!raw?.trim())return {valid:true,normalized:null};
  const d=digits(raw);
  if(!d)return {valid:false,normalized:null};
  if(d.length===11)return {valid:isValidCpf(d),normalized:d};
  if(d.length===14)return {valid:isValidCnpj(d),normalized:d};
  return {valid:false,normalized:d};
}

export async function listCustomers(db:Db,{page=1,pageSize=30,search="",sourceMode,archived=false}:{page?:number;pageSize?:number;search?:string;sourceMode?:"review"|"live";archived?:boolean}={}){
  const size=Math.min(100,Math.max(10,Math.trunc(pageSize)));
  const wanted=Math.max(1,Math.trunc(page));
  const values:unknown[]=[];

  let where=archived?" WHERE c.archived_at IS NOT NULL":" WHERE c.archived_at IS NULL";

  if(sourceMode){where+=" AND c.source_mode=?";values.push(sourceMode)}

  if(search){
    const textLike="%"+escapeLike(search.toLowerCase())+"%";
    const numberDigits=digits(search);

    // Text predicates always apply
    const textPredicates=[
      "LOWER(c.name) LIKE ? ESCAPE '\\'",
      "LOWER(COALESCE(c.trade_name,'')) LIKE ? ESCAPE '\\'",
      "EXISTS(SELECT 1 FROM customer_contacts x WHERE x.customer_id=c.id AND (LOWER(x.name) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(x.email,'')) LIKE ? ESCAPE '\\'))"
    ];
    values.push(textLike,textLike,textLike,textLike);

    // Digit predicates only apply when the search term actually contains digits
    if(numberDigits){
      const digitLike="%"+numberDigits+"%";
      textPredicates.push(
        "c.tax_id_normalized LIKE ?",
        "EXISTS(SELECT 1 FROM customer_contacts x WHERE x.customer_id=c.id AND x.phone_normalized LIKE ?)"
      );
      values.push(digitLike,digitLike);
    }

    where+=" AND ("+textPredicates.join(" OR ")+")";
  }

  const count=await db.prepare("SELECT COUNT(*) total FROM customers c"+where).bind(...values).first<{total:number}>();
  const total=Number(count?.total||0);
  const pages=Math.max(1,Math.ceil(total/size));
  const current=Math.min(wanted,pages);

  const rows=await db.prepare(
    "SELECT c.*,COUNT(DISTINCT cc.id) contacts,COUNT(DISTINCT sl.id) locations,MAX(CASE WHEN cc.is_primary=1 THEN cc.phone END) primary_phone,MAX(CASE WHEN cc.is_primary=1 THEN cc.email END) primary_email FROM customers c LEFT JOIN customer_contacts cc ON cc.customer_id=c.id LEFT JOIN service_locations sl ON sl.customer_id=c.id"
    +where+" GROUP BY c.id ORDER BY c.updated_at DESC,c.id DESC LIMIT ? OFFSET ?"
  ).bind(...values,size,(current-1)*size).all<CustomerSummaryRow>();

  return {customers:rows.results.map(mapSummary),total,page:current,pageSize:size,pages};
}

export async function getCustomer(db:Db,id:string,{includeArchived=false}:{includeArchived?:boolean}={}):Promise<CustomerDetail>{
  const row=await db.prepare(
    "SELECT c.*,COUNT(DISTINCT cc.id) contacts,COUNT(DISTINCT sl.id) locations,MAX(CASE WHEN cc.is_primary=1 THEN cc.phone END) primary_phone,MAX(CASE WHEN cc.is_primary=1 THEN cc.email END) primary_email FROM customers c LEFT JOIN customer_contacts cc ON cc.customer_id=c.id LEFT JOIN service_locations sl ON sl.customer_id=c.id WHERE c.id=?"+(includeArchived?"":" AND c.archived_at IS NULL")+" GROUP BY c.id"
  ).bind(id).first<CustomerSummaryRow>();
  if(!row)throw new ApiError(404,"Cliente não encontrado.");
  const [contacts,locations,leads]=await Promise.all([
    db.prepare("SELECT id,name,role,phone,email,is_primary FROM customer_contacts WHERE customer_id=? ORDER BY is_primary DESC,created_at").bind(id).all<CustomerContactRow>(),
    db.prepare("SELECT id,label,postal_code,address,number,complement,district,city,state,reference,access_notes,is_primary FROM service_locations WHERE customer_id=? ORDER BY is_primary DESC,created_at").bind(id).all<ServiceLocationRow>(),
    db.prepare("SELECT l.id,l.seq,l.status,l.created_at,l.updated_at,l.assigned_to,lc.linked_at,lc.linked_by FROM lead_customer_links lc JOIN leads l ON l.id=lc.lead_id WHERE lc.customer_id=? ORDER BY l.created_at DESC LIMIT 50").bind(id).all<LinkedLeadRow>()
  ]);
  return {
    ...mapSummary(row),
    contactList:contacts.results.map(item=>({id:item.id,name:item.name,role:item.role,phone:item.phone,email:item.email,primary:!!item.is_primary})),
    locationList:locations.results.map(item=>({id:item.id,label:item.label,postalCode:item.postal_code,address:item.address,number:item.number,complement:item.complement,district:item.district,city:item.city,state:item.state,reference:item.reference,accessNotes:item.access_notes,primary:!!item.is_primary})),
    linkedLeads:leads.results.map(item=>({id:item.id,seq:Number(item.seq),status:item.status,createdAt:Number(item.created_at),updatedAt:Number(item.updated_at),assignedTo:item.assigned_to,linkedAt:Number(item.linked_at),linkedBy:item.linked_by}))
  };
}

function mapSummary(row:CustomerSummaryRow):CustomerSummary{return {id:row.id,kind:row.kind,name:row.name,tradeName:row.trade_name,taxId:row.tax_id,notes:row.notes,sourceMode:row.source_mode,origin:row.origin,archivedAt:row.archived_at===null?null:Number(row.archived_at),createdAt:Number(row.created_at),updatedAt:Number(row.updated_at),contacts:Number(row.contacts||0),locations:Number(row.locations||0),primaryPhone:row.primary_phone,primaryEmail:row.primary_email}}
function escapeLike(value:string){return value.replace(/[\\%_]/g,match=>"\\"+match)}
