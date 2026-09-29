import {chatGPTSignInPath} from "@/app/chatgpt-auth";
import Link from "next/link";
import styles from "./supabase-login.module.css";

export function CrmAccessGate({status, returnTo, previewReadEnabled=false}: {
  status: 401 | 403 | 503;
  returnTo: string;
  previewReadEnabled?: boolean;
}) {
  if (process.env.LIMPAX_DEPLOYMENT_TARGET === "vercel-preview") {
    if(previewReadEnabled)return <main id="conteudo" className="crm-gate"><p className="eyebrow">LIMPAX / CRM</p><h1>Acesso da equipe.</h1><p>Entre com uma conta Google cadastrada para consultar o CRM. Se a conta não estiver aprovada ou estiver desativada, a página de acesso mostrará o motivo.</p><a className="button" href="/supabase/homologacao">Verificar meu acesso</a></main>;
    return <main id="conteudo" className="crm-gate"><p className="eyebrow">LIMPAX / CRM</p><h1>CRM em preparação</h1><p>Esta prévia permite revisar o site. O acesso ao CRM será habilitado quando a migração de autenticação e dados estiver concluída.</p><a className="button" href="/supabase/homologacao">Testar acesso com Google</a></main>;
  }
  if(status===401)return <main id="conteudo" className={styles.page}>
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
          <div className={styles.accessTop}><span className={styles.accessMark}>L / CRM</span><span className={styles.previewBadge}>Acesso da equipe</span></div>
          <div className={styles.accessHeading}>
            <p className={styles.kicker}>ENTRAR NO CRM</p>
            <h2 id="login-title">Bem-vindo ao<br/>seu espaço.</h2>
            <p>Entre com uma conta autorizada para abrir o CRM.</p>
          </div>
          <a className={styles.primaryLink} href={chatGPTSignInPath(returnTo)}>Entrar no CRM <span aria-hidden="true">↗</span></a>
          {process.env.NODE_ENV==="development"&&<p className={styles.notice}>Ambiente local de desenvolvimento: esta conta de teste é separada do acesso Google da prévia Vercel.</p>}
          <p className={styles.accessFoot}>Acesso restrito a pessoas cadastradas pela Limpax.</p>
        </div>
      </section>
    </div>
  </main>;
  const title = status === 403 ? "CRM protegido." : "CRM temporariamente indisponível.";
  const message = status === 403
      ? "Esta conta não está autorizada ou foi desativada. Fale com o administrador."
      : "Não foi possível verificar seu acesso agora. Tente novamente em alguns instantes.";
  return (
    <main id="conteudo" className="crm-gate">
      <p className="eyebrow">LIMPAX / CRM</p>
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}
