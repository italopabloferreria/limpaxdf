# Resultado do incremento A01/A02
16/09/2026 — concluído localmente. Pasta canônica C:/Users/italo/Programação/Limpax.

## Mudanças
- lib/crm.ts: consulta de profiles obrigatória; erro retorna 503, perfil inválido/inativo 403; perfil persistido sobrepõe ambiente; bootstrap somente após ausência confirmada. last_seen best effort.
- lib/crm-page-access.ts, páginas /crm e /crm/clientes: mesmo guard das APIs antes de carregar dados.
- components/crm-access-gate.tsx: login/negativa/indisponibilidade distintos, sem PII, com alvo de skip link.
- DELETE de contatos/locais: requireCrmAdmin; ações de exclusão visíveis apenas a admin no CustomerWorkspace.
- Sem dependências ou schema novos, sem reescrita da marca/arquitetura.

## Evidência
Nova suíte tests/crm-access.test.tsx executa páginas servidor, guard, consultas e handlers reais contra SQLite em memória (migrações 0000–0003); simula headers do hosting e renderização dos dois workspaces clientes. Não simula a função de autorização. Não equivale a teste E2E de browser.
Antes da correção: 8 falhas/4 passes; depois: 12/12 passes.
Casos: revogação de usuário presente em env, usuário só DB, rebaixamento, role/active inválidos, tabela ausente, DB ausente, anônimo sem consultas, bootstrap explícito, falha de last_seen, DELETE atendente negado sem mutação, DELETE admin auditado e origem inválida.
Regressões: node scripts/test.mjs 16/16.
TypeScript: node node_modules/typescript/bin/tsc --noEmit --incremental false PASS.
Build: npm run build PASS. Wrapper build-site.mjs não encontrou npm no ambiente; não alterado package/lockfile para contornar.
Lint auth/páginas/gate/testes novos: PASS. Dois handlers e CustomerWorkspace ainda têm 10 erros preexistentes (any, refs/effect e links); registrados, sem regras desativadas.
Não executado: QA autenticado browser/mobile, recuperação remota ou deploy.

## Próximo incremento
A03: invariante de último admin transacional, abrangendo alteração do próprio/de outro e concorrência, com regra de bootstrap coerente. Reutilizar SECURITY_MODEL e IMPLEMENTATION_PLAN; reabrir apenas decisões afetadas.
G13 continua FAIL pelos demais bloqueios. Versão remota conhecida 3 permanece inalterada.
