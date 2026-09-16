# Documentos e integrações

## Contratos e modelos

Confirmado: usuário poderá fornecer modelo com identidade da empresa para preenchimento com dados do cliente. Proposta inicial: modelo DOCX preparado com variáveis, preservando cabeçalho, rodapé, tabelas e logo; saída DOCX/PDF. PDF comum pode ser referência/anexo, mas não assumir preenchimento arbitrário sem adaptação.

Campos exemplares: `{{empresa.razao_social}}`, `{{empresa.cnpj}}`, `{{cliente.nome}}`, `{{cliente.documento}}`, `{{servico.endereco}}`, `{{orcamento.valor_total}}`. Mapear variáveis conhecidas e campos obrigatórios; não deixar marcadores crus em documento final.

Fluxo: enviar modelo → mapear variáveis → testar com dados fictícios → aprovar versão → escolher no atendimento → preencher → revisar pendências → gerar → guardar versão e dados usados.

Mudança no cadastro não reescreve contratos já gerados. Alteração posterior produz nova versão. Controlar quem pode editar/aprovar modelos. Registrar autor, data e ligação com orçamento/cliente. Conversão DOCX/PDF exige validar runtime/serviço compatível; não presumir renderização completa disponível no Worker.

Assinatura eletrônica é integração opcional a decidir. Documento gerado não é documento assinado; manter estados distintos. Conteúdo contratual deverá ser fornecido/aprovado pela empresa; o sistema não inventa cláusulas jurídicas.

## WhatsApp por link — confirmado

Usar `https://wa.me/<numero_internacional>?text=<mensagem_codificada>`. Normalizar número com DDI/DDD; validar número antes de abrir. A pessoa revisa e envia no WhatsApp/Web.

Mensagens sugeridas: primeiro contato, retorno de orçamento, confirmação de visita e pós-atendimento. Templates editáveis por administradores, preenchidos com dados selecionados. Evitar inserir dados sensíveis desnecessários no texto da URL. Arquivos podem ser baixados e anexados manualmente; não tornar documentos privados públicos para contornar essa limitação.

Sem API: não há sincronização de conversas, confirmação de envio/leitura, resposta automática nem anexação automática pelo link. Registrar abertura do botão como abertura, nunca como mensagem enviada. Registrar resultado do contato manualmente no CRM.

Referência: https://faq.whatsapp.com/5913398998672934 (consultada em 16/09/2026).

## Fiscal — viável, integração pendente

Usuário não sabe qual emissor a Limpax usa; acredita que emite pelo portal normal. **[VALIDAR] emissor, CNPJ, inscrição, regime, serviços/códigos, retenções, autorização e credenciais/certificado aplicáveis.** Não escolher provedor ou contratar plano por inferência.

Alternativas: integração direta com o emissor aplicável ou provedor fiscal compatível. Avaliar suporte ao DF, ambiente de teste, custos, certificados, consulta de resultado, rejeições, cancelamento e manutenção das regras. Antes de implementar conector, confirmar com empresa/contabilidade os parâmetros fiscais.

Fluxo proposto: preparar dados → revisar → solicitar emissão → consultar processamento → autorizada ou rejeitada → guardar identificadores e arquivos retornados. Nunca marcar como emitida pelo mero envio da requisição. Retry deve consultar resultado e evitar emissão duplicada. Cancelamento e substituição seguem capacidades/regras do emissor confirmado.

Consulta realizada em 16/09/2026: portal oficial do DF disponibiliza webservice, homologação e documentação, e informa exclusividade do padrão nacional a partir de 01/10/2026. **Revalidar documentação vigente quando começar a integração.** Não assumir que a API nacional genérica é o endpoint correto para todo contribuinte do DF.

Fontes: https://iss.fazenda.df.gov.br/online/Login/Login.aspx?ReturnUrl=/online/Default/ e https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual

## Automações internas propostas

- Entrada do Check gera demanda e tarefa conforme regra configurada.
- Proposta sem retorno entra na lista de acompanhamento.
- Ganho permite gerar OS com vínculo ao orçamento.
- Conclusão prepara pendências de documento/faturamento/retorno.
- Vencimento atualiza alertas de contas a receber.

Automações precisam de regras explícitas, execução idempotente, histórico, retry e mecanismo de agendamento real. Não prometer ação automática enquanto não houver executor configurado. Não enviar mensagens externas por padrão.

## Segurança das integrações

Credenciais apenas no servidor/gerenciador de segredos. Permissões administrativas, auditoria sem payloads sensíveis, processamento de arquivos privados, limites de tamanho/tempo, homologação com dados fictícios e recuperação documentada. Não pedir certificados ou senhas em arquivos Markdown ou no repositório.
