# Limpax — Tudo precisa continuar fluindo

Site funcional em React, TypeScript, Vinext/Cloudflare Workers, D1, Drizzle e R2. Publicação inicial privada em modo de revisão; registros de teste não são encaminhados ao CRM.

## Retomada por agentes

Este repositório é a fonte de verdade. Qualquer agente deve começar por `AGENTS.md`, `.icbai/PROJECT_STATE.json`, `docs/AI_HANDOFF.md` e `docs/CURRENT_TASK.md`. O backend atual continua D1/R2; Supabase é a arquitetura alvo documentada para migração reversível após o G13.

## Documentação

- [Retomada e plano do CRM completo](docs/crm/00-RETOMADA.md) — começar aqui para evoluir o CRM; decisões, módulos e leitura por tarefa.
- [Handoff atual](docs/AI_HANDOFF.md) e [tarefa única](docs/CURRENT_TASK.md)
- [Prompt padrão para outros agentes](docs/AGENT_RESUME_PROMPT.md)
- [Roadmap por dependências](docs/ROADMAP.md) e [plano Supabase](docs/SUPABASE_MIGRATION_PLAN.md)
- [Marca, logo e tipografia](docs/01-brand-source-of-truth.md)
- [Experiência, sitemap e copy](docs/02-product-experience-spec.md)
- [Brief de implementação](docs/03-codex-master-implementation-brief.md)
- [Operação, APIs, ambiente e CRM](docs/04-operacao-apis-crm.md)
- [Verificação e limitações](docs/05-validacao.md)

## Executar

Node >=22.13 e npm. `npm run install:ci`, `npm run build`, `npm run dev`. Desenvolvimento: http://localhost:5173. `npm start` executa o Worker compilado localmente. Use dados fictícios.

Banco local após primeiro build (aplicar cada migração uma única vez):

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fat_supernaut.sql
```

Novas alterações de schema exigem migração incremental: `npm run db:generate`. Não apagar o banco para atualizar instalação existente.

Verificações: `node scripts/test.mjs`, `node node_modules/typescript/bin/tsc --noEmit`, `node scripts/smoke.mjs` (servidor local ativo), `npm run build`. Testes HTTP criam dados sintéticos locais; testes de negócio usam SQLite em memória.

## Publicar e ativar

Reutilizar o project_id de `.openai/hosting.json`. Commitar e enviar fonte ao repositório Sites; compilar esse estado exato; empacotar somente dist com manifest e migrações; salvar versão com SHA completo enviado; publicar e aguardar status final. Não persistir credenciais Git temporárias. Variáveis de produção entram no gerenciador Sites; `.env.example` contém nomes sem segredos. DB e BUCKET são bindings gerenciados.

Rollback: publicar versão anterior; migrações destrutivas precisam de plano independente de recuperação. Antes de live: validar identidade, contato de privacidade, base legal/retenção, serviços/cobertura, CRM e agendador, realizar teste de destino e só então configurar CAPTURE_MODE=live. Remover noindex apenas após aprovação editorial. A mudança de audiência pública é separada da implantação privada.

Logo original: public/media/limpax-logo-original.png. Fotos conceituais IA: hero.webp e operation.webp; substituir por mídia real aprovada preservando enquadramento/compressão. Fontes locais com OFL. Fonte do lettering da logo: 13_Misa, confirmada pelo solicitante; referência e licença pendente registradas no documento de marca.
# limpax
# limpaxdf

