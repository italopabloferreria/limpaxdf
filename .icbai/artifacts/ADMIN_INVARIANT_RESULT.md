# Resultado A03 — último administrador
16/09/2026. Implementado e verificado localmente; sem deploy.

O PATCH de usuário agora remove papel/atividade administrativa somente quando outra conta persistida continua admin e ativa. A verificação e a alteração ocorrem no mesmo UPDATE condicional dentro do batch D1. A auditoria usa o resultado da atualização e não registra tentativas rejeitadas.

Casos novos observados falhando antes da correção: admin de bootstrap desativava o único admin persistido; dois admins podiam se desativar simultaneamente, deixando zero. Depois: ambos passam. Em concorrência, respostas 200/409, um admin ativo e um evento de auditoria.

Política: admins de ambiente sem profile podem fazer bootstrap, mas não contam para liberar a remoção do último admin persistido. É a opção conservadora e coerente com profiles como fonte de revogação.

Evidência consolidada: acesso 14/14; negócio 16/16; TypeScript, lint do A03 e build PASS. Sem schema novo.

Próximo: interface de vínculo lead→cliente e lifecycle dos novos cadastros.
