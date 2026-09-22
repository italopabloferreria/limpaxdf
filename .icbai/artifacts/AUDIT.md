# Auditoria do projeto existente
Data: 2026-09-16. Escopo: código próprio, rotas, modelos/migrações, configuração, testes, documentação e interfaces existentes. Revisão estática e testes locais; não pentest, homologação fiscal ou certificação WCAG. Dependências vendorizadas não receberam auditoria linha a linha.

## Baseline
Pasta: C:/Users/italo/Programação/Limpax.
HEAD observado: 98c0bbf3590536b9b078f5ae0611302ae5fd8393.
Há modificações e arquivos novos não commitados do Antigravity; preservados.
Publicação conhecida: versão 3, privada, Limpax Fluindo. O CRM novo local não está comprovado em produção. A migração 0003 existe localmente; não presumir aplicação remota.
Esta rodada altera documentação ICB-AI, não código de aplicação nem dados.

## Tecnologias e estrutura
React 19.2.6, TypeScript 5.9.3, Next API 16.3.4, Vinext 1.0.0-beta.5, Vite 8.0.13; Cloudflare Workers, D1/SQLite, Drizzle 0.45.2 e R2.
app/: páginas e handlers; components/: experiência e workspaces; lib/: validação, auth, dados, intake, integração e datas; db/schema.ts e drizzle/: modelo/migrações; tests/business.test.ts: testes sintéticos; scripts/: runtime/build/testes; public/: assets; docs/: estratégia e operação.
Radix/shadcn e bibliotecas disponíveis não significam funcionalidades de negócio implementadas.
Configuração: .env.example, lib/config.ts, wrangler e .openai/hosting.json. Não copiar segredos para documentação.
Autenticação: identidade ChatGPT entregue pelo hosting; não há login independente próprio com senha ou convite implementado. Cabeçalhos de identidade só são confiáveis atrás da infraestrutura que os autentica.

## Fluxos e integrações
Visitante → Check validado → D1 (lead + outbox atômicos) → anexos privados R2 → CRM.
Webhook externo HTTPS configurável, bearer, idempotência, timeout e retries; conector existente não comprova destino real operante. Agendamento de dispatch/manutenção não comprovado.
Equipe → SSR CRM → APIs com auth/origem → registros/histórico/tarefas.
Clientes → contatos/locais → vínculos lead-cliente → log de auditoria; interface ainda não fecha todo o percurso.
Analytics próprios com consentimento opcional e eventos limitados; sem painel completo de gestão.
WhatsApp desejado via wa.me; CRM ainda sem fluxo completo de mensagem. Fiscal, contratos, importação e agenda não têm conectores/módulos completos.

## Modelo efetivo
Tabelas: leads, outbox, attachments, rate_limits, events, service_records, lead_activities, crm_tasks, customers, customer_contacts, service_locations, lead_customer_links, crm_user_profiles, crm_audit_log.
Clientes têm contatos/locais e vínculos com leads; profiles persistem papel/ativo; auditoria registra ações de cadastros.
Migrações 0000–0002 históricas; 0003 local acrescenta cadastros/perfis. Preservar migrações já aplicadas; evoluir por migrações novas.
service_records é estrutura antecipada, não módulo operacional entregue. Retenção/erase existentes focam leads, sem ciclo completo para cadastros e auditoria novos.

## Classificação
| Categoria | Evidência/estado |
|---|---|
| Implementado com evidência funcional local | Validação Check, idempotência intake, atomicidade lead/outbox, rate limit, assinatura de arquivos, retries, paginação, busca de clientes, CPF/CNPJ e vínculo de dados: 16 testes aprovados |
| Implementado anteriormente/publicação conhecida | Site, hero/Flow Line, páginas de serviços, Check, consentimento, CRM inicial, notas/tarefas/anexos; QA anterior não cobre todos os incrementos atuais |
| Implementado mas incompleto | Cadastros cliente/contato/local; APIs de usuários/perfis; vínculo lead-cliente sem UI de criação; auth divergente entre SSR/API; indicadores básicos; timezone; arquivamento/auditoria |
| Decidido/documentado, não implementado | Importador Excel/CSV com reconciliação; funil/comercial completo; propostas; modelos contratuais DOCX/PDF; agenda/OS; financeiro; painel admin completo; conexão fiscal |
| Legado/compatibilidade a revisar | /api/crm/status altera status sem o mesmo histórico do fluxo novo; manter até mapear consumidores |
| Exemplos/scaffolding, não lixo comprovado | examples/d1, components/ui, vendor e service_records. Não remover automaticamente |
| Problemas reais | Divergência de auth, exclusões permissivas, proteção incompleta do último admin, navegação ignorando selected, riscos de resposta assíncrona, lacunas de testes e lifecycle |
| Futuro | Recorrência, crescimento, automações ampliadas; não confundir com aceite do lote atual |

