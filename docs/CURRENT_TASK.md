# Tarefa ativa — AUDIT-CLEANUP-01

## Autorização e pasta

Em 24/09/2026, o usuário pediu revisar todo o projeto, remover legado sem uso, corrigir erros e fazer commit/push no GitHub antes de retomar Supabase. Pasta oficial: `C:/Users/italo/Programação/Limpax`. Remoto autorizado: `origin`, repositório `italopabloferreria/limpaxdf`.

## Escopo

Revisão estática das camadas de aplicação, APIs, dados, autenticação, configuração, dependências e documentação; remoção baseada em referências; testes locais e build; inspeção de arquivos antes do commit; envio normal ao GitHub sem force-push.

D1/R2, APIs em uso, migrações existentes, fontes de mídia e histórico relevante são preservados. Não há deploy, configuração OAuth remota, importação real, alteração de DNS ou remoção da cópia alternativa nesta etapa.

## Resultado

Revisão local concluída: 65 arquivos sem uso removidos, correções verificadas, 78 testes/cenários aprovados, TypeScript/lint/build e smoke de cinco rotas aprovados. Dependências de produção sem avisos; quatro moderados permanecem na cadeia de desenvolvimento drizzle-kit/esbuild. Alterações preparadas para o commit/push solicitado em `origin/main`; a entrega pode ser conferida pelo histórico Git. Consultar `docs/AUDIT_2026-09-24.md` para detalhes. Primeiro gate incompleto: G13_RELEASE_GATE. A publicação de código no GitHub não fecha esse gate.

## Próximo passo após concluir a revisão

Retomar S01 de homologação Supabase: configurar Google OAuth e redirects, verificar login/logout, criar perfis controlados e testar RLS com identidades/lote sintéticos. `SUPABASE_DATA_MODE=disabled` até aceite completo. `SUPABASE_GOOGLE_ENABLED` permanece false/ausente enquanto a configuração externa estiver incompleta.

## Bloqueios externos e futuro

OAuth/e-mail de suporte/identidades ainda pendentes de confirmação. G13 depende de migrações, backup/restauração, configuração e desempenho remotos. Importador, comercial, documentos, agenda/OS, frota, financeiro e fiscal são fases futuras em `docs/ROADMAP.md`.
