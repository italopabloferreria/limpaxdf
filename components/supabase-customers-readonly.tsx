import Link from "next/link";
import type {SupabaseCrmActor} from "@/lib/supabase-crm-access";
import type {SupabaseCustomer,SupabaseCustomerDetail} from "@/lib/supabase-crm-customers";
import {SupabaseCustomerEditor} from "./supabase-customer-editor";
import {SupabaseCrmSignOut} from "./supabase-crm-sign-out";
import styles from "./customer-workspace.module.css";

export function SupabaseCustomersReadonly({actor,customers,total,page,pages,search,selected,detail,writeEnabled=false}:{actor:SupabaseCrmActor;customers:SupabaseCustomer[];total:number;page:number;pages:number;search:string;selected:SupabaseCustomer|null;detail:SupabaseCustomerDetail|null;writeEnabled?:boolean}){
  const listUrl=(nextPage:number,selectedId?:string)=>{
    const params=new URLSearchParams();
    if(search)params.set("search",search);
    if(nextPage>1)params.set("page",String(nextPage));
    if(selectedId)params.set("selected",selectedId);
    const query=params.toString();
    return "/crm/clientes"+(query?"?"+query:"");
  };
  return <main id="conteudo" className={styles.page}>
    <header className={styles.top}><Link className={styles.brand} href="/crm">Limpax <span>CRM</span></Link><nav className={styles.nav} aria-label="Navegação do CRM"><Link href="/crm">Atendimentos</Link><Link href="/crm/perfil">Meu perfil</Link><SupabaseCrmSignOut/></nav></header>
    <section className={styles.heading}><div><h1>Clientes.</h1><p>{actor.displayName} · consulta protegida no Supabase</p></div></section>
    {writeEnabled?<section aria-label="Cadastro de cliente de revisão"><p className={styles.archivedNotice}>Cadastros desta prévia são fictícios e ficam separados da operação.</p><SupabaseCustomerEditor customer={null}/></section>:<p className={styles.archivedNotice}>Somente consulta. Cadastro e edição serão liberados após a validação das operações e da recuperação.</p>}
    <section className={styles.layout} aria-label="Clientes"><aside className={styles.listPane}><form className={styles.search} action="/crm/clientes" method="get"><label htmlFor="customer-search">Buscar por nome<input id="customer-search" name="search" maxLength={120} defaultValue={search} placeholder="Nome ou nome fantasia"/></label><button className={styles.ghost} type="submit">Buscar</button></form><div className={styles.count}>{total} clientes ativos</div><div className={styles.list}>{customers.map(item=><Link key={item.id} href={listUrl(page,item.id)} className={styles.customer+(item.id===selected?.id?" "+styles.active:"")} aria-current={item.id===selected?.id?"true":undefined}><strong>{item.tradeName||item.name}</strong><span>{item.kind==="organization"?"Empresa":"Pessoa física"} · {item.sourceMode==="live"?"Operacional":"Revisão"}</span></Link>)}{!customers.length&&<p className={styles.empty}>Nenhum cliente encontrado.</p>}</div><nav className={styles.pager} aria-label="Páginas de clientes"><span>Página {page} de {pages}</span>{page>1&&<Link className={styles.ghost} href={listUrl(page-1)}>Anterior</Link>}{page<pages&&<Link className={styles.ghost} href={listUrl(page+1)}>Próxima</Link>}</nav></aside><section className={styles.detail}>{selected&&detail?<><header className={styles.detailHead}><div><p>Cadastro</p><h2>{selected.tradeName||selected.name}</h2><p>{selected.name}</p></div><span className={styles.tag}>{selected.kind==="organization"?"Empresa":"Pessoa física"}</span></header>{writeEnabled&&<SupabaseCustomerEditor key={selected.id} customer={selected}/>}<div className={styles.sections}><section><h3>Contatos</h3>{detail.contacts.length?detail.contacts.map(item=><article className={styles.card} key={item.id}><strong>{item.name}</strong><span>{item.phone||"Telefone não informado"}</span><span>{item.email||"E-mail não informado"}</span></article>):<p className={styles.empty}>Nenhum contato cadastrado.</p>}</section><section><h3>Locais de atendimento</h3>{detail.locations.length?detail.locations.map(item=><article className={styles.card} key={item.id}><strong>{item.label}</strong><span>{[item.address,item.city,item.state].filter(Boolean).join(" · ")||"Endereço não informado"}</span></article>):<p className={styles.empty}>Nenhum local cadastrado.</p>}</section></div></>:<p className={styles.empty}>Selecione um cliente.</p>}</section></section>
  </main>;
}