## Achados priorizados
### A01 — P1: autorização SSR divergente e fallback permissivo
app/crm/page.tsx:8 e app/crm/clientes/page.tsx:8 usam crmRoleFor por ambiente, antes de carregar dados. lib/crm.ts:requireCrmUser usa profiles e active.
Uma conta desativada no banco mas presente no ambiente pode receber dados renderizados; usuário apenas no banco pode passar API e ser negado na página.
Erros na consulta a profiles são engolidos e permitem fallback ao ambiente, tornando revogação dependente da saúde da consulta.
Correção: política única antes de carregar dados; falhar fechado em erro de banco/perfil inválido; bootstrap por ambiente somente sob regra explícita para ausência de perfil. Testar SSR e API com ativo/inativo/papel alterado/DB indisponível.

### A02 — P1: exclusão definitiva disponível à atendente
app/api/crm/customers/[id]/contacts/[contactId]/route.ts:65 e locations/[locationId]/route.ts:75 chamam requireCrmMutation, sem exigir admin.
DELETE remove definitivamente apesar da matriz documentada restringir ações irreversíveis. Relacionamentos podem perder referências por SET NULL.
Correção: alinhar autorização e lifecycle ao escopo aprovado; verificar 403 e ausência de mutação para atendente.

### A03 — P1: último administrador não protegido globalmente
app/api/crm/users/[email]/route.ts protege especialmente a alteração do próprio ator; contagem e atualização são separadas. Demissão/rebaixamento de outro perfil e concorrência precisam invariante transacional, inclusive admins ainda definidos no ambiente.
Não existe UI administrativa completa nem provisionamento real dos dois administradores.

### A04 — P2: vínculos têm API, mas jornada incompleta
POST/DELETE de vínculo e linkedLeads existem. Falta seletor de cliente no atendimento.
components/customer-workspace.tsx:575 navega para /crm?selected=id, mas destino não consome selected; abre outro atendimento. Testar também lead fora da primeira página.

### A05 — P2: concorrência e estado de listagem
components/crm-workspace.tsx mantém selectedRef sem utilizar no fluxo correspondente. Resposta de PATCH pode atualizar detalhe após usuário trocar seleção. Filtros/totais precisam reconciliação após mutação de status.
Reprodução automatizada: atrasar resposta A, selecionar B, completar A; B deve permanecer íntegro e listagem coerente.

### A06 — P2: ciclo de vida e separação revisão/live incompletos
maintenance/erase não abrangem todo cadastro independente e crm_audit_log. Clientes não carregam origem review/live equivalente ao lead. Definir arquivamento, expurgo, referências e exportação sem inventar retenção legal; dados reais permanecem bloqueados até validação.

### A07 — P2: cobertura e operação insuficientes
Testes de papéis cobrem mapeamento simples; não provam autorização real dos handlers/SSR, revogação, último admin, nem UI autenticada.
Sem evidência de backup restaurado, scheduler, alertas, QA mobile/teclado do novo CRM, performance ou migração remota 0003.
README/runbook precisam refletir todas as migrações e pasta canônica.

### A08 — P2: consistência em caminhos secundários
Endpoint legado status não registra updated_at/histórico de forma equivalente. Tarefas não têm idempotência de retry. Datas com offset fixo -03:00 não bastam para histórico com DST. validateTaxId normaliza letras para vazio; entradas inválidas podem parecer ausência de documento.
Limites fixos de histórico/tarefas e métricas da página atual não equivalem a relatórios completos.

## Segurança existente que deve ser preservada
Validação Zod, consultas parametrizadas, origem nas mutações de sessão, limites de body/rate, attachments privados com token expirá vel e assinatura, bearer administrativo, idempotência intake, erros genéricos.
D1 não usa RLS Postgres; autorização é responsabilidade do servidor. Escopo é uma empresa, com registros compartilhados pela equipe; não inferir isolamento multi-tenant inexistente.

### Verificação adicional da auditoria
npm run lint: FAIL, 72 erros e 3063 warnings. O comando inclui .sites-runtime/business.test.mjs gerado; há também erros próprios (tipagem any, prefer-const, navegação e hooks). Definir exclusões de artefatos e tratar erros reais; não alterar regras em massa para produzir PASS artificial.
Token de integração concentra poderes de export/status/erase/dispatch/manutenção: documentar privilégio e rotação. R2/D1 exigem recuperação de falhas parciais. Remoção de EXIF só no cliente não garante sanitização de upload direto.
CSP com unsafe-inline é dívida a medir, não prova isolada de exploração. Não realizar substituição de framework para resolvê-la.

## Documentação e operação
Alegações de conclusão no histórico Antigravity foram confrontadas com código; esta classificação prevalece.
NOINDEX/robots bloqueados são intencionais no modo privado/revisão.
Dados empresariais não confirmados permanecem [VALIDAR]; não ativar intake live nem SEO público por aparência de “fim do beta”.
Skill api-security-review disponível, mas plays/api-security-review.md referenciado está ausente; revisão manual usa checklist do SKILL.md. Nenhum scanner inexistente foi alegado como executado.
