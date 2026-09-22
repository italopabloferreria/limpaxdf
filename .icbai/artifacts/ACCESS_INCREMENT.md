# Incremento 1 — acesso coerente
Escopo autorizado: A01 e restrição de exclusões A02. A03 e jornadas seguintes permanecem backlog. Sem schema novo, dados reais, mudança de audiência ou release de produção neste incremento.

Revisão G11: G8/G9/G10/G10C/G10D possuem definições nos documentos correspondentes; demais gates pre-code herdados com evidência em GATE_EVIDENCE. O plano de implementação existente contém ordem, testes e rollback. Liberação limitada a este incremento; não constitui passe global de lançamento.

Ordem: reproduzir revogação/bypass e exclusões em testes → guard único SSR/API → DELETE admin → testes + TypeScript + build + lint focalizado → atualização de estado.
Aceites: anônimo 401/login, desativado 403/gate, DB-only admitido, rebaixado sem poderes admin, DB ausente/falha sem PII, bootstrap apenas em ausência confirmada, atendente não exclui contato/local, admin continua fluxo, origem inválida negada.
Rollback: diff dos arquivos do incremento, preservando alterações prévias do Antigravity. Banco sem 0003 fica indisponível de forma segura; nunca reintroduzir fallback por erro para “consertar” deploy. Implantação aguarda G13 e verificação da migração existente.
