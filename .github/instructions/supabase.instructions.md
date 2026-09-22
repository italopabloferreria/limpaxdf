---
applyTo: "supabase/**,db/**,drizzle/**,lib/**/*supabase*.ts"
---

# Banco e migração Supabase

- D1/Drizzle é a fonte atual; Supabase é o alvo. Preserve ambos até o cutover validado.
- Mapeie cada tabela, constraint, índice e regra de lifecycle antes de escrever migração.
- Toda tabela exposta usa RLS e políticas específicas com `USING` e `WITH CHECK` quando aplicável.
- Papéis administrativos não dependem de `user_metadata`; segredos e `service_role` ficam apenas no servidor.
- Buckets são privados; teste upload, download, substituição e exclusão com as políticas reais.
- Migração exige export, checksum/reconciliação, dry run, rollback e teste de restauração.
- Não aplique mudanças remotas nem crie projeto Supabase sem autorização explícita.
