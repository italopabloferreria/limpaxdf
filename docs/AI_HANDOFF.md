# LIMPAX — handoff atual

Atualizado em 22/09/2026. Repositório canônico: `C:/Users/italo/Programação/Limpax`.

## Sessão 2026-09-22

`G13-LINT-01` foi concluído. O ESLint ignora `.sites-runtime/**`, artefato gerado, e termina com zero erros e zero avisos sem desativação global de regras. Foram corrigidos links internos, efeitos React e tipos nos handlers, componentes, utilitários e testes. As oito suítes somam 47/47 testes aprovados; TypeScript e build também passam. G13 continua FAIL apenas pelos itens de QA e recuperação ainda pendentes.

`G13-QA-01` foi iniciado no repositório canônico. No navegador local autenticado, foram validados criação e conclusão de tarefa, nota, criação de cliente sintético, vínculo com contato/local e histórico com deep link. Um clique duplo reproduziu nota duplicada; `CrmWorkspace` agora bloqueia mutações concorrentes e o mesmo teste gerou uma única nota. O ensaio `npm run qa:recovery` copiou e restaurou 14 arquivos, comparou hashes e aprovou a integridade SQLite de 16 tabelas. A jornada de teclado passou em `/crm` e `/crm/clientes`, incluindo skip link, ordem de foco, diálogo, retorno ao gatilho e validação de campo obrigatório. Em 390 × 844, clientes e o formulário longo ficaram sem overflow horizontal, com rolagem interna e ações alcançáveis. A varredura local de 54 textos visíveis não encontrou falha AA e o menor contraste foi 4,64:1. As quatro rotas responderam entre 62 ms e 117 ms em rodada aquecida do servidor de desenvolvimento; isso não equivale a Core Web Vitals de produção. O ciclo arquivar/restaurar continua pendente.

## Fase atual

`EXISTING PROJECT → AUDIT & RESUME`. O núcleo A01–A08 está implementado localmente. O gate ativo é **G13 / Release Gate**, ainda reprovado. Não há autorização de deploy, migração remota ou uso de dados reais.

## Última tarefa concluída

Handoff multiagente e auditoria reconciliados. Foram confirmados:

- 47/47 testes nas oito suítes existentes;
- TypeScript aprovado;
- build de produção aprovado;
- lint global aprovado com zero erros e zero avisos; `.sites-runtime/**` é ignorado por ser artefato gerado;
- migrações D1 0000–0005 presentes; 0003–0005 sem aplicação remota comprovada;
- CRM local possui acesso/papéis, clientes, contatos, locais, leads, tarefas, notas, vínculos, review/live/archive, auditoria e idempotência;
- importador, comercial completo, contratos, agenda/OS, financeiro, fiscal e integrações Google ainda não estão implementados.

## Próxima tarefa única

Continuar `G13-QA-01`, descrita em `docs/CURRENT_TASK.md`, pelo ciclo arquivar/restaurar. Depois preparar a validação remota e a medição de produção sem iniciar Supabase nesta tarefa.

## Decisões recentes

- Supabase é a arquitetura alvo para PostgreSQL, Auth/Google, RLS e Storage privado.
- A migração será posterior ao fechamento da base G13, incremental e reversível. D1/R2 permanecem intactos até cutover aprovado.
- O plano gratuito do Supabase é aceitável para desenvolvimento/homologação e avaliação inicial. Produção precisa reavaliar pausa por inatividade, ausência de backup automático, capacidade e suporte.
- A empresa possui domínio próprio; domínio exato, DNS e subdomínios continuam `[VALIDAR]`.
- A futura navegação do CRM usará sidebar compacta com itens por permissão e identidade Limpax.
- Google Login é prioritário após a migração; Calendar começa CRM → Google; Drive recebe cópias; Sheets apoia importação; Maps/Routes e Gmail entram por fases.
- Life360 é o processo atual conhecido para frota. Rastreamento próprio será planejado com finalidade, consentimento, retenção e segurança.

## Bloqueios

- Ciclo arquivar/restaurar no navegador e validação visual do estado arquivado pendentes.
- Contraste e tempo de resposta possuem evidência local limitada; Core Web Vitals, imagens/gradientes, estados fora do viewport e cobertura cruzada de navegador ainda não têm evidência final.
- Backup/restauração local aprovado; upgrade e recuperação remotos ainda não ensaiados.
- Migrações e configuração remotas não verificadas.
- Dados oficiais, domínio exato, contas Google, política de retenção, planilhas, modelo contratual e emissor fiscal permanecem `[VALIDAR]`.

## Retomada

1. Leia `AGENTS.md`.
2. Leia `.icbai/PROJECT_STATE.json`.
3. Leia este arquivo.
4. Leia `docs/CURRENT_TASK.md`.
5. Confira `git status`; o último commit de código verificado antes desta atualização documental é `08cb5e4`.
6. Leia apenas o código da tarefa e preserve alterações alheias.

Arquivos-chave: `.icbai/artifacts/RELEASE_MATRIX.md`, `.icbai/artifacts/QUALITY_GATE_PROGRESS.md`, `docs/ROADMAP.md`, `docs/SUPABASE_MIGRATION_PLAN.md`, `db/schema.ts`, `drizzle/`, `lib/crm.ts`, `lib/crm-customers.ts`, `components/crm-workspace.tsx` e `components/customer-workspace.tsx`.
