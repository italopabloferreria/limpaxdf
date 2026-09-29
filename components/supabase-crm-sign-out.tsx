"use client";
import {useState} from "react";

export function SupabaseCrmSignOut({className}:{className?:string}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function signOut(){
    setBusy(true);
    setError("");
    try{
      const response=await fetch("/api/supabase/homologation/logout",{method:"POST",cache:"no-store"});
      if(!response.ok)throw new Error();
      window.location.replace("/supabase/homologacao");
    }catch{
      setError("Não foi possível sair. Tente novamente.");
      setBusy(false);
    }
  }

  return <span><button className={className} type="button" disabled={busy} onClick={signOut}>{busy?"Saindo…":"Sair"}</button>{error&&<span role="alert">{error}</span>}</span>;
}
