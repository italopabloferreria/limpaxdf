# Plano de migração para Supabase

Estado: **planejado; nenhuma migração executada**. D1/R2 continuam sendo o backend atual.

## Alvo

- PostgreSQL para dados relacionais e transações;
- Supabase Auth com Google;
- perfis e papéis internos controlados pelo CRM;
- RLS por entidade/ação;
- Storage privado para fotos, planilhas, modelos, contratos e PDFs;
- Realtime apenas onde demonstrar necessidade;
- frontend React/TypeScript e domínio próprio preservados.

## Mapeamento inicial

| Atual | Alvo | Observação |
| --- | --- | --- |
| D1/SQLite | PostgreSQL | Converter tipos, constraints, índices e timestamps sem alterar significado. |
| `crm_user_profiles` + identidade Sites | `auth.users` + perfis internos | Usuário Google só entra se também estiver autorizado no CRM. |
| R2 privado | Storage privado | Buckets separados por finalidade; acesso por RLS/URL assinada curta. |
| APIs Worker | APIs existentes adaptadas ou chamadas Supabase controladas | Manter validação e regras de negócio; não expor `service_role`. |
| migrations 0000–0005 | migrations Supabase novas | Não traduzir cegamente nem apagar histórico D1. |
| outbox/idempotência/auditoria | tabelas/constraints Postgres | Preservar retries, histórico e invariantes. |

## Etapas reversíveis

1. Congelar e documentar o schema D1 real; exportar amostra sintética.
2. Criar projeto Supabase pertencente à empresa e separar dev/produção conforme o plano escolhido.
3. Criar schema Postgres, constraints, índices e RLS; testar com perfis admin/atendente/negado.
4. Criar buckets privados e políticas para upload/download/substituição/exclusão.
5. Implementar adapter de persistência atrás dos contratos existentes, mantendo D1 como caminho padrão.
6. Executar dry run D1→Supabase; comparar contagens, chaves, vínculos, hashes e arquivos.
7. Testar fluxos completos e restauração. Corrigir sem alterar o D1 de origem.
8. Planejar janela de cutover, export final, reconciliação e chave de retorno ao D1.
9. Só depois de aceite explícito, trocar produção; manter backup e rollback durante a janela definida.

## Segurança mínima

- RLS em toda tabela exposta; políticas de `SELECT`, `INSERT`, `UPDATE` e `DELETE` separadas.
- `USING` e `WITH CHECK` quando aplicáveis; `authenticated` sozinho não autoriza dados.
- Papéis em dados administrativos/app metadata controlados, nunca em `user_metadata` editável.
- Chave pública somente para operações previstas; segredo/`service_role` somente no servidor.
- Views com `security_invoker` ou fora do schema exposto; funções privilegiadas com escopo mínimo.
- Tokens Google criptografados e revogáveis; Drive/Calendar/Gmail com scopes mínimos.

## Plano gratuito

Em 22/09/2026, a página oficial informa: 500 MB de banco, 1 GB de arquivos, 5 GB de egress, OAuth social, 50.000 MAU e upload de até 50 MB. Também informa pausa após uma semana sem atividade, ausência de backups automáticos, logs curtos e ausência de SLA/suporte por e-mail.

Decisão: usar Free para desenvolvimento, homologação e validação inicial é aceitável. Antes de colocar a operação diária da empresa e documentos críticos, medir volume, atividade, necessidade de backup/restauração e tolerância a pausa. A decisão Free/Pro de produção permanece `[VALIDAR]`; domínio próprio do site não exige custom domain pago na API Supabase se o frontend usar o domínio da empresa.

Referência verificada: https://supabase.com/pricing. Limites podem mudar e devem ser conferidos novamente no início da implementação.

## Critérios antes do cutover

- schema e RLS revisados;
- testes de papéis e negações aprovados;
- uploads privados e exclusão verificados;
- export/reimport reproduzível e reconciliado;
- backup restaurado em ambiente limpo;
- latência e limites medidos;
- domínio/callbacks Google confirmados;
- plano de rollback ensaiado;
- autorização explícita do usuário para o cutover.
