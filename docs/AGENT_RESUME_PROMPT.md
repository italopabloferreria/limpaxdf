# Prompt padrão para retomar o LIMPAX

Use este texto ao abrir o repositório no Codex, GitHub Copilot, Antigravity ou outro agente. O prompt autoriza trabalho local somente dentro da tarefa ativa; não autoriza deploy, mudanças remotas ou ações destrutivas.

```text
Este é um PROJETO JÁ EXISTENTE. Trabalhe em modo:

EXISTING PROJECT → AUDIT & RESUME

Repositório canônico:
C:\Users\italo\Programação\Limpax

Objetivo da sessão:
compreender o estado real do repositório e prosseguir com a única tarefa ativa documentada, preservando toda implementação funcional e todas as mudanças existentes.

Este prompt autoriza executar localmente a tarefa descrita em docs/CURRENT_TASK.md, desde que ela esteja em estado ready. Não autoriza deploy, publicação, alteração de DNS, criação ou alteração de serviços remotos, aplicação de migração remota, importação de dados reais, envio de mensagens, convite de usuários, emissão fiscal ou exclusão destrutiva.

ORDEM OBRIGATÓRIA DE LEITURA

1. Leia AGENTS.md integralmente.
2. Leia .icbai/PROJECT_STATE.json.
3. Leia docs/AI_HANDOFF.md.
4. Leia docs/CURRENT_TASK.md.
5. Confira git status e o diff existente.
6. Leia o código, migrações, testes e documentos diretamente relacionados à tarefa ativa.

Não use conversas anteriores como fonte de verdade. Não confie apenas neste prompt. O repositório prevalece.

PRINCÍPIO

PRESERVE → UNDERSTAND → COMPLETE → VERIFY → RECORD

REGRAS DE EXECUÇÃO

- Preserve a árvore de trabalho e mudanças não commitadas. Não use reset destrutivo.
- Implemente somente o escopo permitido em docs/CURRENT_TASK.md.
- Não refatore áreas não relacionadas por preferência arquitetural.
- Não reinicie Discovery, UX, Design ou Architecture já comprovados.
- Não invente dados empresariais, licenças, SLA, cobertura, integrações ou capacidades.
- Marque informação externa não confirmada como [VALIDAR].
- Faça alterações pequenas e verificáveis.
- Corrija a causa dos problemas; não esconda erros desligando regras globalmente.
- Se alterar comportamento, adicione ou ajuste teste relevante antes de declarar conclusão.
- Autorize no servidor, valide entradas e preserve atomicidade, auditoria e idempotência.
- Nunca coloque credenciais, tokens, planilhas reais ou PII no código, Git, logs ou documentação.

ARQUITETURA

- Atual: React/TypeScript, Vinext/Vite, Cloudflare Workers, D1/Drizzle e R2.
- Alvo aprovado: Supabase PostgreSQL, Auth com Google, RLS e Storage privado.
- Supabase ainda não é a infraestrutura ativa.
- D1/R2 devem permanecer intactos até migração reversível, testada, reconciliada e aprovada.
- Não comece a migração Supabase se ela não for a tarefa ativa.

MÉTODO

1. Confirme se o estado descrito em CURRENT_TASK coincide com o código atual.
2. Registre divergências antes de corrigir.
3. Execute a tarefa até seus critérios de aceite ou até encontrar bloqueio real.
4. Rode todos os testes e checks obrigatórios indicados na tarefa.
5. Não trate build ou teste unitário isolado como prova de produção.
6. Faça QA manual quando a tarefa afetar interface ou fluxo de usuário.
7. Ao terminar, atualize obrigatoriamente:
   - .icbai/PROJECT_STATE.json
   - docs/AI_HANDOFF.md
   - docs/CURRENT_TASK.md
8. CURRENT_TASK.md deve continuar contendo apenas UMA tarefa: marque a atual como concluída e substitua-a pela próxima tarefa concreta, ou registre bloqueio preciso.
9. Nenhum estado relevante pode ficar somente na resposta do agente.

FORMATO DA ENTREGA

Informe de forma objetiva:

- diagnóstico confirmado;
- alterações realizadas e arquivos afetados;
- testes/checks executados e resultados exatos;
- limitações e riscos restantes;
- estado do gate atual;
- próxima tarefa única registrada no repositório.

Pare antes de qualquer ação externa, destrutiva ou não autorizada e peça aprovação específica.

INSTRUÇÃO ADICIONAL DESTA SESSÃO

[Opcional: escreva aqui uma restrição ou prioridade. Se ficar vazio, execute somente docs/CURRENT_TASK.md.]
```

## Uso recomendado

Cole o prompt acima na primeira mensagem do agente com o repositório aberto. Se quiser apenas auditoria, substitua a frase de autorização por: “Nesta sessão, faça somente análise e documentação; não altere código.”

Quando uma nova prioridade for aprovada, atualize primeiro `docs/CURRENT_TASK.md`; evite colocar uma segunda tarefa concorrente apenas no prompt.
