# LIMPAX — planejamento refeito para verificação

Data: 24/09/2026. Pedido: refazer o planejamento do zero para verificar a sequência. Este documento é uma proposta de organização; não autoriza implementação, mudança remota ou troca de backend. Preserva a tarefa S01-SUPABASE-PREP-01 e o G13 aberto.

## Objetivo e primeira entrega utilizável

Organizar a operação Limpax desde a entrada de um atendimento até cliente, proposta, execução e recebimento, com histórico e acesso controlado. Preservar o site, a identidade “Tudo precisa continuar fluindo” e os fluxos existentes. Dados empresariais e integrações não confirmados permanecem [VALIDAR].

A primeira entrega operacional deve permitir que usuários autorizados entrem, consultem atendimentos e clientes, registrem notas e tarefas, mantenham vínculos e histórico e recuperem os dados de um backup testado. Comercial completo, frota, financeiro e fiscal não são requisitos para concluir essa primeira entrega.

## Evidência disponível e limites

- Pasta canônica: C:/Users/italo/Programação/Limpax. A cópia alternativa permanece preservada; sua comparação de commits é evidência de 23/09, não uma nova comparação nesta revisão.
- Código consultado: lib/crm.ts, lib/crm-data.ts, lib/supabase-session.ts, app/api/crm/workspace/route.ts, componentes e rotas CRM, script de homologação e baseline SQL.
- O acesso atual usa getChatGPTUser e perfis D1. O workspace exige esse acesso antes de receber um JWT Supabase independente.
- O componente CrmWorkspace não fornece uma sessão Supabase nas requisições examinadas. Não foi encontrada integração signInWithOAuth nas áreas app/lib/components pesquisadas.
- O adapter Supabase cobre a listagem do workspace; detalhes, tarefas, notas e clientes examinados continuam em D1. A flag de leitura não representa migração completa do CRM.
- Projeto, baseline, RLS e grants remotos têm evidência histórica registrada. Nenhuma consulta remota foi executada nesta revisão.
- Testes aprovados na sessão anterior permanecem evidência anterior. Esta revisão é documental e por inspeção de código, não uma nova homologação funcional.

## Correções necessárias na sequência anterior

1. **Origem da sessão antes do teste autenticado.** O token manual serve a um diagnóstico, mas depende de usuário, login e perfil previamente configurados. A próxima tarefa precisa definir e preparar esse caminho, em vez de depender indefinidamente de um token que o usuário não sabe obter. Sessão do Dashboard não equivale a sessão do CRM.
2. **Auth antes da validação de RLS e do cutover.** O roadmap posiciona Google Login depois da migração. Sua configuração de homologação e os perfis devem preceder a validação autenticada; a ativação em produção continua posterior ao aceite.
3. **Backup antes de dados reais.** O roadmap coloca importador antes de backup externo. O importador pode ser desenvolvido com dados sintéticos antes; importação real e troca operacional precisam de restauração e rollback comprovados.
4. **Gates por ambiente.** Validar a base D1 existente e homologar Supabase são frentes distintas. G13 continua aberto, mas a preparação isolada de Supabase não precisa esperar uma publicação D1. A aprovação final deve identificar explicitamente a versão e o backend testados.
5. **Smoke não equivale a autorização validada.** O script atual lê um perfil com limit(1), sem vinculá-lo explicitamente ao usuário retornado por getUser. Um admin pode enxergar outros perfis pela policy. Além disso, a leitura de leads não restringe um lote sintético; limit(1) não garante ausência de dados reais. Ambos precisam ser corrigidos antes de usar o script como evidência de homologação.
6. **Compatibilidade além dos mocks.** Planejar testes reais de busca em payload jsonb, ordenação equivalente a COALESCE do D1 e totais acima do limite de resposta da API. Os mocks atuais não demonstram esses comportamentos do banco remoto.
7. **Documentação histórica.** SUPABASE_MIGRATION_PLAN.md ainda diz “nenhuma migração executada”, enquanto o plano de execução registra a baseline aplicada. Distinguir schema aplicado de dados operacionais ainda não migrados. Não repetir criação de projeto nem reaplicar baseline.

## Sequência proposta e critérios de saída

