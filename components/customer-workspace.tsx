"use client";
import {useEffect,useState,useRef} from "react";
import Link from "next/link";
import type {CustomerDetail,CustomerSummary} from "@/lib/crm-customers";
import {formatDateTime} from "@/lib/timezone";
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger} from "@/components/ui/dialog";
import styles from "./customer-workspace.module.css";

type Listing={customers:CustomerSummary[];total:number;page:number;pageSize:number;pages:number};
const kindLabel={person:"Pessoa física",organization:"Empresa"};

type CreateDraft={
  kind:"person"|"organization";
  name:string;
  tradeName:string;
  taxId:string;
  notes:string;
  contactName:string;
  phone:string;
  email:string;
  label:string;
  address:string;
  number:string;
  city:string;
  state:string;
};

const initialCreateDraft:CreateDraft={
  kind:"person",
  name:"",
  tradeName:"",
  taxId:"",
  notes:"",
  contactName:"",
  phone:"",
  email:"",
  label:"",
  address:"",
  number:"",
  city:"",
  state:""
};

async function requestJson<T>(url:string,options:RequestInit,fallback:string):Promise<T>{
  let response:Response;
  try{response=await fetch(url,options)}catch(reason){
    if(options.signal?.aborted)throw reason;
    throw new Error(options.method&&options.method!=="GET"?fallback:"Falha de conexão. Confira sua rede e tente novamente.");
  }
  let body:T&{error?:string};
  try{body=await response.json()}catch{throw new Error(fallback)}
  if(!response.ok)throw new Error(typeof body?.error==="string"?body.error:fallback);
  return body;
}

function resetUnchangedForm(form:HTMLFormElement,snapshot:FormData){
  if(JSON.stringify([...new FormData(form)])===JSON.stringify([...snapshot]))form.reset();
}

