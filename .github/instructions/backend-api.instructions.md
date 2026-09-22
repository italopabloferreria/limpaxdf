---
applyTo: "app/api/**/*.ts,lib/**/*.ts"
---

# Backend e APIs

- Autentique e autorize antes de ler PII; escondê-la na UI não basta.
- Escritas de sessão verificam origem; integrações usam segredo servidor e escopo mínimo.
- Use Zod/validação estrita, consultas parametrizadas, tipos de linha explícitos e erros seguros.
- Preserve atomicidade entre entidade, histórico e outbox; use idempotência para retries.
- Não registre payloads, tokens, documentos ou dados pessoais em logs.
- D1 é o backend atual. Não converta uma rota isoladamente para Supabase sem adapter/plano aprovado.
