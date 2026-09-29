"use client";

import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {crmStatuses,statusLabels,type CrmStatus} from "@/lib/crm-shared";
import type {CrmLead} from "@/lib/crm-data";
import styles from "./supabase-lead-editor.module.css";

export function SupabaseLeadEditor({lead}:{lead:CrmLead|null}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [requestId,setRequestId]=useState(()=>lead?.id||crypto.randomUUID());
  const [name,setName]=useState(lead?.contact.name||"");
  const [phone,setPhone]=useState(lead?.contact.phone||"");
  const [email,setEmail]=useState(lead?.contact.email||"");
  const [problem,setProblem]=useState(lead?.contact.problem==="outro"?"":lead?.contact.problem||"");
  const [region,setRegion]=useState(lead?.contact.region||"");
  const [status,setStatus]=useState<CrmStatus>(lead?.status||"novo");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError("");setSuccess(false);
    try{
      const response=await fetch("/api/supabase/crm/leads",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({action:lead?"update":"create",id:requestId,name:name.trim(),phone:phone.trim(),email:email.trim(),problem:problem.trim(),region:region.trim(),status,expectedUpdatedAt:lead?.updatedAt||null})
      });
      const result=await response.json() as {id?:string;error?:string};
      if(!response.ok||!result.id)throw new Error(result.error||"Não foi possível salvar o atendimento.");
      setSuccess(true);setOpen(false);
      if(!lead){setRequestId(crypto.randomUUID());setName("");setPhone("");setEmail("");setProblem("");setRegion("");setStatus("novo")}
      router.push(`/crm?selected=${encodeURIComponent(result.id)}`);
      router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Não foi possível salvar o atendimento.")}
    finally{setBusy(false)}
  }

  return <div className={styles.editor}>
    <button className="outline-button" type="button" onClick={()=>{setOpen(value=>!value);setError("")}} aria-expanded={open}>{lead?"Editar atendimento":"Novo atendimento de revisão"}</button>
    {success&&<p role="status">Atendimento salvo. A lista foi atualizada.</p>}
    {open&&<form className={styles.form} onSubmit={submit} aria-label={lead?"Editar atendimento":"Cadastrar atendimento de revisão"}>
      <label>Nome<input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={180} required disabled={busy}/></label>
      <label>Telefone (opcional)<input type="tel" value={phone} onChange={event=>setPhone(event.target.value)} maxLength={40} disabled={busy}/></label>
      <label>E-mail (opcional)<input type="email" value={email} onChange={event=>setEmail(event.target.value)} maxLength={254} disabled={busy}/></label>
      <label>Região (opcional)<input value={region} onChange={event=>setRegion(event.target.value)} maxLength={120} disabled={busy}/></label>
      <label className={styles.wide}>Solicitação<textarea value={problem} onChange={event=>setProblem(event.target.value)} minLength={2} maxLength={500} rows={3} required disabled={busy}/></label>
      {lead&&<label>Situação<select value={status} onChange={event=>setStatus(event.target.value as CrmStatus)} disabled={busy}>{crmStatuses.map(value=><option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>}
      {error&&<p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button className="outline-button" type="button" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button><button className="outline-button" type="submit" disabled={busy}>{busy?"Salvando…":"Salvar atendimento"}</button></div>
    </form>}
  </div>;
}
