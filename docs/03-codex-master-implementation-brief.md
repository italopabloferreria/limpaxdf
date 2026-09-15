# Limpax — Codex Master Implementation Brief
Versão 1.0 · 15/09/2026 · baseline anterior à implementação.

## Implementar
React + TypeScript + Vinext com renderização no servidor, Cloudflare Worker via Sites, D1/Drizzle para registros e R2 para anexos.
Preservar lockfile e integração do starter. Componentes acessíveis existentes para rádio, checkbox, progresso e select.
Conteúdo centralizado; assets desacoplados. Nunca codificar dados não confirmados como verdade.
UI editorial Asphalt/Concrete, display pesado, linha amarela, hero cinematográfico substituível, serviço por capítulo. Mobile sem efeitos pesados.
Implementar as rotas e jornadas do Product Spec. Não criar painel administrativo público.

## Requisitos técnicos
Servidor valida schema e comprimento; rejeita origem diferente, tipo incorreto e corpo excessivo; usa prepared statements.
Sem segredos no cliente; APIs CRM com bearer constante e >=32 caracteres, falha fechada sem configuração.
Rate limiting persistente com chave hash temporária; sem IP bruto em leads/analytics.
Idempotency-Key para cadastro; resposta de replay não expõe dados do contato.
Outbox transacional com lead, entrega manual autenticada/reexecutável, timeout, sem redirecionamento a hosts arbitrários, deduplicação no consumidor.
Fotos privadas, MIME/assinatura/limites, vinculadas ao lead via token de upload de curta duração, acesso somente por integração autenticada.
Analytics allowlist de eventos, consentimento prévio, sem URL completa, texto livre, telefone/email ou identificação de pessoa.
Avisos de privacidade provisórios transparentes. Configuração de liberação comercial, canal de direitos e retenção precisam de aprovação empresarial. HTTPS no hosting.

## Entregáveis
Código executável; três documentos de baseline; sitemap/copy centralizada; .env.example; schema e migrações; contrato OpenAPI; instruções CRM/retention/backup/rollback; testes de segurança e negócio; relatório do build; URL publicada e limitações honestas.
Não publicar credenciais nem arquivos .env. Não enviar dados a terceiros sem endpoint definido e autorização.
Lançamento privado pode avançar com [VALIDAR]; lançamento comercial/captação requer configurações reais.

## Sequência
Baseline documental → primeiro hero/diagnóstico coerente e preview → persistência/jornadas/páginas → imagens → testes e revisão visual → build → versão/publish → verificação do estado e entrega.
Gates: nenhum starter residual; sem formulário fake; sem sucesso antecipado; referências e assets resolvidos; falhas seguras; comunicação final distingue implementado, publicado e pendente.