export function CustomerWorkspace({initial,operator,role,dataMode}:{initial:Listing;operator:string;role:"admin"|"attendant";dataMode:"review"|"live"}){
  const [listing,setListing]=useState(initial);
  const [selected,setSelected]=useState<string|null>(initial.customers[0]?.id||null);
  const selectedRef=useRef(selected);
  const lifecycleButtonRef=useRef<HTMLButtonElement>(null);
  function selectCustomer(value:string|null){
    if(value===selectedRef.current)return;
    selectedRef.current=value;
    setSelected(value);
    setPageError("");
    setDetailError("");
  }

  const [detail,setDetail]=useState<CustomerDetail|null>(null);
  const [search,setSearch]=useState("");
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [refresh,setRefresh]=useState(0);
  const [showArchived,setShowArchived]=useState(false);
  const [listingRefresh,setListingRefresh]=useState(0);

  // Modals & form state
  const [openCreate,setOpenCreate]=useState(false);
  const [createDraft,setCreateDraft]=useState<CreateDraft>(initialCreateDraft);
  const [openEditCustomer,setOpenEditCustomer]=useState(false);
  const [editCustomerDraft,setEditCustomerDraft]=useState<{kind:"person"|"organization";name:string;tradeName:string;taxId:string;notes:string}>({
    kind:"person",name:"",tradeName:"",taxId:"",notes:""
  });

  const [editingContact,setEditingContact]=useState<{id:string;name:string;role:string;phone:string;email:string;primary:boolean}|null>(null);
  const [editingLocation,setEditingLocation]=useState<{id:string;label:string;address:string;number:string;complement:string;district:string;city:string;state:string;postalCode:string;primary:boolean}|null>(null);
  const [lifecycleAction,setLifecycleAction]=useState<{archived:boolean;customerName:string}|null>(null);

  const [modalError,setModalError]=useState("");
  const [busy,setBusy]=useState(false);
  const [pageError,setPageError]=useState("");
  const [listingError,setListingError]=useState("");
  const [detailError,setDetailError]=useState("");

  // Debounced search
  useEffect(()=>{
    const timer=setTimeout(()=>{setPage(1);setQuery(search.trim())},300);
    return()=>clearTimeout(timer);
  },[search]);

  // Load listing
  useEffect(()=>{
    const controller=new AbortController();
    const params=new URLSearchParams({page:String(page),pageSize:"30",search:query,mode:dataMode,state:showArchived?"archived":"active"});
    queueMicrotask(()=>{if(!controller.signal.aborted)setListingError("")});
    requestJson<Listing>("/api/crm/customers?"+params,{signal:controller.signal},"Não foi possível carregar os clientes.")
      .then(value=>{
        if(controller.signal.aborted)return;
        setListing(value);
        const cur=selectedRef.current;
        if(value.customers.length&&(!cur||!value.customers.some(item=>item.id===cur))){
          selectCustomer(value.customers[0].id);
        }else if(!value.customers.length){
          selectCustomer(null);
        }
      })
      .catch(e=>{if(!controller.signal.aborted)setListingError(e.message)});
    return()=>controller.abort();
  },[page,query,refresh,dataMode,showArchived,listingRefresh]);

  // Load customer detail
  useEffect(()=>{
    if(!selected){queueMicrotask(()=>setDetail(null));return}
    const controller=new AbortController();
    queueMicrotask(()=>{
      if(controller.signal.aborted)return;
      setDetail(current=>current?.id===selected?current:null);
      setDetailError("");
    });
    requestJson<CustomerDetail>("/api/crm/customers/"+selected+(showArchived?"?archived=include":""),{signal:controller.signal},"Não foi possível abrir o cliente.")
      .then(data=>{
        if(controller.signal.aborted||selectedRef.current!==selected)return;
        setDetail(data);
        setEditCustomerDraft({
          kind:data.kind,
          name:data.name,
          tradeName:data.tradeName||"",
          taxId:data.taxId||"",
          notes:data.notes||""
        });
      })
      .catch(e=>{if(!controller.signal.aborted&&selectedRef.current===selected)setDetailError(e.message)});
    return()=>controller.abort();
  },[selected,refresh,showArchived]);

  // Request helper
  async function request(url:string,method:"POST"|"PATCH"|"DELETE",body?:Record<string,unknown>,fallback="Erro ao processar solicitação."):Promise<{ok:boolean;data?:Record<string,unknown>;error?:string}>{
    setBusy(true);
    setModalError("");
    setPageError("");
    try{
      const opts:RequestInit={method,headers:{"Content-Type":"application/json"}};
      if(body)opts.body=JSON.stringify(body);
      const res=await requestJson<Record<string,unknown>>(url,opts,fallback);
      return {ok:true,data:res};
    }catch(e){
      return {ok:false,error:(e as Error).message||fallback};
    }finally{
      setBusy(false);
    }
  }

  // Create Customer
  async function handleCreateCustomer(e:React.FormEvent){
    e.preventDefault();
    const payload:Record<string,unknown>={
      kind:createDraft.kind,
      name:createDraft.name.trim(),
      tradeName:createDraft.tradeName.trim()||undefined,
      taxId:createDraft.taxId.trim()||undefined,
      notes:createDraft.notes.trim()||undefined,
      contact:createDraft.contactName.trim()?{
        name:createDraft.contactName.trim(),
        phone:createDraft.phone.trim()||undefined,
        email:createDraft.email.trim()||undefined
      }:undefined,
      location:createDraft.label.trim()?{
        label:createDraft.label.trim(),
        address:createDraft.address.trim()||undefined,
        number:createDraft.number.trim()||undefined,
        city:createDraft.city.trim()||undefined,
        state:createDraft.state.trim()||undefined
      }:undefined
    };

    const res=await request("/api/crm/customers","POST",payload,"Não foi possível salvar o cliente.");
    if(!res.ok){
      setModalError(res.error||"Não foi possível salvar o cliente.");
      return;
    }
    setOpenCreate(false);
    setCreateDraft(initialCreateDraft);
    if(typeof res.data?.id==="string"){
      selectCustomer(res.data.id);
    }
    setRefresh(v=>v+1);
  }

  // Update Customer details
  async function handleUpdateCustomer(e:React.FormEvent){
    e.preventDefault();
    if(!selected)return;
    const payload={
      kind:editCustomerDraft.kind,
      name:editCustomerDraft.name.trim(),
      tradeName:editCustomerDraft.tradeName.trim()||null,
      taxId:editCustomerDraft.taxId.trim()||null,
      notes:editCustomerDraft.notes.trim()||null
    };
    const res=await request("/api/crm/customers/"+selected,"PATCH",payload,"Não foi possível atualizar o cliente.");
    if(!res.ok){
      setModalError(res.error||"Não foi possível atualizar o cliente.");
      return;
    }
    setOpenEditCustomer(false);
    setRefresh(v=>v+1);
  }

  // Add Contact
  async function handleAddContact(element:HTMLFormElement){
    if(!selected)return;
    const form=new FormData(element);
    const name=String(form.get("name")||"").trim();
    if(!name)return;
    const res=await request("/api/crm/customers/"+selected+"/contacts","POST",{
      name,
      role:String(form.get("role")||"").trim()||undefined,
      phone:String(form.get("phone")||"").trim()||undefined,
      email:String(form.get("email")||"").trim()||undefined,
      primary:false
    });
    if(!res.ok){setPageError(res.error||"Erro ao adicionar contato.");return}
    resetUnchangedForm(element,form);
    setRefresh(v=>v+1);
  }

  // Update Contact
  async function handleUpdateContact(e:React.FormEvent){
    e.preventDefault();
    if(!selected||!editingContact)return;
    const res=await request("/api/crm/customers/"+selected+"/contacts/"+editingContact.id,"PATCH",{
      name:editingContact.name.trim(),
      role:editingContact.role.trim()||null,
      phone:editingContact.phone.trim()||null,
      email:editingContact.email.trim()||null,
      primary:editingContact.primary
    });
    if(!res.ok){setModalError(res.error||"Erro ao salvar contato.");return}
    setEditingContact(null);
    setRefresh(v=>v+1);
  }

  // Set Primary Contact
  async function handleSetPrimaryContact(contactId:string){
    if(!selected)return;
    const res=await request("/api/crm/customers/"+selected+"/contacts/"+contactId,"PATCH",{primary:true});
    if(!res.ok){setPageError(res.error||"Erro ao definir contato principal.");return}
    setRefresh(v=>v+1);
  }

  // Delete Contact
  async function handleDeleteContact(contactId:string){
    if(!selected||!confirm("Excluir este contato?"))return;
    const res=await request("/api/crm/customers/"+selected+"/contacts/"+contactId,"DELETE");
    if(!res.ok){setPageError(res.error||"Erro ao excluir contato.");return}
    setRefresh(v=>v+1);
  }

  // Add Location
  async function handleAddLocation(element:HTMLFormElement){
    if(!selected)return;
    const form=new FormData(element);
    const label=String(form.get("label")||"").trim();
    if(!label)return;
    const res=await request("/api/crm/customers/"+selected+"/locations","POST",{
      label,
      address:String(form.get("address")||"").trim()||undefined,
      city:String(form.get("city")||"").trim()||undefined,
      state:String(form.get("state")||"").trim()||undefined,
      primary:false
    });
    if(!res.ok){setPageError(res.error||"Erro ao adicionar local.");return}
    resetUnchangedForm(element,form);
    setRefresh(v=>v+1);
  }

  // Update Location
  async function handleUpdateLocation(e:React.FormEvent){
    e.preventDefault();
    if(!selected||!editingLocation)return;
    const res=await request("/api/crm/customers/"+selected+"/locations/"+editingLocation.id,"PATCH",{
      label:editingLocation.label.trim(),
      address:editingLocation.address.trim()||null,
      number:editingLocation.number.trim()||null,
      complement:editingLocation.complement.trim()||null,
      district:editingLocation.district.trim()||null,
      city:editingLocation.city.trim()||null,
      state:editingLocation.state.trim()||null,
      postalCode:editingLocation.postalCode.trim()||null,
      primary:editingLocation.primary
    });
    if(!res.ok){setModalError(res.error||"Erro ao salvar local.");return}
    setEditingLocation(null);
    setRefresh(v=>v+1);
  }

  // Set Primary Location
  async function handleSetPrimaryLocation(locationId:string){
    if(!selected)return;
    const res=await request("/api/crm/customers/"+selected+"/locations/"+locationId,"PATCH",{primary:true});
    if(!res.ok){setPageError(res.error||"Erro ao definir local principal.");return}
    setRefresh(v=>v+1);
  }

  // Delete Location
  async function handleDeleteLocation(locationId:string){
    if(!selected||!confirm("Excluir este local?"))return;
    const res=await request("/api/crm/customers/"+selected+"/locations/"+locationId,"DELETE");
    if(!res.ok){setPageError(res.error||"Erro ao excluir local.");return}
    setRefresh(v=>v+1);
  }

  async function handleLifecycle(){
    if(!selected||role!=="admin"||!lifecycleAction)return;
    const {archived}=lifecycleAction;
    const verb=archived?"arquivar":"restaurar";
    const res=await request("/api/crm/customers/"+selected+"/lifecycle","PATCH",{archived});
    if(!res.ok){setModalError(res.error||`Não foi possível ${verb} o cliente.`);return}
    setLifecycleAction(null);
    setSelected(null);
    setDetail(null);
    setRefresh(value=>value+1);
  }

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <Link className={styles.brand} href="/">Limpax <span>CRM</span></Link>
          <p>{operator} · {role==="admin"?"Administrador":"Atendimento"}</p>
        </div>
        <nav className={styles.nav}>
          <Link href="/crm">Atendimentos</Link>
          <Link href="/">Ver site</Link>
        </nav>
      </header>

      <section className={styles.heading}>
        <div>
          <h1>Clientes.</h1>
          <p>Cadastro único, contatos, locais de atendimento e histórico vinculado.</p>
        </div>

        {/* Dialog Novo Cliente */}
        {!showArchived&&<Dialog open={openCreate} onOpenChange={v=>{setOpenCreate(v);if(v)setModalError("");}}>
          <DialogTrigger asChild>
            <button className={styles.primary}>Novo cliente</button>
          </DialogTrigger>
          <DialogContent className={styles.dialog}>
            <DialogHeader>
              <DialogTitle>Novo cliente</DialogTitle>
              <DialogDescription>Cadastre a identidade uma vez. Contatos e locais podem ser ampliados depois.</DialogDescription>
            </DialogHeader>
            {modalError&&<div className={styles.modalError} role="alert">{modalError}</div>}
            <form className={styles.form} onSubmit={handleCreateCustomer}>
              <label>Tipo
                <select value={createDraft.kind} onChange={e=>setCreateDraft(d=>({...d,kind:e.target.value as CreateDraft["kind"]}))}>
                  <option value="person">Pessoa física</option>
                  <option value="organization">Empresa</option>
                </select>
              </label>
              <label>Nome ou razão social
                <input required minLength={2} maxLength={180} value={createDraft.name} onChange={e=>setCreateDraft(d=>({...d,name:e.target.value}))}/>
              </label>
              <label>Nome fantasia
                <input maxLength={180} value={createDraft.tradeName} onChange={e=>setCreateDraft(d=>({...d,tradeName:e.target.value}))}/>
              </label>
              <label>CPF ou CNPJ
                <input maxLength={30} inputMode="numeric" placeholder="Apenas números ou formatado" value={createDraft.taxId} onChange={e=>setCreateDraft(d=>({...d,taxId:e.target.value}))}/>
              </label>
              <label className={styles.wide}>Observações
                <textarea maxLength={2000} value={createDraft.notes} onChange={e=>setCreateDraft(d=>({...d,notes:e.target.value}))}/>
              </label>

              <label>Contato inicial
                <input maxLength={180} placeholder="Nome do contato" value={createDraft.contactName} onChange={e=>setCreateDraft(d=>({...d,contactName:e.target.value}))}/>
              </label>
              <label>Telefone
                <input maxLength={30} inputMode="tel" placeholder="(00) 00000-0000" value={createDraft.phone} onChange={e=>setCreateDraft(d=>({...d,phone:e.target.value}))}/>
              </label>
              <label className={styles.wide}>E-mail
                <input type="email" maxLength={200} placeholder="contato@exemplo.com" value={createDraft.email} onChange={e=>setCreateDraft(d=>({...d,email:e.target.value}))}/>
              </label>

              <label>Nome do local
                <input maxLength={100} placeholder="Ex.: Residência, Matriz, Filial" value={createDraft.label} onChange={e=>setCreateDraft(d=>({...d,label:e.target.value}))}/>
              </label>
              <label>Endereço
                <input maxLength={240} placeholder="Logradouro" value={createDraft.address} onChange={e=>setCreateDraft(d=>({...d,address:e.target.value}))}/>
              </label>
              <label>Número
                <input maxLength={30} placeholder="Nº / Complemento" value={createDraft.number} onChange={e=>setCreateDraft(d=>({...d,number:e.target.value}))}/>
              </label>
              <label>Cidade
                <input maxLength={120} placeholder="Cidade" value={createDraft.city} onChange={e=>setCreateDraft(d=>({...d,city:e.target.value}))}/>
              </label>
              <label>UF
                <input maxLength={2} placeholder="UF" value={createDraft.state} onChange={e=>setCreateDraft(d=>({...d,state:e.target.value}))}/>
              </label>

              <div className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={()=>setOpenCreate(false)}>Cancelar</button>
                <button type="submit" className={styles.primary} disabled={busy}>{busy?"Salvando…":"Salvar cliente"}</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>}
      </section>

      {pageError&&<p className={styles.error} role="alert">{pageError}</p>}

      <section className={styles.layout}>
        {/* Painel Esquerdo: Lista de Clientes */}
        <aside className={styles.listPane}>
          <div className={styles.search}>
            <label>Buscar cliente
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, telefone, documento"/>
            </label>
            {role==="admin"&&<div className={styles.lifecycleFilter} role="group" aria-label="Estado dos clientes"><button type="button" aria-pressed={!showArchived} onClick={()=>{setShowArchived(false);setPage(1);selectCustomer(null)}}>Ativos</button><button type="button" aria-pressed={showArchived} onClick={()=>{setShowArchived(true);setPage(1);selectCustomer(null)}}>Arquivados</button></div>}
          </div>
          {listingError&&<div className={styles.error} role="alert"><p>{listingError}</p><button type="button" className={styles.ghost} onClick={()=>setListingRefresh(value=>value+1)}>Tentar carregar clientes novamente</button></div>}
          <div className={styles.count}>{listing.total} {showArchived?"clientes arquivados":"clientes ativos"} · {dataMode}</div>
          <div className={styles.list}>
            {listing.customers.map(item=>(
              <button key={item.id} className={styles.customer+(item.id===selected?" "+styles.active:"")} onClick={()=>selectCustomer(item.id)}>
                <strong>{item.tradeName||item.name}</strong>
                <span>{kindLabel[item.kind]} · {item.primaryPhone||item.primaryEmail||"sem contato principal"}</span>
              </button>
            ))}
            {!listing.customers.length&&<p className={styles.empty}>Nenhum cliente encontrado.</p>}
          </div>
          <nav className={styles.pager}>
            <button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>Anterior</button>
            <span>{listing.page} / {listing.pages}</span>
            <button disabled={page>=listing.pages} onClick={()=>setPage(v=>v+1)}>Próxima</button>
          </nav>
        </aside>

        {/* Painel Direito: Detalhes do Cliente Selecionado */}
        <section className={styles.detail}>
          {!selected&&<p className={styles.empty}>Cadastre ou selecione um cliente.</p>}
          {detailError&&<div className={styles.error} role="alert"><p>{detailError}</p><button type="button" className={styles.ghost} onClick={()=>setRefresh(value=>value+1)}>Tentar abrir cliente novamente</button></div>}
          {selected&&!detail&&!detailError&&<p className={styles.empty}>Abrindo cliente…</p>}
          {detail&&(
            <>
              <header className={styles.detailHead}>
                <div>
                  <small>CLIENTE</small>
                  <h2>{detail.tradeName||detail.name}</h2>
                  {detail.tradeName&&<p>{detail.name}</p>}
                </div>
                <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                  <span className={styles.tag}>{detail.archivedAt?"Arquivado":kindLabel[detail.kind]}</span>
                  {role==="admin"&&<button ref={lifecycleButtonRef} className={detail.archivedAt?styles.btnSmall:styles.btnSmallDanger} disabled={busy} onClick={()=>{setModalError("");setLifecycleAction({archived:!detail.archivedAt,customerName:detail.tradeName||detail.name})}}>{detail.archivedAt?"Restaurar":"Arquivar"}</button>}
                  {!detail.archivedAt&&<Dialog open={openEditCustomer} onOpenChange={v=>{setOpenEditCustomer(v);if(v)setModalError("");}}>
                    <DialogTrigger asChild>
                      <button className={styles.btnSmall}>Editar dados</button>
                    </DialogTrigger>
                    <DialogContent className={styles.dialog}>
                      <DialogHeader>
                        <DialogTitle>Editar dados do cliente</DialogTitle>
                        <DialogDescription>Atualize razão social, fantasia, documento e notas cadastrais.</DialogDescription>
                      </DialogHeader>
                      {modalError&&<div className={styles.modalError} role="alert">{modalError}</div>}
                      <form className={styles.form} onSubmit={handleUpdateCustomer}>
                        <label>Tipo
                          <select value={editCustomerDraft.kind} onChange={e=>setEditCustomerDraft(d=>({...d,kind:e.target.value as "person"|"organization"}))}>
                            <option value="person">Pessoa física</option>
                            <option value="organization">Empresa</option>
                          </select>
                        </label>
                        <label>Nome ou razão social
                          <input required minLength={2} maxLength={180} value={editCustomerDraft.name} onChange={e=>setEditCustomerDraft(d=>({...d,name:e.target.value}))}/>
                        </label>
                        <label>Nome fantasia
                          <input maxLength={180} value={editCustomerDraft.tradeName} onChange={e=>setEditCustomerDraft(d=>({...d,tradeName:e.target.value}))}/>
                        </label>
                        <label>CPF ou CNPJ
                          <input maxLength={30} inputMode="numeric" value={editCustomerDraft.taxId} onChange={e=>setEditCustomerDraft(d=>({...d,taxId:e.target.value}))}/>
                        </label>
                        <label className={styles.wide}>Observações
                          <textarea maxLength={2000} value={editCustomerDraft.notes} onChange={e=>setEditCustomerDraft(d=>({...d,notes:e.target.value}))}/>
                        </label>
                        <div className={styles.actions}>
                          <button type="button" className={styles.ghost} onClick={()=>setOpenEditCustomer(false)}>Cancelar</button>
                          <button type="submit" className={styles.primary} disabled={busy}>{busy?"Salvando…":"Salvar alterações"}</button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>}
                </div>
              </header>

              {detail.archivedAt&&<p className={styles.archivedNotice}>Cadastro arquivado em {formatDateTime(detail.archivedAt)}. Contatos, locais e histórico permanecem disponíveis somente para consulta.</p>}

              <div className={styles.facts}>
                <div><span>CPF / CNPJ</span><strong>{detail.taxId||"Não informado"}</strong></div>
                <div><span>Contatos</span><strong>{detail.contacts}</strong></div>
                <div><span>Locais</span><strong>{detail.locations}</strong></div>
              </div>

              {detail.notes&&(
                <div style={{padding:"14px 0",borderBottom:"1px solid #1113",color:"#444",fontSize:".9rem"}}>
                  <strong>Observações:</strong> {detail.notes}
                </div>
              )}

              <div className={styles.sections}>
                {/* Seção Contatos */}
                <section>
                  <h3>Contatos</h3>
                  {detail.contactList.map(item=>(
                    <article className={styles.card} key={item.id}>
                      <div className={styles.cardHeader}>
                        <div>
                          <strong>{item.name} {item.role?`(${item.role})`:""}</strong>
                          <span>{[item.phone,item.email].filter(Boolean).join(" · ")||"Sem telefone ou e-mail"}</span>
                        </div>
                        {item.primary&&<span className={styles.badgePrimary}>Principal</span>}
                      </div>
                      {!detail.archivedAt&&<div className={styles.cardActions}>
                        {!item.primary&&(
                          <button className={styles.btnSmall} onClick={()=>handleSetPrimaryContact(item.id)} disabled={busy}>
                            Tornar principal
                          </button>
                        )}
                        <button className={styles.btnSmall} onClick={()=>{setEditingContact({...item,role:item.role||"",phone:item.phone||"",email:item.email||""});setModalError("");}}>
                          Editar
                        </button>
                        {role==="admin"&&(<button className={styles.btnSmallDanger} onClick={()=>handleDeleteContact(item.id)} disabled={busy}>
                          Excluir
                        </button>)}
                      </div>}
                    </article>
                  ))}
                  {!detail.contactList.length&&<p className={styles.empty}>Nenhum contato cadastrado.</p>}

                  {!detail.archivedAt&&<form className={styles.inline} onSubmit={event=>{event.preventDefault();void handleAddContact(event.currentTarget)}}>
                    <label>Nome<input name="name" required maxLength={180}/></label>
                    <label>Cargo / Função<input name="role" maxLength={80} placeholder="Ex.: Gerente, Síndico"/></label>
                    <label>Telefone<input name="phone" maxLength={30} inputMode="tel"/></label>
                    <label>E-mail<input name="email" type="email" maxLength={200}/></label>
                    <button className={styles.ghost} disabled={busy}>Adicionar contato</button>
                  </form>}
                </section>

                {/* Seção Locais */}
                <section>
                  <h3>Locais de serviço</h3>
                  {detail.locationList.map(item=>(
                    <article className={styles.card} key={item.id}>
                      <div className={styles.cardHeader}>
                        <div>
                          <strong>{item.label}</strong>
                          <span>{[item.address,item.number,item.district,item.city,item.state].filter(Boolean).join(", ")||"Endereço não informado"}</span>
                        </div>
                        {item.primary&&<span className={styles.badgePrimary}>Principal</span>}
                      </div>
                      {!detail.archivedAt&&<div className={styles.cardActions}>
                        {!item.primary&&(
                          <button className={styles.btnSmall} onClick={()=>handleSetPrimaryLocation(item.id)} disabled={busy}>
                            Tornar principal
                          </button>
                        )}
                        <button className={styles.btnSmall} onClick={()=>{setEditingLocation({id:item.id,label:item.label,address:item.address||"",number:item.number||"",complement:item.complement||"",district:item.district||"",city:item.city||"",state:item.state||"",postalCode:item.postalCode||"",primary:item.primary});setModalError("");}}>
                          Editar
                        </button>
                        {role==="admin"&&(<button className={styles.btnSmallDanger} onClick={()=>handleDeleteLocation(item.id)} disabled={busy}>
                          Excluir
                        </button>)}
                      </div>}
                    </article>
                  ))}
                  {!detail.locationList.length&&<p className={styles.empty}>Nenhum local cadastrado.</p>}

                  {!detail.archivedAt&&<form className={styles.inline} onSubmit={event=>{event.preventDefault();void handleAddLocation(event.currentTarget)}}>
                    <label>Nome do local<input name="label" required maxLength={100} placeholder="Ex.: Matriz, Depósito"/></label>
                    <label>Endereço<input name="address" maxLength={240}/></label>
                    <label>Cidade<input name="city" maxLength={120}/></label>
                    <label>UF<input name="state" maxLength={2}/></label>
                    <button className={styles.ghost} disabled={busy}>Adicionar local</button>
                  </form>}
                </section>

                {/* Histórico de Atendimentos / Leads Vinculados */}
                <section className={styles.fullWidthSection}>
                  <h3>Histórico de atendimentos vinculados</h3>
                  {detail.linkedLeads&&detail.linkedLeads.length>0?(
                    <table className={styles.leadsTable}>
                      <thead>
                        <tr>
                          <th>Nº / ID</th>
                          <th>Status</th>
                          <th>Data de abertura</th>
                          <th>Responsável</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.linkedLeads.map(lead=>(
                          <tr key={lead.id}>
                            <td><strong>#{lead.seq}</strong></td>
                            <td><span className={styles.tag}>{lead.status}</span></td>
                            <td>{formatDateTime(lead.createdAt)}</td>
                            <td>{lead.assignedTo||"Não atribuído"}</td>
                            <td>
                              <a className={styles.btnSmall} href={`/crm?selected=${lead.id}`}>Ver atendimento</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ):(
                    <p className={styles.empty}>Nenhum atendimento vinculado a este cliente até o momento.</p>
                  )}
                </section>
              </div>

              {/* Dialog Edição de Contato */}
              <Dialog open={!!editingContact} onOpenChange={v=>{if(!v)setEditingContact(null);}}>
                <DialogContent className={styles.dialog}>
                  <DialogHeader>
                    <DialogTitle>Editar contato</DialogTitle>
                    <DialogDescription>Modifique as informações do contato do cliente.</DialogDescription>
                  </DialogHeader>
                  {modalError&&<div className={styles.modalError} role="alert">{modalError}</div>}
                  {editingContact&&(
                    <form className={styles.form} onSubmit={handleUpdateContact}>
                      <label className={styles.wide}>Nome
                        <input required maxLength={180} value={editingContact.name} onChange={e=>setEditingContact({...editingContact,name:e.target.value})}/>
                      </label>
                      <label>Cargo / Função
                        <input maxLength={80} value={editingContact.role} onChange={e=>setEditingContact({...editingContact,role:e.target.value})}/>
                      </label>
                      <label>Telefone
                        <input maxLength={30} inputMode="tel" value={editingContact.phone} onChange={e=>setEditingContact({...editingContact,phone:e.target.value})}/>
                      </label>
                      <label className={styles.wide}>E-mail
                        <input type="email" maxLength={200} value={editingContact.email} onChange={e=>setEditingContact({...editingContact,email:e.target.value})}/>
                      </label>
                      <div className={styles.actions}>
                        <button type="button" className={styles.ghost} onClick={()=>setEditingContact(null)}>Cancelar</button>
                        <button type="submit" className={styles.primary} disabled={busy}>{busy?"Salvando…":"Salvar contato"}</button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              {/* Dialog Edição de Local */}
              <Dialog open={!!editingLocation} onOpenChange={v=>{if(!v)setEditingLocation(null);}}>
                <DialogContent className={styles.dialog}>
                  <DialogHeader>
                    <DialogTitle>Editar local de serviço</DialogTitle>
                    <DialogDescription>Atualize os dados de endereço do local.</DialogDescription>
                  </DialogHeader>
                  {modalError&&<div className={styles.modalError} role="alert">{modalError}</div>}
                  {editingLocation&&(
                    <form className={styles.form} onSubmit={handleUpdateLocation}>
                      <label className={styles.wide}>Identificação do local
                        <input required maxLength={100} value={editingLocation.label} onChange={e=>setEditingLocation({...editingLocation,label:e.target.value})}/>
                      </label>
                      <label>CEP
                        <input maxLength={12} value={editingLocation.postalCode} onChange={e=>setEditingLocation({...editingLocation,postalCode:e.target.value})}/>
                      </label>
                      <label>Endereço
                        <input maxLength={240} value={editingLocation.address} onChange={e=>setEditingLocation({...editingLocation,address:e.target.value})}/>
                      </label>
                      <label>Número
                        <input maxLength={30} value={editingLocation.number} onChange={e=>setEditingLocation({...editingLocation,number:e.target.value})}/>
                      </label>
                      <label>Complemento
                        <input maxLength={60} value={editingLocation.complement} onChange={e=>setEditingLocation({...editingLocation,complement:e.target.value})}/>
                      </label>
                      <label>Bairro
                        <input maxLength={100} value={editingLocation.district} onChange={e=>setEditingLocation({...editingLocation,district:e.target.value})}/>
                      </label>
                      <label>Cidade
                        <input maxLength={120} value={editingLocation.city} onChange={e=>setEditingLocation({...editingLocation,city:e.target.value})}/>
                      </label>
                      <label>UF
                        <input maxLength={2} value={editingLocation.state} onChange={e=>setEditingLocation({...editingLocation,state:e.target.value})}/>
                      </label>
                      <div className={styles.actions}>
                        <button type="button" className={styles.ghost} onClick={()=>setEditingLocation(null)}>Cancelar</button>
                        <button type="submit" className={styles.primary} disabled={busy}>{busy?"Salvando…":"Salvar local"}</button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </section>
      </section>

      <Dialog open={!!lifecycleAction} onOpenChange={open=>{if(!open&&!busy){setLifecycleAction(null);setModalError("")}}}>
        {lifecycleAction&&<DialogContent className={styles.dialog} onCloseAutoFocus={event=>{event.preventDefault();lifecycleButtonRef.current?.focus()}}>
          <DialogHeader>
            <DialogTitle>{lifecycleAction.archived?"Arquivar cliente?":"Restaurar cliente?"}</DialogTitle>
            <DialogDescription>
              {lifecycleAction.archived
                ?`O cadastro de ${lifecycleAction.customerName} sairá da operação ativa. Contatos, locais e histórico serão preservados.`
                :`O cadastro de ${lifecycleAction.customerName} voltará para a operação ativa com seus contatos, locais e histórico.`}
            </DialogDescription>
          </DialogHeader>
          {modalError&&<div className={styles.modalError} role="alert">{modalError}</div>}
          <div className={styles.actions}>
            <button type="button" className={styles.ghost} disabled={busy} onClick={()=>{setLifecycleAction(null);setModalError("")}}>Cancelar</button>
            <button type="button" className={lifecycleAction.archived?styles.btnSmallDanger:styles.primary} disabled={busy} onClick={()=>void handleLifecycle()}>
              {busy?"Processando…":lifecycleAction.archived?"Arquivar cliente":"Restaurar cliente"}
            </button>
          </div>
        </DialogContent>}
      </Dialog>
    </main>
  );
}
