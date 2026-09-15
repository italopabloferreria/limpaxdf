# Limpax — Product / Experience Spec
Versão 1.0 · 15/09/2026 · antes do código de produto.

## Objetivo e jornadas
Converter reconhecimento de problema em solicitação estruturada para avaliação humana. B2C (residência/pontual) e B2B (empresa/condomínio).
Navegação narrativa: hero → diagnóstico rápido → operação → serviços em capítulos → frota → empresas → confiança/DF → Check → futuro da recorrência → CTA.
Sem hijack de scroll. Desktop usa cenas e texto sticky; mobile empilha e remove parallax. Reduced motion preserva tudo estático.

## Sitemap
/ narrativa principal com âncoras /#diagnostico /#operacao /#servicos /#frota /#empresas /#sobre.
/check formulário progressivo; /privacidade aviso e direitos; /cookies preferências.
/servicos/[slug] detalhe editorial de cada capítulo proposto, explicitamente [VALIDAR].
/api/check solicitações; /api/uploads fotos opcionais; /api/events métricas sem PII; /api/crm/export e /api/crm/dispatch integração protegida; /api/health disponibilidade técnica.
Sitemap XML e robots: indexação bloqueada enquanto lançamento comercial não validado.

## Copy provisória para publicação controlada
Hero: Tudo precisa continuar fluindo. / Limpax no Distrito Federal. Desde 2005, uma história construída em operação.
Provas: Desde 2005 / 03 caminhões / Distrito Federal.
Diagnóstico: Selecione o que mais se aproxima do problema. Vamos organizar as informações para avaliação da equipe.
Portfólio: limpeza de fossas; hidrojateamento; desentupimento e desobstrução; caixa de gordura; controle de pragas. Todos [VALIDAR] disponibilidade e descrição.
DF: Atuação no Distrito Federal. Informe sua região para consultar atendimento; sem mapa de cobertura fictício.
Sucesso: Solicitação registrada. Guarde o protocolo. O registro não confirma agendamento ou prazo de atendimento.
Indisponibilidade: Não foi possível registrar. Suas respostas continuam nesta tela. Tente novamente.
Recorrência: Resolver é importante. Evitar é melhor. Modelo de manutenção preventiva em desenvolvimento [VALIDAR].

## Limpax Check
8 passos: problema; local do problema; tipo de imóvel; urgência declarada; acesso; fotos opcionais; região/CEP; contato e revisão.
Pré-seleção do diagnóstico pela URL contém somente categoria, nunca PII.
Nome e telefone necessários; email opcional; sem CPF, dados de pagamento ou coleta de localização precisa.
Uploads limitados a imagens JPEG/PNG/WebP, no máximo três de 4 MB, guardados privados; orientar a não incluir pessoas/documentos. Upload vinculado à solicitação após recebimento, nunca público.
Validação cliente e servidor, voltar sem perda, resumo revisável, foco por etapa, erros associados, progress acessível, submissão idempotente, spinner e confirmação somente após persistência real.
Check organiza demanda; nunca recomenda intervenção perigosa, calcula orçamento, promete urgência, diagnóstico ou SLA.

## Dados e consentimento
D1 armazena lead, status, consentimentos, outbox CRM; R2 guarda anexos privados. Preferências locais só para cookies.
Recebimento comercial inicialmente bloqueado por configuração até responsável/canal e política aprovados. Ambiente privado serve para revisão funcional; testes usam dados sintéticos.
Consentimento opcional de marketing independente; analytics desligado até escolha positiva e configuração.
CRM sem fornecedor inventado: API autenticada de exportação e outbox com confirmação, idempotência, tentativas limitadas e erro sem perda do lead.
Recorrência futura: modelo de histórico/intervalo, sem envio automático ou cálculo técnico presumido.

## Aceite
Navegação/Check por teclado; layouts 375/768/1440px; zoom 200%; contraste AA; redução de movimento.
Conteúdo server rendered. Hero otimizado, dimensões fixas, lazy loading inferior, fontes locais, sem vídeo/WebGL obrigatório.
Testar esquema, rejeição de entradas inválidas, origem, limites, idempotência, persistência, permissões, falha CRM, consentimento e build.
Publicação inicial privada preserva revisão operacional. Ativar captação pública só após preencher configurações reais; nunca declarar CRM conectado sem entrega comprovada.
