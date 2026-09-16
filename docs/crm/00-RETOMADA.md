# CRM Limpax — ponto de entrada

Atualizado em 16/09/2026. Objetivo deste pacote: preservar decisões, reduzir releituras e orientar uma implementação grande em entregas verificáveis.

## Pedido vigente

Evoluir o CRM para gestão profissional de atendimento, vendas, operação, documentos, agenda e recebimentos, migrando o histórico hoje em Excel/CSV. Nesta etapa o usuário pediu **somente documentação em Markdown**. Não interpretar este pacote como autorização para alterar acessos externos, contratar serviços, enviar mensagens, emitir notas ou importar dados reais automaticamente.

## Decisões confirmadas

- Uma pessoa faz o atendimento geral.
- Dois administradores: o usuário, responsável técnico, e o dono da empresa; contas individuais.
- Painel administrativo com funções restritas e métricas.
- Importação de Excel e CSV: as planilhas contêm contatos, serviços, valores, pagamentos e agendamentos.
- Contratos gerados a partir de modelo fornecido pelo usuário, preenchidos com dados da empresa e do cliente.
- WhatsApp por botão `wa.me`, sem consumo de API de mensagens.
- Agenda e acompanhamento de demandas em funil, com organização inspirada no Kommo.
- Interface mais completa, bonita e profissional, preservando a marca Limpax.
- Emissor fiscal atual desconhecido; o usuário acredita que seja um portal normal. Integração fiscal desejada, ainda dependente de descoberta.

## Leitura econômica por tarefa

1. Ler este arquivo e `05-PLANO-E-STATUS.md`.
2. Ler apenas o documento do módulo em execução e os arquivos de código envolvidos.
3. Consultar `01-ESCOPO-E-PERMISSOES.md` para decisões de produto; `02-DADOS-E-MIGRACAO.md` para banco/importações; `03-FLUXOS-E-INTERFACE.md` para experiência; `04-DOCUMENTOS-E-INTEGRACOES.md` para contratos, WhatsApp e fiscal.
4. Só buscar a conversa original quando houver uma lacuna real nestes documentos.
5. Ao concluir um lote, atualizar status, evidências, limitações e próximo passo no plano. Evitar repetir o histórico inteiro.

## Situação atual resumida

Existe site privado publicado e CRM inicial em `/crm`. Implementação: React/TypeScript, Vinext/Workers, D1/Drizzle e R2. Manifest: `.openai/hosting.json`; reutilizar seu `project_id`. Há Check persistente, anexos privados, APIs, fila inicial, status, notas e tarefas. Isso **não equivale ao escopo completo deste pacote**.

O CRM atual usa login ChatGPT com lista de e-mails autorizados. Não existe ainda o conjunto completo de papéis, clientes independentes, agenda operacional, propostas, contratos, financeiro, importador ou emissor fiscal. Não presumir que a conta do dono ou da atendente já tenha sido criada.

O site permanece privado e o Check em revisão. Não apagar `[VALIDAR]` nem ativar captação real apenas para retirar a aparência de beta.

## Convenções

- **Confirmado:** pedido ou informação explícita do usuário.
- **Proposta:** desenho recomendado para implementação, ajustável após conferir o processo real.
- **[VALIDAR]:** dado externo ou operacional ainda não confirmado.
- Planejado, implementado, testado e publicado são estados distintos.
- Nenhuma credencial, certificado, dado real de cliente ou planilha original deve entrar nesta documentação ou no Git.

## Próximo passo

Receber amostra anonimizada das planilhas, preservando colunas e formatos, e mapear o histórico antes de fechar o importador. A revisão técnica da base e o desenho dos papéis podem avançar independentemente disso quando a implementação for retomada.
