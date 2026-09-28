import Link from "next/link";
import {CrmAccessGate} from "@/components/crm-access-gate";
import {CrmProfileWorkspace} from "@/components/crm-profile-workspace";
import {isCrmSuperAdmin} from "@/lib/crm";
import {crmPageAccess} from "@/lib/crm-page-access";

export const dynamic="force-dynamic";

export default async function CrmProfilePage(){
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
    <CrmProfileWorkspace email={actor.email} displayName={actor.displayName} role={actor.role} superAdmin={isCrmSuperAdmin(actor)}/>
  </main>;
}
