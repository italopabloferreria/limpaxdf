# Escopo e permissões

Referência: decisões registradas em `00-RETOMADA.md`. Este documento descreve o produto futuro, não funcionalidades já entregues.

## Produto

Central de gestão da Limpax, conectando cliente, oportunidade, serviço, documento, compromisso e recebimento. Um cliente pode possuir vários contatos e locais, e contratar vários serviços ao longo do tempo. Separar identidade do cliente da oportunidade comercial e da execução.

## Módulos acordados

| Módulo | Entrega esperada |
| --- | --- |
| Acesso | Contas individuais, dois administradores e uma atendente, autorização no servidor |
| Clientes | Pessoas/empresas, contatos, locais, histórico, pesquisa e prevenção de duplicidades |
| Comercial | Funil visual, oportunidades, demanda, responsável, valor, tarefas, motivos de perda |
| Orçamentos | Itens, condições, validade, versões, aprovação registrada |
| Operação | Ordens de serviço, equipe, caminhão, agenda, acesso, fotos e conclusão |
| Documentos | Modelos fornecidos, dados automáticos, revisão, PDF e histórico de versões |
| Financeiro | Contas a receber, parcelas, vencimentos, baixas e pendências |
| Fiscal | Preparação de dados, integração a definir, autorização/rejeição e documentos fiscais |
| Migração | Excel/CSV com mapeamento, validação, prévia, duplicidades e relatório |
| Gestão | Indicadores, permissões, importações, integrações e auditoria |

## Papéis

Confirmado: a atendente opera o atendimento; o dono e o técnico são administradores, cada um com login próprio. A matriz abaixo é **proposta inicial**, não uma regra já confirmada campo a campo.

| Ação | Atendimento | Dono / admin | Técnico / admin |
| --- | --- | --- | --- |
| Consultar e editar clientes/demandas | Sim | Sim | Sim |
| Operar funil, agenda, tarefas e OS | Sim | Sim | Sim |
| Preparar orçamento e gerar documento com modelo aprovado | Sim | Sim | Sim |
| Consultar situação de pagamento por atendimento | Sim | Sim | Sim |
| Alterar condição ou valor já aprovado | Não, solicitar aprovação | Sim | Sim |
| Registrar/estornar recebimento | [VALIDAR delegação] | Sim | Sim |
| Ver indicadores financeiros globais | Não por padrão | Sim | Sim |
| Importar/exportar base completa | Não por padrão | Sim | Sim |
| Gerenciar usuários/permissões | Não | Sim | Sim |
| Gerenciar modelos, integrações e parâmetros fiscais | Não | Sim | Sim |
| Exclusão definitiva/expurgo | Não | Fluxo administrativo controlado | Fluxo administrativo controlado |

O painel do dono prioriza negócio e resultados; o do técnico prioriza administração e integrações. Ambos continuam administradores. Não criar uma restrição exclusiva ao dono que impeça o técnico de administrar sem confirmação dessa intenção.

## Requisitos de acesso

- Autorizar cada rota, leitura, anexo e mutação no servidor. Esconder botões não é controle de acesso.
- Convite, ativação e revogação de contas; nenhuma senha compartilhada.
- Registrar autor e momento das ações relevantes, sem expor segredos nos logs.
- Revisar como o site público e a área interna coexistem antes de alterar a audiência do Sites.
- Login atual ChatGPT pode ser reaproveitado; login próprio por e-mail/senha ou outro provedor é decisão arquitetural pendente, não promessa entregue.
- Confirmar os e-mails do dono e da atendente antes de autorizar pessoas. Não enviar convites sem autorização explícita.

## Limites do escopo

Não estão automaticamente incluídos: folha de pagamento, estoque completo, contabilidade geral, conciliação bancária automática, rastreamento GPS, chat sincronizado, bot WhatsApp ou disparos em massa. Assinatura eletrônica, cobrança por gateway e calendário externo são extensões a decidir, não pré-requisitos para operar o núcleo.

## Fatos da marca

Limpax, DF, desde 2005, três caminhões. LXP/01–03 são identificadores editoriais. Logo original fornecida e lettering 13_Misa confirmado pelo usuário. Consultar `../01-brand-source-of-truth.md`. Não inventar capacidade técnica, licença, cobertura, SLA ou preço.
