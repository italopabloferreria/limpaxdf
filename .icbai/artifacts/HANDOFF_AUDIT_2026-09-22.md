# Auditoria de handoff multiagente

Data: 22/09/2026. Escopo: repositório, documentação, estado ICB-AI, Git, migrações, CRM, testes e infraestrutura. Nenhuma feature, migração remota ou publicação foi executada.

## Confirmado no código

- Stack atual: React 19.2.6, TypeScript 5.9.3, Next API 16.3.4, Vinext/Vite, Cloudflare Workers, D1/Drizzle e R2.
- HEAD `98c0bbf` em `main`; árvore com mudanças válidas não commitadas e novos arquivos preservados.
- Migrações D1 0000–0005 presentes.
- Núcleo A01–A08: acesso/papéis, clientes, contatos, locais, leads, tarefas, notas, vínculos, lifecycle review/live/archive, auditoria e idempotência.
- O hosting existente usa `.openai/hosting.json`; o site publicado conhecido continua privado e não prova que o CRM local atual foi implantado.
- Não há dependência Supabase, projeto Supabase, Auth Google, RLS ou Storage Supabase implementado.

## Verificação atual

- `node scripts/test.mjs`: 16/16 PASS.
- Sete suítes específicas: 31/31 PASS. Total consolidado: 47/47 PASS.
- `npx tsc --noEmit --incremental false`: PASS.
- `npm run build`: PASS, com avisos de depreciação do runtime/middleware.
- `npx eslint app components lib tests`: FAIL, 48 erros e 7 avisos.
- `npm run lint`: FAIL, 60 erros e 3.256 avisos; inclui `.sites-runtime` gerado, embora o diretório esteja ignorado pelo Git.

## Divergências encontradas

1. `PROJECT_STATE.json` apontava G13, mas `FLOW.md`, `IMPLEMENTATION_PLAN.md` e trechos de `00-RETOMADA.md` ainda indicavam A03/A04b ou Antigravity como próximo passo.
2. `PROJECT_PROFILE.json`, `FLOW.md`, `DECISIONS.md` e `AUDIT.md` ainda usavam o caminho antigo `C:/Users/italo/Programação/Limpax`.
3. O estado registrava 21 erros/2 avisos para um recorte de CRM; a medição atual do código próprio é 48/7 e a global 60/3.256.
4. Documentos antigos diziam preservar D1/R2 e evitar Supabase. A decisão atual é preservar D1/R2 durante uma migração futura, reversível, para Supabase.
5. O login atual depende da identidade do hosting; Google Login é planejado, não implementado.
6. A empresa possui domínio próprio, mas o valor exato, DNS e subdomínios não estão documentados.
7. Sidebar, integrações Google, Life360/frota, importador, comercial, contratos, agenda, financeiro e fiscal são decisões/roadmap, não funcionalidades entregues.
8. O plano Free do Supabase é plausível para homologação, mas não inclui backup automático, pode pausar por inatividade e não oferece SLA; produção permanece decisão `[VALIDAR]`.
9. `.icbai/` estava ignorado pelo Git, impedindo que o estado estruturado acompanhasse o repositório. A regra foi removida; estados locais e segredos continuam fora desse diretório.

## Classificação atual

- Implementado e verificado localmente: núcleo A01–A08 e checks acima.
- Implementado, mas incompleto: UI/QA integral, operação remota, recuperação, lint e autenticação independente.
- Decidido/documentado, não implementado: arquitetura Supabase e módulos do roadmap.
- Legado/compatibilidade: D1/R2, rotas compactadas e integração Sites permanecem ativos até migração validada; não são lixo.
- Problemas reais: G13 reprovado, lint ambíguo, ausência de ensaio de recuperação, migrações remotas não comprovadas e documentação histórica divergente.

## Resultado do gate

G13 permanece FAIL. A próxima tarefa única é `G13-LINT-01` em `docs/CURRENT_TASK.md`. Supabase só começa após a base ser estabilizada e uma tarefa específica ser aprovada.
