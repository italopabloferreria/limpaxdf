# Instruções do GitHub Copilot — LIMPAX

Leia `AGENTS.md` e siga sua ordem de fontes de verdade. Antes de sugerir código, leia `.icbai/PROJECT_STATE.json`, `docs/AI_HANDOFF.md`, `docs/CURRENT_TASK.md` e os arquivos diretamente relacionados.

Implemente somente a tarefa ativa. Preserve código funcional, mudanças não commitadas, identidade visual e contratos existentes. Não transforme propostas futuras em funcionalidades declaradas como prontas.

O runtime atual usa Cloudflare D1/R2. Supabase é arquitetura alvo e deve entrar por migração reversível; não misture adapters sem o plano da tarefa. Nunca exponha segredos ou `service_role`, nunca aceite papel vindo de metadado editável e sempre projete RLS por ação e entidade.

Valide entrada e autorização no servidor, mantenha atomicidade/idempotência, use consultas parametrizadas e registre ações relevantes sem PII. Não invente dados da Limpax; use `[VALIDAR]`.

Ao terminar, execute os checks exigidos em `docs/CURRENT_TASK.md` e atualize o estado permanente. Não deixe decisões somente no chat ou em comentários de código.
