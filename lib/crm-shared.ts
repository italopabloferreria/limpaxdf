export const crmStatuses=["novo","em_contato","qualificado","orcamento","agendado","em_execucao","concluido","recorrencia","cancelado"] as const;
export type CrmStatus=(typeof crmStatuses)[number];
export const statusLabels:Record<CrmStatus,string>={novo:"Novo",em_contato:"Em contato",qualificado:"Qualificado",orcamento:"Orçamento",agendado:"Agendado",em_execucao:"Em execução",concluido:"Concluído",recorrencia:"Recorrência",cancelado:"Cancelado"};
