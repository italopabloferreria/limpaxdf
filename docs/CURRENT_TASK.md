# Tarefa ativa

## ID

`G13-QA-01`

## Objetivo

Concluir o QA autenticado do CRM para decidir o Release Gate G13 com evidência reproduzível.

## Motivo

O lint foi encerrado em 22/09/2026 com zero erros e zero avisos. As oito suítes somam 47 testes aprovados, TypeScript e build também passam. O gate ainda depende da validação dos fluxos mutáveis autenticados, teclado e recuperação.

## Escopo permitido

- executar smoke de `/`, `/check`, `/crm` e `/crm/clientes` com dados sintéticos;
- validar por teclado os fluxos principais, foco de dialogs e mensagens de erro;
- validar tarefas, notas, vínculo/desvínculo e ciclo de clientes com autenticação local;
- ensaiar backup/restauração local e registrar limitações;
- corrigir apenas defeitos reproduzidos durante esse QA, com teste quando aplicável;
- atualizar as evidências do G13 e os arquivos de handoff.

## Fora do escopo

- criar ou conectar projeto Supabase;
- migrar D1/R2 ou aplicar migrações remotas;
- implementar Google Login, importador, contratos, agenda, financeiro ou fiscal;
- fazer deploy, alterar domínio/DNS ou usar dados reais;
- refatoração visual ampla.

## Critérios de aceite

- jornadas essenciais autenticadas funcionam sem perda ou mistura de dados;
- navegação principal funciona por teclado com foco perceptível;
- backup/restauração local possui procedimento e evidência;
- `npm run lint`, oito suítes, TypeScript e build permanecem aprovados;
- bloqueios remotos ficam claramente separados do que foi validado localmente.

## Estado

`local-complete` — QA funcional, teclado, responsividade, lifecycle e recuperação aprovados. G13 permanece aberto somente pelos itens remotos abaixo.

## Próximo passo

Preparar a validação remota de migrações, recuperação, configuração e performance em etapa separadamente autorizada. Não iniciar Supabase nem deploy sem ambiente e credenciais confirmados.

## Checklist da etapa remota

1. Identificar o ambiente e a versão publicada, sem alterar dados; comparar o commit com o repositório local.
2. Conferir quais migrações D1 0003–0005 foram aplicadas e fazer backup antes de qualquer upgrade.
3. Ensaiar restauração em ambiente isolado e conferir contagens, vínculos e integridade sem copiar dados reais para o repositório.
4. Executar smoke autenticado com registros sintéticos e papéis de administrador/atendimento.
5. Medir Core Web Vitals no domínio final, revisar logs, monitoramento, retenção e rollback.
6. Registrar PASS/FAIL/WARNING por dimensão na matriz G13 antes de propor cutover ou publicação.
