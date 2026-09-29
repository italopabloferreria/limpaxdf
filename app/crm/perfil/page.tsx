import Link from "next/link";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {CrmProfileWorkspace} from "@/components/crm-profile-workspace";
import {isCrmSuperAdmin} from "@/lib/crm";
import {crmPageAccess} from "@/lib/crm-page-access";
import {settings} from "@/lib/config";
import {SupabaseApprovedTeam} from "@/components/supabase-approved-team";
import {supabaseCrmPageAccess,supabaseCrmProfileEnabled} from "@/lib/supabase-crm-access";
import {getSupabaseConfig} from "@/lib/supabase";

export const dynamic="force-dynamic";

export default async function CrmProfilePage(){
  const s=settings();
  if(supabaseCrmProfileEnabled(s)){
    const access=await supabaseCrmPageAccess("profile");
    if(!access)return <CrmAccessGate status={401} returnTo="/crm/perfil" previewReadEnabled/>;
    const config=getSupabaseConfig(s);
    if(!config)return <CrmAccessGate status={503} returnTo="/crm/perfil" previewReadEnabled/>;
    const {actor}=access;
    return <main id="conteudo" className="crm-page">
      <header className="crm-top">
        <div><Link href="/crm" className="crm-brand">Limpax <span>CRM</span></Link><p>Conta e equipe</p></div>
        <nav className="crm-top-actions" aria-label="Navegação do CRM">
          <Link href="/supabase/homologacao" className="outline-button">Acesso Google</Link>
          <Link href="/crm" className="outline-button">Atendimentos</Link>
          <Link href="/crm/clientes" className="outline-button">Clientes</Link>
        </nav>
      </header>
      <section className="space-y-4 rounded-xl border p-6" aria-labelledby="profile-title">
        <h1 id="profile-title" className="text-2xl font-semibold">Meu perfil</h1>
        <p><strong>{actor.displayName}</strong></p>
        <p>{actor.email}</p>
        <p>Papel: {actor.isSuperAdmin?"Superadministrador":actor.role==="admin"?"Administrador":"Atendente"}</p>
      </section>
      {actor.role==="admin"&&<SupabaseApprovedTeam url={config.url} publishableKey={config.publishableKey} superAdmin={actor.isSuperAdmin}/>}
    </main>;
  }
  const access=await crmPageAccess();
  if(!access.actor)return <CrmAccessGate status={access.status} returnTo="/crm/perfil"/>;
  const actor=access.actor;
  return <main id="conteudo" className="crm-page">
    <header className="crm-top">
      <div><Link href="/crm" className="crm-brand">Limpax <span>CRM</span></Link><p>Conta e equipe</p></div>
      <nav className="crm-top-actions" aria-label="Navegação do CRM">
        <Link href="/crm" className="outline-button">Atendimentos</Link>
        <Link href="/crm/clientes" className="outline-button">Clientes</Link>
      </nav>
    </header>
    <CrmProfileWorkspace email={actor.email} displayName={actor.displayName} role={actor.role} superAdmin={isCrmSuperAdmin(actor)} googleAccessEnabled={settings().SUPABASE_GOOGLE_APPROVALS_ENABLED==="true"}/>
  </main>;
}
