# Resultado — histórico cliente → atendimento e concorrência de tela
16/09/2026. Implementado e verificado localmente; sem deploy.

- /crm aceita searchParams.selected somente como UUID válido e repassa a seleção inicial ao workspace.
- O atendimento solicitado permanece selecionado mesmo fora da primeira página; identificador malformado é ignorado.
- Respostas atrasadas de detalhe e PATCH só alteram o painel quando pertencem ao lead ainda selecionado.
- A listagem pode receber a atualização do lead correspondente sem substituir o detalhe atual.

TDD: deep link falhou 1/2 antes e passou 2/2 depois; proteção de estado falhou 0/2 antes e passou 2/2 depois. Suítes completas: 34/34, TypeScript e build PASS. Lint dos novos arquivos PASS; crm-workspace ainda tem cinco erros preexistentes registrados.

Limite: APIs de vínculo existem e cliente mostra histórico, porém ainda falta busca/seletor para criar ou remover o vínculo pelo painel do atendimento. Isso é o próximo incremento A04b.
