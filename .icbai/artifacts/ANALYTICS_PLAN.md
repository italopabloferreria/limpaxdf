# Medição — G10
Planejamento, não painel entregue. Fonte primária: dados de negócio persistidos; evento do navegador não confirma venda.

KPIs: leads live criados por período; distribuição por status; tarefas vencidas abertas por responsável (total filtrado no servidor, não página); conversão por coorte de criação até ganho/perda quando estágio comercial existir. Financeiro somente após módulo reconciliado, sem receita inferida de quantidade de leads.
Janela: timestamp UTC persistido, apresentação America/Sao_Paulo. Datas civis financeiras separadas de instantes.
Taxonomia: preservar enum eventSchema em lib/validation.ts. Visualização/início/conclusão de Check são sinais de experiência; conversão válida é lead persistido com idempotência. Repetição não conta duas vezes.
Revisão, fixtures e importações históricas excluídas de novas conversões. Identificador de lote e origem previstos no DATA_MODEL.
Consentimento: analytics opcional; nenhuma identidade, telefone, documento, conteúdo de nota ou URL com PII. Não adicionar provider. Falha de analytics não impede atendimento.
Aceite futuro: reconciliar total com consulta DB, testar idempotência, exclusão review e filtros globais, recusa/retirada de consentimento. Incremento de auth não adiciona eventos e não altera consentimento.
