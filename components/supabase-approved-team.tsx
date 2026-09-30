"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {createBrowserClient} from "@supabase/ssr";

type Role="admin"|"attendant";
type Approval={email:string;display_name:string|null;role:Role;active:boolean};

export function SupabaseApprovedTeam({url,publishableKey}:{url:string;publishableKey:string}){
  const [members,setMembers]=useState<Approval[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [email,setEmail]=useState("");
  const [name,setName]=useState("");
  const [role,setRole]=useState<Role>("attendant");

  const client=useCallback(()=>createBrowserClient(url,publishableKey,{
    auth:{flowType:"pkce"},
    cookieOptions:{sameSite:"lax",secure:window.location.protocol==="https:"}
  }),[url,publishableKey]);

  async function refresh(){
    const {data,error:readError}=await client().from("crm_google_approvals")
      .select("email,display_name,role,active").order("email");
    if(readError)throw new Error("Não foi possível carregar os acessos Google.");
    setMembers((data||[]) as Approval[]);
  }

  useEffect(()=>{
    let live=true;
    void (async()=>{
      try{
        const {data,error:readError}=await client().from("crm_google_approvals")
          .select("email,display_name,role,active").order("email");
        if(!live)return;
        if(readError)setError("Não foi possível carregar os acessos Google.");
        else setMembers((data||[]) as Approval[]);
      }catch{if(live)setError("Não foi possível carregar os acessos Google.")}
      finally{if(live)setLoading(false)}
    })();
    return ()=>{live=false};
  },[client]);

  async function add(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      const normalized=email.trim().toLowerCase();
      const {error:writeError}=await client().from("crm_google_approvals").insert({
        email:normalized,display_name:name.trim()||null,role,active:true
      });
      if(writeError)throw new Error(writeError.code==="23505"?"Este e-mail já está cadastrado.":"Não foi possível cadastrar o acesso Google.");
      await refresh();
      setEmail("");setName("");setRole("attendant");
      setMessage("Acesso aprovado. No modo de testes, inclua também essa conta como usuária de teste no Google Cloud.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível cadastrar o acesso Google.")}
    finally{setBusy(false)}
  }

  async function changeActive(member:Approval){
    setBusy(true);setError("");setMessage("");
    try{
      const {error:writeError}=await client().from("crm_google_approvals")
        .update({active:!member.active}).eq("email",member.email);
      if(writeError)throw new Error();
      await refresh();
      setMessage(member.active?"Acesso desativado.":"Acesso reativado.");
    }catch{setError("Não foi possível alterar este acesso.")}
    finally{setBusy(false)}
  }

  async function changeRole(member:Approval,nextRole:Role){
    if(nextRole===member.role)return;
    setBusy(true);setError("");setMessage("");
    try{
      const {error:writeError}=await client().from("crm_google_approvals")
        .update({role:nextRole}).eq("email",member.email);
      if(writeError)throw new Error();
      await refresh();
      setMessage("Papel atualizado.");
    }catch{setError("Não foi possível alterar o papel.")}
    finally{setBusy(false)}
  }

  return <section className="space-y-5 rounded-xl border p-6" aria-labelledby="google-team-title">
    <div><h2 id="google-team-title" className="text-xl font-semibold">Usuários do CRM</h2>
      <p className="text-sm">Cadastre o e-mail Google antes do primeiro acesso. Somente Ítalo, o superadministrador, pode cadastrar ou alterar usuários. Escolha atendimento para acesso comum ou administrador para gestão do CRM.</p></div>
    <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">E-mail Google
        <input type="email" required maxLength={200} autoComplete="off" value={email} onChange={event=>setEmail(event.target.value)} className="min-h-11 rounded border px-3"/>
      </label>
      <label className="grid gap-1 text-sm">Nome de exibição
        <input type="text" maxLength={180} value={name} onChange={event=>setName(event.target.value)} className="min-h-11 rounded border px-3"/>
      </label>
      <label className="grid gap-1 text-sm">Tipo de usuário
        <select value={role} onChange={event=>setRole(event.target.value as Role)} className="min-h-11 rounded border px-3">
          <option value="attendant">Usuário de atendimento</option><option value="admin">Administrador</option>
        </select>
      </label>
      <div className="flex items-end"><button type="submit" disabled={busy} className="min-h-11 rounded border px-4 font-semibold focus-visible:outline-2 disabled:opacity-50">{busy?"Salvando…":"Cadastrar usuário"}</button></div>
    </form>
    {error&&<p role="alert">{error}</p>}
    {message&&<p role="status">{message}</p>}
    <div><h3 className="font-semibold">Usuários cadastrados</h3>
      {loading?<p>Carregando…</p>:members.length===0?<p>Nenhum acesso adicional cadastrado.</p>:<ul className="divide-y">
        {members.map(member=><li key={member.email} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <span><strong className="block">{member.display_name||member.email}</strong><span className="break-all">{member.email}</span><span className="block">{member.active?"Ativo":"Inativo"}</span></span>
          <span className="flex flex-wrap items-center gap-2">
            <label className="grid gap-1">Tipo de usuário
              <select aria-label={`Papel de ${member.email}`} value={member.role} disabled={busy} onChange={event=>changeRole(member,event.target.value as Role)} className="min-h-11 rounded border px-2 focus-visible:outline-2 disabled:opacity-50">
                <option value="attendant">Usuário de atendimento</option><option value="admin">Administrador</option>
              </select>
            </label>
            <button type="button" disabled={busy} onClick={()=>changeActive(member)} className="min-h-11 rounded border px-3 focus-visible:outline-2 disabled:opacity-50">{member.active?"Desativar":"Reativar"}</button>
          </span>
        </li>)}
      </ul>}
    </div>
  </section>;
}
