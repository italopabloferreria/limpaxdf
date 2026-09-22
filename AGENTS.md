# LIMPAX — regras permanentes para agentes

## Objetivo do produto

Evoluir o site e o CRM da Limpax para uma operação profissional de atendimento, clientes, comercial, documentos, agenda, frota, financeiro e gestão. Preserve a identidade "Tudo precisa continuar fluindo" e não invente fatos empresariais, licenças, cobertura, SLA, preços ou características da frota.

## Estado e fontes de verdade

Antes de qualquer alteração, leia nesta ordem:

1. `.icbai/PROJECT_STATE.json` — estado estruturado e gates.
2. `docs/AI_HANDOFF.md` — resumo atual para retomada.
3. `docs/CURRENT_TASK.md` — única tarefa autorizada/ativa.
4. Código, migrações e testes relacionados à tarefa.
5. Documentos referenciados pelo handoff ou pela tarefa.

Documentação antiga não prevalece sobre código verificado. Ao encontrar divergência, registre-a; não ajuste o código apenas para fazê-lo coincidir com um texto antigo.

## Stack atual e arquitetura alvo

- Atual: React 19, TypeScript, Next API/Vinext/Vite, Cloudflare Workers, D1/SQLite, Drizzle e R2.
- Alvo aprovado: Supabase PostgreSQL, Auth com Google, RLS e Storage privado, adotados por migração reversível.
- D1/R2 permanecem intactos até existirem mapeamento, testes, backup, rollback e validação da migração.
- O site pode continuar no hosting atual enquanto o núcleo do CRM migra. O domínio próprio existe; endereço e DNS estão `[VALIDAR]`.

## Comandos oficiais

```powershell
npm run dev
node scripts/test.mjs
node scripts/test-crm-access.mjs
node scripts/test-crm-deep-link.mjs
node scripts/test-crm-selection-state.mjs
node scripts/test-crm-customer-link.mjs
node scripts/test-crm-lifecycle.mjs
node scripts/test-crm-customer-lifecycle.mjs
node scripts/test-crm-integrity.mjs
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

O lint global ignora `.sites-runtime`, `dist` e `.next`, que são artefatos gerados. Não esconda erros próprios por exclusões amplas.

## Padrões obrigatórios

- Trabalhe apenas no escopo de `docs/CURRENT_TASK.md`.
- Preserve a árvore suja e mudanças existentes; não use reset destrutivo.
- Faça mudanças pequenas, verificáveis e compatíveis com os fluxos existentes.
- APIs validam entrada, autorização, origem e pertencimento no servidor.
- Mutações críticas são atômicas e idempotentes quando podem ser repetidas.
- Datas operacionais usam `America/Sao_Paulo`; valores monetários não usam ponto flutuante.
- UI deve funcionar com teclado, foco visível, texto além de cor e telas pequenas.
- Marque dados não confirmados como `[VALIDAR]`.
- Migrações são incrementais; nunca edite uma migração já aplicada.

## Segurança e dados

- Nunca versionar credenciais, tokens, certificados, planilhas reais ou PII de clientes.
- Nunca expor chave `service_role` do Supabase ao cliente.
- Toda tabela Supabase exposta deve usar RLS com políticas específicas; `authenticated` sozinho não é autorização.
- Papéis vêm de dados administrativos controlados, não de `user_metadata` editável.
- Storage é privado e entregue por autorização ou URL assinada curta.
- Google Drive recebe cópias organizacionais; não é banco nem storage operacional principal.
- WhatsApp continua via `wa.me`, sem alegar envio ou leitura automática.
- Fiscal e rastreamento dependem de descoberta e consentimento; não improvisar integrações.

## Nunca fazer

- Não apagar ou substituir D1/R2 antes de migração validada e reversível.
- Não aplicar migração remota, importar dados reais, publicar, alterar DNS ou convidar usuários sem autorização específica.
- Não reescrever partes funcionais por preferência arquitetural.
- Não construir módulos futuros fora da tarefa ativa.
- Não chamar o CRM de produção enquanto G13 estiver reprovado.

## Fluxo de sessão

Antes: leia as fontes, confira `git status`, valide a evidência afetada e confirme o primeiro gate incompleto.

Depois: execute os checks aplicáveis, registre resultado/limitações e atualize `.icbai/PROJECT_STATE.json`, `docs/AI_HANDOFF.md` e `docs/CURRENT_TASK.md`. Nenhuma sessão termina com estado relevante apenas no chat.
