import {settings} from "@/lib/config";
import Link from "next/link";
import type {Metadata} from "next";
import {getSupabaseConfig} from "@/lib/supabase";
import {homologationOrigin} from "@/lib/supabase-homologation";
import {HomologationSignIn} from "@/components/supabase-homologation-sign-in";
import {supabaseCrmReadEnabled} from "@/lib/supabase-crm-access";
import styles from "@/components/supabase-login.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Acesso ao CRM"};

type HomologationPageProps={searchParams?:Promise<{status?:string|string[]}>};

export default async function HomologationPage({searchParams}:HomologationPageProps){
  const s=settings();
  const config=getSupabaseConfig(s);
  const origin=homologationOrigin(s);
  const query=await searchParams;
  const status=typeof query?.status==="string"?query.status:"";
  if(!config||!origin)return <main id="conteudo"><h1>Homologação indisponível</h1></main>;
  const crmReadEnabled=supabaseCrmReadEnabled(s);
  return <main id="conteudo" className={styles.page}>
    <div className={styles.frame}>
      <section className={styles.story} aria-label="Limpax CRM">
        <div className={styles.storyShade}/>
        <div className={styles.storyContent}>
          <Link className={styles.brand} href="/" aria-label="Limpax, página inicial">Limpax<span>.</span></Link>
          <div className={styles.storyMessage}>
            <p className={styles.kicker}>LIMPAX / CRM</p>
            <h1>O trabalho<br/>continua <em>fluindo.</em></h1>
            <p>Atendimentos e clientes em um só lugar, com acesso reservado à equipe.</p>
          </div>
          <p className={styles.storyFoot}>Tudo precisa continuar fluindo.</p>
        </div>
      </section>
      <section className={styles.access} aria-labelledby="login-title">
        <div className={styles.accessInner}>
          <div className={styles.accessTop}><span className={styles.accessMark}>L / CRM</span><span className={styles.previewBadge}>Ambiente de testes</span></div>
          <div className={styles.accessHeading}>
            <p className={styles.kicker}>ACESSO DA EQUIPE</p>
            <h2 id="login-title">Bem-vindo ao<br/>seu espaço.</h2>
            <p>{crmReadEnabled?"Entre com a conta Google previamente cadastrada para abrir o CRM.":"Entre com sua conta Google para verificar o acesso ao CRM nesta prévia."}</p>
          </div>
          <HomologationSignIn url={config.url} publishableKey={config.publishableKey} origin={origin} googleEnabled={s.SUPABASE_GOOGLE_ENABLED==="true"} approvalsEnabled={s.SUPABASE_GOOGLE_APPROVALS_ENABLED==="true"} crmReadEnabled={crmReadEnabled} loginStatus={status}/>
          <p className={styles.accessFoot}>Acesso restrito a pessoas cadastradas pela Limpax.</p>
        </div>
      </section>
    </div>
  </main>;
}
