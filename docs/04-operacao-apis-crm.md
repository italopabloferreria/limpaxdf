# Operação, APIs e CRM

## Estado e modelo

Revisão privada por padrão; persistência e uploads funcionais. CRM de destino, identidade, contatos, base legal e retenção [VALIDAR]. Protocolo significa registro no banco, não agendamento, orçamento, entrega ao CRM ou prazo.

Schema e migrações versionados no projeto. Leads guardam UUID, sequência de exportação, chave idempotente, hash/payload, modo/status, data, versão de aviso, opção marketing e token de upload com hash/expiração. Outbox guarda tentativas, lease, próxima tentativa e confirmação. Attachments guardam chaves R2 privadas. Rate_limits guarda hash/expiração sem IP em texto. Events guarda contagens por dia. Service_records prepara histórico futuro, sem contrato ou periodicidade ativa.

Fluxo: navegador → origem/limites/validação → transação lead + outbox → protocolo → anexos opcionais → exportação ou dispatcher autenticado → CRM. Registros review nunca entram na exportação/dispatcher.

## Contratos

JSON sem cache; erros `{error:string}`. Escritas públicas exigem Origin exato. APIs CRM exigem Authorization Bearer secreto.

| Endpoint | Comportamento |
| --- | --- |
| POST /api/check | JSON até 12 KB e Idempotency-Key UUID; 201 com id/mode/uploadToken. Retry idêntico: 200 mesmo ID, sem novo token. Conteúdo divergente: 409. |
| POST /api/uploads | Bytes JPEG/PNG/WebP até 4 MB; X-Lead-Id e X-Upload-Token; token 15 minutos, até 3 fotos. 201 com id. |
| GET /api/health | Verifica banco e modo, sem dados pessoais/segredos. |
| POST /api/events | Somente eventos permitidos, com consentimento e habilitação no servidor. |
| GET /api/crm/export?after=0 | Até 50 registros live; records/nextCursor. Consumidor persiste cursor. |
| POST /api/crm/dispatch | Até 10 entregas elegíveis no webhook autorizado. |
| POST /api/crm/status | JSON id/status; estados novo, em_contato, qualificado, orcamento, agendado, em_execucao, concluido, recorrencia, cancelado. |
| GET /api/crm/attachments | lead=UUID lista; id=UUID baixa anexo privado. |
| POST /api/crm/erase | id e confirm=erase; operador verifica autoridade antes de excluir objetos/dados. |
| POST /api/crm/maintenance | confirm=apply-retention; exclui até 50 registros vencidos e limpa limites/agregados; repetir enquanto hasMore. |

Payload Check: problem (fossa/gordura/entupimento/esgoto/odor/pragas/outro), location, property (residencia/condominio/empresa), urgency (agora/planejar/nao-sei), access, region, cep opcional de 8 dígitos, name, phone de 10–11 dígitos, email/notes opcionais, marketing boolean, privacy true, reviewAcknowledged boolean, website vazio. Campos extras rejeitados. Limites detalhados em lib/validation.ts.

## CRM operacional

`/crm` é a central de atendimento protegida por login ChatGPT e pela lista `CRM_ADMIN_EMAILS`. Ela não usa token administrativo no navegador. A equipe encontra até 150 registros recentes, filtra por status, abre o contexto enviado pelo cliente e registra responsável, próxima ação, status, notas internas e tarefas. Cada alteração gera atividade com a conta que a realizou. Fotos continuam privadas e só ficam disponíveis para usuários CRM autorizados.

O fluxo previsto é: novo → em contato → qualificado → orçamento → agendado → em execução → concluído/recorrência, com cancelado quando necessário. Esses estados organizam o trabalho; não geram contrato, orçamento ou agendamento por conta própria. A equipe define manualmente os valores, condições e disponibilidade depois da avaliação real.

Para ativar a central, definir `CRM_ADMIN_EMAILS` com e-mails separados por vírgula. Não compartilhar conta, token ou URL de anexo. A autorização é conferida no servidor em todas as leituras e alterações do CRM.

## CRM externo e manutenção

Webhook recebe event=lead.created, id, createdAt, privacyVersion e data. Bearer próprio e Idempotency-Key=id. Destino deve fazer upsert por UUID e responder 2xx após persistir. Timeout 8 segundos, sem redirects, backoff até 1 hora, máximo 8 tentativas. Falha final requer investigação e reprocessamento autorizado. Exportação permite recuperação independente.

Agendador externo [VALIDAR] deve chamar dispatcher periodicamente e maintenance diariamente; nenhum agendador foi provisionado. Monitorar fila pending/failed, idade de registros, falhas Worker, banco e retenção. Configurar backups D1/R2 e ensaiar recuperação antes da operação comercial. Não logar payloads ou tokens.

## Ambiente

| Variável | Uso |
| --- | --- |
| CAPTURE_MODE | review padrão, disabled ou live; live exige identidade, contato, retenção válida e segredo rate limit. |
| SITE_ORIGIN | Origem HTTPS exata; atualizar para domínio próprio. |
| LEGAL_NAME / PRIVACY_CONTACT | Identidade e contato real do controlador [VALIDAR]. |
| RETENTION_DAYS | Inteiro 1–3650; prazo efetivo depende de aprovação. |
| RATE_LIMIT_SECRET | Aleatório >=32 caracteres. |
| CRM_API_TOKEN | Aleatório >=32 caracteres, somente integração administrativa. |
| CRM_WEBHOOK_URL / CRM_WEBHOOK_SECRET | Destino HTTPS autorizado e segredo independente. |
| CRM_ADMIN_EMAILS | Lista de e-mails da equipe autorizada a usar `/crm`, separados por vírgula. |
| ANALYTICS_ENABLED | false padrão; true ainda exige escolha do visitante. |
| DB / BUCKET | Bindings gerenciados D1/R2. |

## Segurança, privacidade e limites

Queries parametrizadas, transação lead/outbox, autenticação administrativa fechada sem configuração, validação estrita, checagem Origin, rate limit persistido, streams limitados, arquivos privados e tokens temporários com hash. Fotos são reencodadas pelo navegador para retirar metadados; servidor verifica assinatura/tamanho, não executa antivírus. Download força anexo e nosniff.

CSP permite inline por compatibilidade do framework. Token administrativo compartilhado não substitui gestão granular de usuários. Não há trilha de auditoria administrativa ou agendador provisionado. Resposta de upload perdida pode exigir tratamento de anexo duplicado. Após resultado incerto de registro, repetir payload original e chave; não trocar a chave silenciosamente.

Preferências analíticas expiram em até 180 dias e podem ser revogadas em /cookies. Marketing é opcional e separado da ciência do aviso. Validar controlador, base legal e retenção antes do uso real. Referência: https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf

SEO: sitemap e metadata por rota; sem avaliações/endereço fictícios. Robots/noindex bloqueiam indexação. Após validação comercial, revisar app/robots.ts, app/layout.tsx, canonical e domínio. IDs LXP/01–03 são editoriais; não atribuir características técnicas às imagens IA.
