"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import styles from "./customer-workspace.module.css";

type PreviewCustomer={id:string;name:string;kind:"person"|"organization";contact:string;phone:string;email:string;location:string;notes:string};

const examples:PreviewCustomer[]=[
  {id:"a",name:"Cliente de demonstração A",kind:"organization",contact:"Contato de exemplo",phone:"—",email:"—",location:"Local de exemplo · Brasília/DF",notes:"Cadastro fictício para visualizar a área de clientes."},
  {id:"b",name:"Cliente de demonstração B",kind:"person",contact:"—",phone:"—",email:"—",location:"Ainda não informado",notes:"Nenhum dado real foi carregado."},
  {id:"c",name:"Cliente de demonstração C",kind:"organization",contact:"—",phone:"—",email:"—",location:"Ainda não informado",notes:"Use a busca e selecione um cadastro para explorar a interface."},
];

export function CustomerPreview(){
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(examples[0].id);
  const visible=useMemo(()=>examples.filter(item=>item.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))),[search]);
  const detail=examples.find(item=>item.id===selected);
  return <main id="conteudo" className={styles.page}>
    <header className={styles.top}>
      <Link className={styles.brand} href="/">Limpax <span>CRM</span></Link>
      <nav className={styles.nav} aria-label="Navegação da demonstração"><Link href="/supabase/homologacao">Meu acesso</Link><Link href="/">Site</Link></nav>
    </header>
    <section className={styles.heading}>
      <div><h1>Clientes.</h1><p>Visualização do protótipo com dados inteiramente fictícios.</p></div>
      <button type="button" className={styles.primary} disabled title="Disponível no CRM operacional">Novo cliente</button>
    </section>
    <p className={styles.archivedNotice}>Protótipo visual local. Nenhum cadastro ou alteração é salvo nesta tela.</p>
    <section className={styles.layout} aria-label="Área de clientes">
      <aside className={styles.listPane}>
        <div className={styles.search}><label htmlFor="preview-customer-search">Buscar cliente</label><input id="preview-customer-search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nome do cliente"/></div>
        <div className={styles.count}>{visible.length} clientes de demonstração</div>
        <div className={styles.list}>{visible.map(item=><button type="button" key={item.id} className={styles.customer+(item.id===selected?" "+styles.active:"")} onClick={()=>setSelected(item.id)} aria-pressed={item.id===selected}><strong>{item.name}</strong><span>{item.kind==="person"?"Pessoa física":"Empresa"} · {item.location}</span></button>)}{!visible.length&&<p className={styles.empty}>Nenhum cliente encontrado.</p>}</div>
      </aside>
      <section className={styles.detail} aria-live="polite">
        {detail?<>
          <header className={styles.detailHead}><div><p>Cadastro</p><h2>{detail.name}</h2><p>Dados de demonstração</p></div><span className={styles.tag}>{detail.kind==="person"?"Pessoa física":"Empresa"}</span></header>
          <div className={styles.facts}><div><span>Contato principal</span><strong>{detail.contact}</strong></div><div><span>Telefone</span><strong>{detail.phone}</strong></div><div><span>E-mail</span><strong>{detail.email}</strong></div></div>
          <div className={styles.sections}><section><h3>Contatos</h3><article className={styles.card}><strong>{detail.contact}</strong><span>{detail.phone}</span><span>{detail.email}</span></article></section><section><h3>Locais de atendimento</h3><article className={styles.card}><strong>{detail.location}</strong><span>Endereço completo não informado</span></article></section><section className={styles.fullWidthSection}><h3>Observações</h3><p>{detail.notes}</p></section><section className={styles.fullWidthSection}><h3>Atendimentos vinculados</h3><p className={styles.empty}>Nenhum atendimento de demonstração vinculado.</p></section></div>
        </>:<p className={styles.empty}>Selecione um cliente.</p>}
      </section>
    </section>
  </main>;
}
