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

`ready`.

## Próximo passo

Executar o QA autenticado em pequenos lotes e atualizar a matriz do G13. Não iniciar Supabase nem deploy.
