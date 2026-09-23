# Plano executavel Supabase

Estado: **preparacao; nenhuma conta conectada**.

## Objetivo da fase

Preparar uma homologacao Supabase reversivel, sem tocar em producao, sem apagar D1/R2 e sem importar dados reais.

## Sequencia

1. Criar projeto Supabase pertencente a empresa `[VALIDAR]`.
2. Definir ambiente: `supabase-dev`, `supabase-staging` ou equivalente `[VALIDAR]`.
3. Configurar Google Auth no Supabase e no Google Cloud:
   - origem local `http://localhost:5173`;
   - origem futura do dominio proprio `[VALIDAR]`;
   - callback Supabase do projeto real `[VALIDAR]`.
4. Criar schema em banco vazio usando migracao real gerada por CLI ou ferramenta aprovada.
5. Rodar advisors/security checks do Supabase.
6. Criar buckets privados previstos.
7. Criar politicas de Storage para admin/attendant.
8. Criar perfis internos:
   - dois admins: dono + tecnico;
   - uma atendente.
9. Executar dry run com dados sinteticos:
   - clientes;
   - contatos;
   - locais;
   - leads;
   - tarefas;
   - notas;
   - anexos ficticios.
10. Comparar contagens, vinculos e hashes entre origem sintetica e Supabase.
11. Testar exportacao manual de arquivo.
12. Testar backup completo e restauracao em ambiente limpo.
13. Implementar adapter da aplicacao em branch, mantendo D1 como default ate cutover aprovado.
14. Validar login Google, RLS e negacoes:
   - admin acessa;
   - atendente acessa apenas escopo permitido;
   - usuario autenticado sem perfil nao acessa.
15. Registrar evidencias antes de qualquer cutover.

## Comandos somente quando houver projeto real

Nao executar agora. Descobrir comandos pela CLI instalada no momento:

```powershell
supabase --help
supabase db --help
supabase migration --help
```

Se a CLI nao estiver instalada, decidir instalacao em tarefa propria e versionar lockfile quando houver dependencias npm.

## Aceite de homologacao

- Schema criado em ambiente Supabase nao produtivo.
- RLS habilitada em todas as tabelas do CRM.
- Politicas usam `TO authenticated` com verificacao de perfil interno.
- Nenhuma politica depende de `user_metadata`.
- `service_role` nao aparece no frontend nem em arquivo versionado.
- Buckets privados aceitam upload/download somente por perfil permitido.
- Exportacao manual gera arquivo sem formulas perigosas.
- Backup externo e restauracao passam com dados sinteticos.
- Cutover permanece bloqueado ate autorizacao explicita.

## Proxima decisao humana

Antes de implementar conexao real, decidir:

- nome do projeto Supabase;
- regiao;
- plano Free/Pro inicial;
- quem controla a organizacao;
- quais emails serao admin/atendente;
- destino externo de backup;
- se o dominio proprio ja apontara para esta homologacao.
## Homologacao local implementada em 2026-09-23

Projeto alvo vazio: `Limpax Brasil`, ref `lkamarbpjqlibxlmcico`, região `South America (São Paulo) / sa-east-1`.

Foi criada a primeira integração de código sem substituir o banco atual:

- `lib/supabase.ts`: leitura segura de configuração, inferência de project ref, cliente público Supabase e health-check Auth.
- `app/api/supabase/health/route.ts`: endpoint interno de diagnóstico que retorna status, project ref, região, host e disponibilidade REST sem expor chave.
- `scripts/check-supabase-local.mjs`: verificação local de `.env.local`, região São Paulo e ausência de `service_role`.
- `npm run qa:supabase-local`: script de QA local.

O D1/Cloudflare continua sendo o backend padrão do CRM. O Supabase ainda não recebe dados do site, não tem schema aplicado e não deve ser considerado produção.

Nota de chave Supabase atual: sb_publishable_* deve ser enviada no header pikey. Não usar Authorization: Bearer sb_publishable_*; o Bearer fica reservado para JWT de usuário autenticado.

Health-check de homologação usa /auth/v1/health, que valida conectividade do projeto sem depender de tabelas. /rest/v1/ pode retornar 401 no projeto vazio sem chave secreta/admin e não deve ser usado como critério de falha nesta etapa.
