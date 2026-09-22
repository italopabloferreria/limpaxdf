export function acceptLeadResponse<T>(
  selectedId:string|null,
  requestId:string,
  value:T
):T|null{
  return selectedId===requestId?value:null;
}

export function applyLeadUpdate<T extends {lead:{id:string}}>(
  current:T|null,
  selectedId:string|null,
  requestId:string,
  update:Record<string,unknown>
):T|null{
  if(!current||selectedId!==requestId||current.lead.id!==requestId)return current;
  return {...current,lead:{...current.lead,...update}} as T;
}
