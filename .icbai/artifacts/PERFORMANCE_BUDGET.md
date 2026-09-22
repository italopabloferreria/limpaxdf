# Orçamento de performance — G10C
Metas internas de engenharia, não SLA prometido pela Limpax.
- CRM: listagem padrão 50, máximo conforme parser existente; não carregar histórico inteiro no browser.
- Em ensaio com 10 mil leads/2 mil clientes sintéticos, APIs de lista/detalhe: p95 <= 800 ms após warm-up, 30 requests sequenciais; documentar ambiente/latência separadamente.
- Página principal e CRM em viewport móvel: alvo LCP <= 2,5 s, CLS <= 0,1 e interação responsiva; laboratório não prova percentil de usuários reais.
- Incremento auth: zero dependência nova, zero requisição externa de autorização, uma consulta profiles por guard; escrita last_seen existente preservada. Sem PII serializada em negativas.
- Riscos: imagens hero, blur/parallax, bundles de componentes, consultas sem índice, listas crescentes; manter paginação e motion reduzido.
Método: build de produção, browser/Lighthouse quando disponível, mesma máquina/perfil mobile/throttling e três execuções; registrar mediana e pior. Comparar asset sizes do build. Não marcar aprovado com base apenas em build.
Budget definido para orientar implementação; medições permanecem pendentes no G13. Não refazer design para obter pontuação arbitrária.
