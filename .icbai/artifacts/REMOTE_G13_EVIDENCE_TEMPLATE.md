# G13 remoto — template de evidencias

Preencher somente durante a validacao remota autorizada. Nao incluir segredos, tokens, certificados, PII, planilhas reais ou dumps integrais.

## Identificacao

- Data:
- Operador:
- Ambiente (`LIMPAX_REMOTE_ENV`):
- HEAD local validado:
- Commit publicado antes da acao:
- Commit publicado depois da acao:
- Dominio/URL validado:

## Preflight

```text
Comando: npm run qa:remote-readiness
Resultado:
Avisos:
Decisao:
```

## Banco remoto

- Binding D1:
- Tabelas vistas antes da acao:
- Migracoes remotas aplicadas:
- Migracoes locais pendentes:
- Divergencias encontradas:
- Dados reais lidos? `nao`

## Backup e restauracao

- Backup criado:
- Local de guarda fora do repositorio:
- Restauracao isolada executada:
- Resultado de integridade:
- Contagens conferidas:
- Vinculos conferidos:
- Resultado:

## Smoke autenticado

- Papel administrador validado:
- Papel atendimento validado:
- Registro sintetico usado:
- Fluxos executados:
- Resultado:
- Evidencia sem PII:

## Performance e disponibilidade

- URL medida:
- Ferramenta:
- LCP:
- INP:
- CLS:
- Observacoes:

## Rollback

- Plano revisado:
- Responsavel:
- Janela operacional:
- Comando/procedimento de rollback registrado fora de segredos:
- Teste ou ensaio de restauracao:

## Decisao G13

- Aceites funcionais:
- Configuracao de deployment:
- Rollback e recuperacao:
- Performance:
- Privacidade:
- Seguranca:
- Resultado final: `PASS | FAIL | WARNING`
- Riscos aceitos:
- Proxima acao:
