# Dados e migração Excel/CSV

Estado: desenho proposto. O usuário confirmou que as planilhas contêm todo o histórico operacional. Formatos, volumes e qualidade ainda [VALIDAR] com amostra.

## Entidades e relações

| Entidade | Conteúdo principal / relação |
| --- | --- |
| Cliente | Pessoa ou organização; dados cadastrais e fiscais quando necessários |
| Contato | Pessoa de contato, telefones/e-mail, função e vínculo ao cliente |
| Local | Endereço de serviço, referência, instruções e vínculo ao cliente |
| Oportunidade | Demanda comercial ligada a cliente/local; origem, etapa, responsável, valor e resultado |
| Orçamento | Itens, quantidades/unidades definidas, preço, condições, validade e versão |
| Ordem de serviço | Execução vinculada à oportunidade/orçamento; local, equipe, veículo, datas e evidências |
| Compromisso | Retorno, visita ou execução; início/fim, responsáveis e recursos reservados |
| Tarefa | Próxima ação com prazo, responsável e conclusão |
| Documento | Modelo e versão usados, dados congelados na geração, arquivo e estado |
| Conta a receber | Valor devido, vencimento, parcelas, vínculo ao serviço/cliente |
| Recebimento | Valor, data, meio e alocação; permitir pagamentos parciais e estornos auditados |
| Nota fiscal | Solicitação de emissão, identificadores externos, estados e arquivos autorizados |
| Atividade | Linha do tempo: notas, mudanças e eventos, com autor/data |
| Lote de importação | Origem, mapeamento, registros afetados, erros e resultado |

Preservar a relação entre a solicitação original do Check e as entidades futuras. Migrar incrementalmente; não substituir nem apagar os leads existentes para adotar o novo modelo.

## Regras de dados

- Valores monetários em centavos ou decimal exato; evitar cálculos com ponto flutuante.
- Documentos, telefones e CEP como texto, preservando zeros.
- Datas de agenda com fuso explícito; vencimentos sem hora tratados como data civil. Interface em America/Sao_Paulo.
- Campo desconhecido permanece vazio/pendente; não transformar ausência em zero ou em pagamento confirmado.
- Cadastros deduplicados não significam oportunidades duplicadas: um cliente pode contratar repetidamente.
- Orçamentos e documentos emitidos preservam o retrato dos dados naquele momento.
- Aplicar paginação e pesquisa no servidor; não restringir o sistema aos 150 registros mais recentes.

## Assistente de importação

1. Receber `.xlsx` e `.csv`. `.xls` legado depende de amostra e suporte escolhido.
2. Selecionar aba/cabeçalho; reconhecer separador e codificação do CSV.
3. Mapear colunas e definir destino: cadastro, oportunidade, serviço histórico, agenda, financeiro.
4. Normalizar formatos brasileiros com prévia, sem executar fórmulas ou macros.
5. Validar linhas, relações e possíveis duplicidades.
6. Apresentar totais de criação, atualização, descarte e revisão.
7. Confirmar lote; processar em blocos, com progresso persistido e retomada.
8. Entregar relatório com linha de origem, resultado e erro específico.

## Duplicidades e rastreabilidade

- Comparar documento, telefone e e-mail normalizados, respeitando números compartilhados e múltiplos contatos.
- Nomes iguais são alerta, não autorização para mesclar.
- Escolha explícita de criar, ignorar ou atualizar; mostrar campos alterados antes de sobrescrever.
- Usar chave de origem/lote para que retry ou repetição do arquivo não duplique registros silenciosamente.
- Manter valores anteriores para atualizações; reversão do lote deve detectar edições posteriores e não apagá-las.
- Marcar dados históricos/importados e preservar datas originais. Importação não conta como novo contato comercial de hoje.
- Dados de teste/revisão não entram em métricas operacionais reais.

## Proteção e verificação

Limitar tamanho, quantidade de linhas e expansão de arquivos compactados; processamento pesado não deve exceder os limites do Worker. Não aceitar upload e parsing ilimitados em memória. Arquivos privados com retenção definida. Ao exportar CSV, neutralizar células interpretáveis como fórmulas.

Critérios de aceite: amostra representativa importada; erros por linha explicáveis; retry sem duplicação; pagamentos não inferidos de valores avulsos; histórico vinculado ao cliente correto; nenhuma notificação disparada pela importação; conferência de totais financeiros antes/depois; exportação íntegra; reversão com conflitos explicitados.

## Pendências para fechar o mapeamento

Amostra anonimizada; quantidade de arquivos/abas/linhas; significado das colunas; identificação atual de cliente/serviço; formatos de datas/valores; como registrar parcial, cancelamento e estorno; existência de contratos/anexos fora das planilhas. Não precisa resolver integração fiscal para mapear clientes e agenda.
