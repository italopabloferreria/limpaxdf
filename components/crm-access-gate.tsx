import {chatGPTSignInPath} from "@/app/chatgpt-auth";

export function CrmAccessGate({status, returnTo}: {
  status: 401 | 403 | 503;
  returnTo: string;
}) {
  if (process.env.LIMPAX_DEPLOYMENT_TARGET === "vercel-preview") {
    return <main id="conteudo" className="crm-gate"><p className="eyebrow">LIMPAX / CRM</p><h1>CRM em preparação</h1><p>Esta prévia permite revisar o site. O acesso ao CRM será habilitado quando a migração de autenticação e dados estiver concluída.</p><a className="button" href="/supabase/homologacao">Testar acesso com Google</a></main>;
  }
  const title = status === 401 ? "Acesso da equipe." : status === 403 ? "CRM protegido." : "CRM temporariamente indisponível.";
  const message = status === 401
    ? "Entre com uma conta autorizada para abrir o CRM."
    : status === 403
      ? "Esta conta não está autorizada ou foi desativada. Fale com o administrador."
      : "Não foi possível verificar seu acesso agora. Tente novamente em alguns instantes.";
  return (
    <main id="conteudo" className="crm-gate">
      <p className="eyebrow">LIMPAX / CRM</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {status === 401 && <a className="button" href={chatGPTSignInPath(returnTo)} target="_top">Entrar no CRM</a>}
    </main>
  );
}
