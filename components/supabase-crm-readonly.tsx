import Link from "next/link";
import type {CrmLeadList} from "@/lib/crm-data";
import type {SupabaseCrmActor} from "@/lib/supabase-crm-access";
import {formatDateTime} from "@/lib/timezone";
import {statusLabels} from "@/lib/crm-shared";

export function SupabaseCrmReadonly({listing,actor,selectedId}:{listing:CrmLeadList;actor:SupabaseCrmActor;selectedId:string|null}){
  const selected=listing.leads.find(lead=>lead.id===selectedId)||listing.leads[0]||null;
  return <main id="conteudo" className="crm-page">
    <header className="crm-top"><div><Link className="crm-brand" href="/">Limpax <span>CRM</span></Link><p>{actor.displayName} · {actor.isSuperAdmin?"Superadministrador":actor.role==="admin"?"Administrador":"Atendimento"}</p></div><nav className="crm-top-actions" aria-label="Navegação do CRM"><Link className="outline-button" href="/crm/clientes">Clientes</Link><Link className="outline-button" href="/supabase/homologacao">Meu acesso</Link></nav></header>
    <section className="crm-overview"><div><p className="eyebrow">LIMPAX / CRM</p><h1>Atendimentos.</h1><p>Consulta protegida dos dados do Supabase.</p></div><div className="crm-kpis"><div><strong>{listing.total}</strong><span>Total</span></div><div><strong>{listing.totals.novo||0}</strong><span>Novos</span></div><div><strong>{listing.totals.concluido||0}</strong><span>Concluídos</span></div></div></section>
    <p className="crm-empty">A edição de atendimentos permanece bloqueada até a validação da migração e recuperação.</p>
    <div className="crm-workspace"><aside className="crm-inbox"><p className="crm-count">{listing.total} atendimentos</p><div className="crm-lead-list">{listing.leads.map(lead=><Link key={lead.id} href={`/crm?selected=${encodeURIComponent(lead.id)}`} className={`crm-lead${lead.id===selected?.id?" active":""}`} aria-current={lead.id===selected?.id?"true":undefined}><span className="status-dot" data-status={lead.status}/><span><strong>{lead.contact.name}</strong><small>{statusLabels[lead.status]} · {lead.contact.region||"Região não informada"}</small></span><time>{formatDateTime(lead.updatedAt)}</time></Link>)}{!listing.leads.length&&<p className="crm-empty">Nenhum atendimento encontrado.</p>}</div></aside><section className="crm-detail">{selected?<><header className="crm-detail-head"><div><h2>{selected.contact.name}</h2><p>{statusLabels[selected.status]} · {selected.contact.problem}</p></div><span className="mode-label">{selected.mode==="live"?"Operacional":"Revisão"}</span></header><dl className="crm-facts"><div><dt>Telefone</dt><dd>{selected.contact.phone||"Não informado"}</dd></div><div><dt>E-mail</dt><dd>{selected.contact.email||"Não informado"}</dd></div><div><dt>Região</dt><dd>{selected.contact.region||"Não informada"}</dd></div><div><dt>Atualizado</dt><dd>{formatDateTime(selected.updatedAt)}</dd></div></dl></>:<p className="crm-empty">Selecione um atendimento.</p>}</section></div>
  </main>;
}
