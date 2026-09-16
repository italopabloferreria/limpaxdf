# Fluxos e interface operacional

Estado: proposta de produto baseada no pedido do usuário. Inspiração de organização: Kommo; identidade própria da Limpax.

## Navegação prevista

Início · Atendimento/Funil · Clientes · Agenda · Orçamentos · Ordens de serviço · Documentos · Financeiro · Relatórios · Administração.

Atendente: início com contatos novos, retornos vencidos, propostas pendentes e serviços do dia. Administradores: visão consolidada e acesso aos módulos restritos. Não mostrar hero de marketing na área operacional.

## Três processos ligados, estados separados

Comercial: novo → entendimento/qualificação → orçamento em preparação → proposta enviada → negociação → ganho/perdido.

Execução: a programar → agendada → em execução → concluída; cancelamento/reagendamento com motivo e histórico.

Financeiro: a vencer → vencido → parcialmente pago → pago; estorno/cancelamento auditado. Nota fiscal tem estado próprio de emissão. Ganho não significa serviço concluído, faturado ou recebido.

As etapas exatas são propostas. Mapear os estados atuais antes de migrar; preservar histórico e não interpretar automaticamente `concluido` como pagamento realizado.

## Ficha de atendimento

Mostrar contato, empresa, locais, demanda, urgência informada, responsável, próxima ação, orçamento, documentos, fotos e linha do tempo. Botão WhatsApp com mensagem selecionável. Acesso às oportunidades e serviços anteriores do mesmo cliente.

Funil em cartões e alternativa em lista; movimentação com validação e opção acessível por menu/teclado, além de arrastar. Busca global, filtros persistentes, ordenação e paginação. Mudanças com indicação de sucesso/erro, prevenção de conflito entre edições e atualização correta da ficha.

## Orçamento e ordem de serviço

Orçamento: itens e escopo editáveis, quantidades/unidades aplicáveis, valores, descontos controlados, pagamento, validade, observações e versões. Registrar aceite e sua evidência; não supor que abrir o documento significa aceitar.

Ao ganhar a oportunidade, criar OS de forma idempotente, usando orçamento aprovado. OS reúne local, instruções de acesso, equipe, caminhão, janela prevista, registro de início/fim, fotos e observações. Conclusão pode preparar faturamento e retorno; nenhuma emissão fiscal automática sem fluxo definido.

## Agenda

- Dia, semana e mês; filtros por equipe, responsável, caminhão e tipo de compromisso.
- Compromissos comerciais, visitas, execução e retornos.
- Horário, duração prevista, endereço, vínculo ao atendimento e situação.
- Detectar sobreposição de equipe/veículo, considerando duração e intervalo operacional configurado.
- Reagendar com motivo e histórico; alterações concorrentes não podem reservar o mesmo recurso sem aviso.
- Recorrência definida pela equipe e pelo contrato; não presumir intervalo técnico para serviços.
- Calendário externo é extensão opcional. Agenda interna funciona sem depender de Google/Outlook.

## Direção visual

Preservar Safety Yellow, Asphalt e Concrete; usar superfícies claras de leitura e amarelo para ações/prioridades. Navegação lateral, tabelas legíveis, funil central e detalhe lateral ou página completa em celular. Pouco glass em dados densos; não replicar o tratamento cinematográfico da home no CRM.

Labels úteis, status em texto além de cor, ícones consistentes, estados vazios com ação relevante. Conteúdo principal 16px; controles frequentes 14px ou mais. Foco visível, teclado, mensagens associadas aos campos e layout utilizável com ampliação de texto. Testar telas pequenas e grandes com dados longos, não só cards vazios.

## Indicadores e definições

| Indicador | Regra proposta |
| --- | --- |
| Contatos recebidos | Entradas reais por origem/período; separar importações históricas |
| Conversão | Ganhas / oportunidades encerradas na população selecionada; mostrar período e denominador |
| Propostas pendentes | Enviadas sem resultado, com tempo nessa condição |
| Ciclo comercial | Tempo entre abertura e ganho/perda; exibir critério e população |
| Valor contratado | Valor dos negócios ganhos, preservando cancelamentos/ajustes |
| Faturado | Notas autorizadas segundo regra fiscal validada; distinguir de contratado |
| Recebido | Pagamentos registrados líquidos de estornos; não inferir de nota |
| A receber | Saldo devido por vencimento, inclusive pagamentos parciais |
| Ocupação prevista | Horas reservadas / disponibilidade configurada por recurso |
| Recorrência | Clientes com novas contratações em período definido |

Filtros por período, responsável, serviço, origem e cliente quando aplicáveis. Clique no indicador abre registros que o compõem. Sem base de custos, não prometer lucro/margem. Sem sincronização de WhatsApp, não alegar tempo real de resposta ou leitura de mensagens.
