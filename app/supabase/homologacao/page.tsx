import {settings} from "@/lib/config";
import {getSupabaseConfig} from "@/lib/supabase";
import {homologationOrigin} from "@/lib/supabase-homologation";
import {HomologationSignIn} from "@/components/supabase-homologation-sign-in";

export const dynamic="force-dynamic";

export default function HomologationPage(){
  const s=settings();
  const config=getSupabaseConfig(s);
  if(!config||!homologationOrigin(s))return <main id="conteudo"><h1>Homologação indisponível</h1></main>;
  return <main id="conteudo" className="mx-auto max-w-xl space-y-6 px-5 py-12">
    <p className="text-sm uppercase tracking-wider">LIMPAX / HOMOLOGAÇÃO</p>
    <h1 className="text-3xl font-semibold">Acesso de teste com Supabase</h1>
    <p>Este ambiente valida login e perfil do CRM. Os atendimentos operacionais continuam na interface atual.</p>
    <HomologationSignIn url={config.url} publishableKey={config.publishableKey} googleEnabled={s.SUPABASE_GOOGLE_ENABLED==="true"}/>
  </main>;
}
