"use client";

import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import type {SupabaseCustomer} from "@/lib/supabase-crm-customers";
import styles from "./customer-workspace.module.css";

export function SupabaseCustomerEditor({customer}:{customer:SupabaseCustomer|null}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [kind,setKind]=useState<"person"|"organization">(customer?.kind||"person");
  const [name,setName]=useState(customer?.name||"");
  const [tradeName,setTradeName]=useState(customer?.tradeName||"");
  const [requestId,setRequestId]=useState(()=>customer?.id||crypto.randomUUID());
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/supabase/crm/customers",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({action:customer?"update":"create",id:requestId,kind,name:name.trim(),tradeName:tradeName.trim()||null,expectedUpdatedAt:customer?.updatedAt||null})
      });
      const result=await response.json() as {id?:string;error?:string};
      if(!response.ok||!result.id)throw new Error(result.error||"Não foi possível salvar o cliente.");
      setSuccess(true);setOpen(false);
      if(!customer){setRequestId(crypto.randomUUID());setName("");setTradeName("");setKind("person")}
      router.push(`/crm/clientes?selected=${encodeURIComponent(result.id)}`);
      router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Não foi possível salvar o cliente.")}
    finally{setBusy(false)}
  }

  return <div>
    <button className={styles.primary} type="button" onClick={()=>{setOpen(value=>!value);setError("")}} aria-expanded={open}>{customer?"Editar cliente":"Novo cliente de revisão"}</button>
    {success&&<p role="status">Cliente salvo. A lista foi atualizada.</p>}
    {open&&<form className={styles.form} onSubmit={submit} aria-label={customer?"Editar cliente":"Cadastrar cliente de revisão"}>
      <label>Tipo<select value={kind} onChange={event=>setKind(event.target.value as "person"|"organization")} disabled={busy}><option value="person">Pessoa física</option><option value="organization">Empresa</option></select></label>
      <label>Nome<input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={180} required disabled={busy}/></label>
      <label className={styles.wide}>Nome fantasia (opcional)<input value={tradeName} onChange={event=>setTradeName(event.target.value)} maxLength={180} disabled={busy}/></label>
      {error&&<p className={styles.modalError} role="alert">{error}</p>}
      <div className={styles.actions}><button type="button" className={styles.ghost} onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button><button className={styles.primary} type="submit" disabled={busy}>{busy?"Salvando…":"Salvar cliente"}</button></div>
    </form>}
  </div>;
}