| Etapa | Entrega | Critério para avançar |
| --- | --- | --- |
| 0. Consolidar estado | Inventário de código, ambientes, dados e responsáveis; separar registro histórico de verificação atual | Pasta oficial e ambiente de cada teste identificados; pendências objetivas |
| 1. Estabelecer identidade em homologação | Especificação de login Google, callback, sessão servidor/navegador e vínculo ao perfil administrativo | Caminho completo para obter sessão sem copiar JWT manualmente; contas e permissões definidas |
| 2. Validar autorização | Usuários sintéticos admin, atendente, sem perfil e desativado; fixtures identificadas; testes positivos e negativos | Perfil ligado à identidade verificada; acessos indevidos negados; revogação e último admin testados |
| 3. Homologar leitura | Listagem, detalhe, busca, filtros e paginação com origem de dados consistente | Resultados equivalentes ao D1 sintético, inclusive ordenação, totais e erros; nenhuma mistura acidental de bases |
| 4. Homologar escrita e arquivos | Clientes, contatos, locais, vínculos, tarefas, notas, histórico, anexos e papéis | Atomicidade, idempotência, auditoria, pertencimento e Storage privado comprovados |
| 5. Ensaiar migração e recuperação | Cópia sintética reconciliada; backup externo; restauração em ambiente limpo | Contagens, chaves, vínculos e arquivos conferidos; retorno ensaiado, incluindo destino das escritas posteriores à troca |
| 6. Aprovar primeira entrega operacional | QA ponta a ponta no ambiente alvo, acessibilidade, configuração, desempenho e operação | Gate de release da versão alvo aprovado; aceite específico para publicação/cutover; monitoramento pós-publicação |
| 7. Expandir por fluxo de negócio | Importador, comercial, documentos, operação e módulos seguintes | Cada módulo tem regras confirmadas, testes e aceite próprio |

Na etapa 3, usar ambiente de homologação controlado ou uma experiência explicitamente apenas de leitura. Não ligar globalmente uma listagem Supabase enquanto detalhes e alterações continuam consultando outra base sem um desenho consistente.

O retorno por flag é suficiente apenas enquanto não houver escritas exclusivas no Supabase. Depois disso, o plano deve definir congelamento, reconciliação e recuperação dessas escritas; retornar ao D1 sem essa etapa pode perder trabalho.

## Próxima tarefa proposta, ainda sem implementação

Especificar a autenticação de homologação ponta a ponta: entrada, callback, emissão/renovação/expiração da sessão, logout, validação no servidor, vínculo ao perfil e transição da identidade atual. Definir bootstrap administrativo e matriz de acesso. Incluir correção do verificador para consultar o próprio perfil e somente fixtures autorizadas, com critérios de teste.

Saída: desenho revisável com arquivos afetados, casos de aceite e lista exata de configuração externa. Não requer obter um JWT previamente. Configurar Google, criar/convidar usuários ou gravar perfis remotamente exige autorização específica conforme AGENTS.md.

## Roadmap posterior

1. Navegação por permissão e importador com preview, deduplicação, lotes idempotentes e reversão.
2. Comercial e propostas; depois contratos/documentos versionados.
3. Agenda, ordens de serviço, equipes e alocação de veículos confirmados.
4. Integrações Google por necessidade real; CRM como fonte operacional e Drive como cópia.
5. Frota/rastreamento após descoberta, consentimento e escolha de fonte.
6. Financeiro com regras de recebimento, parcelas e estornos confirmadas.
7. Fiscal após definição de emissor, município, contador e homologação.

Backup e monitoramento começam antes da operação real e acompanham todas as fases. Não ficam condicionados ao término do roadmap. Prazos e custos dependem da descoberta; não foram estimados nesta revisão.

## Dependências externas

- Contas administrativas e de atendimento; quem controla Google Cloud e Supabase [VALIDAR].
- Domínio/callbacks e separação de homologação/produção [VALIDAR].
- Destino, retenção e responsável pelo backup externo [VALIDAR].
- Amostras anonimizadas, regras comerciais, documentos e exigências fiscais nas fases correspondentes [VALIDAR].

Conclusão: a direção do produto e o reaproveitamento do código são adequados. A sequência precisa explicitar identidade antes da homologação autenticada, backup antes de dados reais e consistência de leitura/escrita antes da troca de backend. O JWT ausente bloqueia o script remoto atual, não todo o planejamento ou desenvolvimento local.
