"use client";
import {useEffect,useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
import styles from "./supabase-login.module.css";

type SessionState={status:"signed_out"|"no_profile"|"inactive"|"authorized";role:string|null};
const labels:Record<SessionState["status"],string>={signed_out:"Sem sessão Supabase.",no_profile:"Usuário não registrado. Solicite acesso ao administrador.",inactive:"Acesso ao CRM desativado.",authorized:"Perfil CRM ativo."};

export function HomologationSignIn({url,publishableKey,origin,googleEnabled=false,approvalsEnabled=false,crmReadEnabled=false,loginStatus=""}:{url:string;publishableKey:string;origin:string;googleEnabled?:boolean;approvalsEnabled?:boolean;crmReadEnabled?:boolean;loginStatus?:string}){
  const [state,setState]=useState<SessionState|null>(null);
  const [error,setError]=useState(loginStatus==="unregistered"?"Usuário não registrado. Solicite acesso ao administrador.":loginStatus==="error"?"Não foi possível concluir o login Google.":"");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/supabase/homologation/session",{cache:"no-store",signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error("Não foi possível verificar a sessão.");return response.json() as Promise<SessionState>})
      .then(value=>setState(value))
      .catch(()=>{if(!controller.signal.aborted)setError("Não foi possível verificar a sessão.")});
    return ()=>controller.abort();
  },[]);
  async function signIn(){
    if(!googleEnabled)return;
    setBusy(true);setError("");
    try{
      const client=createBrowserClient(url,publishableKey,{auth:{flowType:"pkce"},cookieOptions:{sameSite:"lax",secure:window.location.protocol==="https:"}});
      const {error:authError}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${origin}/api/supabase/homologation/callback`}});
      if(authError)throw authError;
    }catch{setError("Não foi possível iniciar o login Google.");setBusy(false)}
  }
  async function signOut(){
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/supabase/homologation/logout",{method:"POST",cache:"no-store"});
      if(!response.ok)throw new Error();
      setState({status:"signed_out",role:null});
    }catch{setError("Não foi possível sair da sessão.")}
    finally{setBusy(false)}
  }
  return <div className={styles.session} aria-live="polite">
    <div className={styles.sessionStatus}><span className={styles.statusDot} data-state={state?.status||"loading"}/><span>{state?labels[state.status]:"Verificando sessão…"}</span></div>
    {state?.role&&<p className={styles.role}>Papel: {state.role==="super_admin"?"Superadministrador":state.role==="admin"?"Administrador":"Atendente"}</p>}
    {error&&<p className={styles.error} role="alert">{error}</p>}
    {!googleEnabled&&<p className={styles.notice}>O login Google está aguardando a conclusão da configuração. Tente novamente após a ativação.</p>}
    {state?.status==="signed_out"&&<button type="button" disabled={busy||!googleEnabled} onClick={signIn} className={styles.googleButton}><span className={styles.googleMark} aria-hidden="true">G</span><span>{busy?"Abrindo Google…":"Continuar com Google"}</span><span aria-hidden="true">↗</span></button>}
    {state&&state.status!=="signed_out"&&<button type="button" disabled={busy} onClick={signOut} className={styles.signOutButton}>Sair da conta</button>}
    {state?.status==="authorized"&&<nav aria-label="CRM" className={styles.crmLinks}>{crmReadEnabled&&<a className={styles.primaryLink} href="/crm">Abrir atendimentos <span aria-hidden="true">↗</span></a>}{crmReadEnabled&&<a href="/crm/clientes">Clientes</a>}{approvalsEnabled&&<a href="/crm/perfil">Meu perfil</a>}</nav>}
  </div>;
}
