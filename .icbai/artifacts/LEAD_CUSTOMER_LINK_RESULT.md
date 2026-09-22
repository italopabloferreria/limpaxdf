# Incremento A04b — vínculo atendimento → cliente

Data: 17/09/2026
Gate: G12_INCREMENT_VERIFIED
Estado: PASS local

## Entrega

- Busca explícita de clientes existentes no detalhe do atendimento.
- Seleção do cadastro e carregamento de contatos e locais de serviço.
- Pré-seleção do contato e do local marcados como principais, com escolha manual opcional.
- Criação e remoção do vínculo pelas APIs existentes, preservando as validações e a auditoria do servidor.
- Estados acessíveis de carregamento, vazio e erro, além de layout responsivo.
- Atualização do detalhe após vincular ou desvincular, sem recarregar a página inteira.

## Arquivos principais

- `lib/crm-customer-link.ts`
- `components/lead-customer-linker.tsx`
- `components/crm-workspace.tsx`
- `app/globals.css`
- `tests/crm-customer-link.test.tsx`
- `scripts/test-crm-customer-link.mjs`

## Evidência

- TDD vermelho observado: 5/5 testes falharam antes da implementação pela ausência do serviço e do componente.
- Testes A04b: PASS 5/5.
- Regressão consolidada: PASS 39/39 (negócio 16, acesso 14, deep link 2, seleção concorrente 2, vínculo 5).
- TypeScript: PASS `npx tsc --noEmit`.
- Lint focalizado no novo serviço, componente e teste: PASS.
- Build de produção: PASS `npm run build`.

## Limites

- Nenhum deploy realizado; G13 continua bloqueado.
- QA autenticado em browser, mobile e teclado ainda precisa ser executado.
- O `crm-workspace.tsx` mantém cinco erros de lint já registrados antes deste incremento; o lint global continua aberto.
- Política operacional de retenção segue [VALIDAR]; A06 não deve executar expurgo real durante desenvolvimento.

## Próximo passo

Implementar A06 em uma fatia reversível: separar dados de revisão e operação, representar lifecycle/arquivamento por entidade e cobrir referências com testes sintéticos, sem definir prazo legal de retenção por inferência.
