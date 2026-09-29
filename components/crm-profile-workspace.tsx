"use client";
import {useEffect,useState,type FormEvent} from "react";
import styles from "./crm-profile-workspace.module.css";

type Role="admin"|"attendant";
type Member={email:string;displayName:string|null;role:Role;active:boolean};

export function CrmProfileWorkspace({email,displayName,role,superAdmin,googleAccessEnabled=false,localDevelopment=false}:{email:string;displayName:string;role:Role;superAdmin:boolean;googleAccessEnabled?:boolean;localDevelopment?:boolean}){
  const [members,setMembers]=useState<Member[]>([]);
  const [loading,setLoading]=useState(role==="admin");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [newEmail,setNewEmail]=useState("");
  const [newName,setNewName]=useState("");
  const [newRole,setNewRole]=useState<Role>("attendant");

  useEffect(()=>{
    if(role!=="admin")return;
    const controller=new AbortController();
    fetch("/api/crm/users",{cache:"no-store",signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<{users:Member[]}>})
      .then(data=>setMembers(data.users))
      .catch(()=>{if(!controller.signal.aborted)setError("Não foi possível carregar a equipe.")})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return ()=>controller.abort();
  },[role]);

  async function createMember(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/crm/users",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:newEmail.trim(),displayName:newName.trim(),role:superAdmin?newRole:"attendant"})
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>null) as {error?:string}|null;
        throw new Error(payload?.error||"Não foi possível cadastrar este perfil.");
      }
      const list=await fetch("/api/crm/users",{cache:"no-store"});
      if(!list.ok)throw new Error("Perfil cadastrado, mas não foi possível atualizar a lista.");
      const data=await list.json() as {users:Member[]};
      setMembers(data.users);
      setNewEmail("");setNewName("");setNewRole("attendant");
      setMessage("Perfil cadastrado. A pessoa poderá acessar o CRM após entrar com uma conta autorizada no site.");
    }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível cadastrar este perfil.")}
    finally{setBusy(false)}
  }

  return <div className={`${styles.profile} mx-auto max-w-5xl space-y-8 py-10`}>
    <section aria-labelledby="profile-title" className="border border-black/20 bg-[#f8f7f2] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest">Meu perfil</p>
      <h1 id="profile-title" className="mt-2 text-4xl font-bold tracking-tight">{displayName||"Conta da equipe"}</h1>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold">E-mail</dt><dd className="break-all">{email}</dd></div>
        <div><dt className="font-semibold">Permissão</dt><dd>{superAdmin?"Superadministrador":role==="admin"?"Administrador":"Atendimento"}</dd></div>
      </dl>
      {localDevelopment&&<p className="mt-6 border-l-4 border-[#b6a800] bg-white p-3 text-sm">Esta é a conta local de desenvolvimento, separada do login Google. Perfis cadastrados aqui não liberam acesso ao CRM Google da prévia Vercel.</p>}
    </section>
    {role==="admin"&&<section aria-labelledby="team-title" className="border border-black/20 bg-[#f8f7f2] p-6 sm:p-8">
      <h2 id="team-title" className="text-2xl font-bold">Equipe</h2>
      <p className="mt-1 text-sm text-[#4e4d49]">{superAdmin?"Você pode cadastrar administradores e atendentes.":"Você pode cadastrar atendentes. Apenas o superadministrador cadastra administradores."} O cadastro do perfil não envia convite; a pessoa também precisa de acesso ao site.</p>
      {googleAccessEnabled&&<p className="mt-3 text-sm"><a href="/supabase/homologacao" className="underline focus-visible:outline-2">Gerenciar acesso Google de homologação</a>. Esse cadastro é separado do perfil operacional acima.</p>}
      <form onSubmit={createMember} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">E-mail da pessoa
          <input type="email" required maxLength={200} autoComplete="off" value={newEmail} onChange={event=>setNewEmail(event.target.value)} className="min-h-11 min-w-0 rounded border border-black/40 bg-white px-3 font-normal"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Nome de exibição
          <input type="text" maxLength={180} value={newName} onChange={event=>setNewName(event.target.value)} className="min-h-11 min-w-0 rounded border border-black/40 bg-white px-3 font-normal"/>
        </label>
        {superAdmin&&<label className="grid gap-1 text-sm font-semibold">Papel
          <select value={newRole} onChange={event=>setNewRole(event.target.value as Role)} className="min-h-11 rounded border border-black/40 bg-white px-3 font-normal">
            <option value="attendant">Atendimento</option><option value="admin">Administrador</option>
          </select>
        </label>}
        <div className="flex items-end"><button type="submit" disabled={busy} className="min-h-11 w-full rounded border border-black bg-[#f5e617] px-5 font-bold disabled:opacity-50 sm:w-auto">{busy?"Cadastrando…":"Cadastrar perfil"}</button></div>
      </form>
      {error&&<p role="alert" className="mt-4 rounded bg-[#fee9e5] p-3 text-sm text-[#7a1c12]">{error}</p>}
      {message&&<p role="status" className="mt-4 rounded border-l-4 border-[#6f6800] bg-white p-3 text-sm">{message}</p>}
      <h3 className="mt-10 text-lg font-bold">Perfis cadastrados</h3>
      {loading?<p className="mt-3 text-sm">Carregando equipe…</p>:members.length===0?<p className="mt-3 text-sm">Nenhum perfil cadastrado.</p>:<ul className="mt-3 divide-y divide-black/10 border-y border-black/20">
        {members.map(member=><li key={member.email} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 py-3 text-sm">
          <span><strong className="block">{member.displayName||member.email}</strong><span className="break-all text-[#4e4d49]">{member.email}</span></span>
          <span>{member.email.toLowerCase()===email.toLowerCase()&&superAdmin?"Superadministrador":member.role==="admin"?"Administrador":"Atendimento"} · {member.active?"Ativo":"Inativo"}</span>
        </li>)}
      </ul>}
    </section>}
  </div>;
}
