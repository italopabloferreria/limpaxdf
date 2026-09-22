# Modelo de segurança — G9
16/09/2026. Escopo imediato A01/A02; não equivale a homologação global.

Fronteiras: navegador não confiável → dispatcher Sites (identidade autenticada) → Worker (autorização) → D1/R2 privados. Headers OAI não podem ser aceitos diretamente fora do dispatcher em produção. Mocks exclusivamente nos testes/preview.

## Política única
1. Sem identidade: 401 nas APIs e convite de login na página.
2. Banco ausente/consulta profiles falha: 503; nenhuma leitura de clientes/leads.
3. Perfil existe: active deve ser 1 e role admin/attendant; outro valor ou inativo nega 403. Ambiente não sobrepõe perfil, inclusive rebaixamento.
4. Perfil ausente e consulta bem-sucedida: allowlist de ambiente mantém bootstrap legado; admin vence apenas quando não existe perfil. Sem allowlist nega 403.
5. last_seen é telemetria best effort após autorização; falha nessa gravação não muda permissão. Não cachear autorização entre requests.
6. Páginas e APIs chamam o mesmo guard antes de consultar PII; páginas exibem estado seguro sem detalhes técnicos.

Atendente: operações ordinárias documentadas. Administradores: gestão de usuários e exclusões definitivas. Origem validada antes de escritas autenticadas. UI escondida não substitui guard.
A03 implementado localmente: somente administradores persistidos ativos contam para liberar remoção de papel/atividade; UPDATE condicional e auditoria estão no mesmo batch. Admin de bootstrap não permite remover o último admin persistido. Concorrência de dois admins foi testada: uma alteração aceita, outra 409.

## Ameaças e mitigação/aceite
| Ameaça | Mitigação e verificação |
|---|---|
| Revogação ignorada/elevação via env | Perfil autoritativo; testes SSR/API de desativação, papel inválido e rebaixamento |
| Erro DB vira bypass | Falhar fechado; testar tabela ausente, consulta quebrada e DB ausente, sem leitura de dados |
| Ação administrativa por atendente | Guard admin nos DELETE; 403 sem alteração e testes positivos admin |
| CSRF | Manter requireOrigin; testar DELETE com origem diferente |
| IDOR | Validar cliente/contato/local e vínculo; empresa única compartilhada, não inventar isolamento por atendente |
| Último admin/concurrency | UPDATE condicional atômico e teste de alterações simultâneas; validar também no ambiente publicado antes do G13 |
| Exposição de segredos/PII | Segredos somente runtime, erros públicos genéricos, sem dados em logs/eventos |
| Integração excessivamente privilegiada | Token bearer atual documentado, rotação e escopo mínimo futuro; não reutilizar token no navegador |

Não adicionar novo OAuth/senha, não alterar audiência ou allowlists reais. Revogar por active=0, nunca removendo profile. Quando bootstrap for desativado futuramente, migrar explicitamente e validar recuperação do dono/técnico.
G9 planejamento satisfeito. A01–A03 têm evidência local de implementação; homologação no ambiente publicado continua no G13.
