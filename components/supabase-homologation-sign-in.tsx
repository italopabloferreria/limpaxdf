"use client";
import {useEffect,useState} from "react";
import {createBrowserClient} from "@supabase/ssr";

type SessionState={status:"signed_out"|"no_profile"|"inactive"|"authorized";role:string|null};
const labels:Record<SessionState["status"],string>={signed_out:"Sem sessão Supabase.",no_profile:"Conta autenticada, sem perfil CRM vinculado.",inactive:"Perfil CRM desativado.",authorized:"Perfil CRM ativo."};

export function HomologationSignIn({url,publishableKey,googleEnabled=false}:{url:string;publishableKey:string;googleEnabled?:boolean}){
  const [state,setState]=useState<SessionState|null>(null);
  const [error,setError]=useState("");
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
      const {error:authError}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/api/supabase/homologation/callback`}});
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
  return <section className="space-y-4 rounded-xl border p-6" aria-live="polite">
    <p>{state?labels[state.status]:"Verificando sessão…"}</p>
    {state?.role&&<p>Papel: {state.role==="admin"?"Administrador":"Atendente"}</p>}
    {error&&<p role="alert">{error}</p>}
    {!googleEnabled&&<p>O login Google está aguardando a conclusão da configuração. Tente novamente após a ativação.</p>}
    {state?.status==="signed_out"&&<button type="button" disabled={busy||!googleEnabled} onClick={signIn} className="rounded-lg bg-black px-4 py-2 text-white focus-visible:outline-2 disabled:opacity-50">Entrar com Google</button>}
    {state&&state.status!=="signed_out"&&<button type="button" disabled={busy} onClick={signOut} className="rounded-lg border px-4 py-2 focus-visible:outline-2">Sair</button>}
  </section>;
}
