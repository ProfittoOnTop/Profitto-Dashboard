# Configuração da Gestão à Vista (config/pres-config.json)

Este arquivo guarda a configuração da apresentação (relógio/contagem
regressiva, duração de cada slide, ordem, filtro de processo, galeria de
fotos) para que **qualquer computador ou TV que abrir o dashboard receba a
mesma configuração**, em vez de cada um guardar a sua própria (que é o
comportamento padrão do navegador, e a razão de o relógio aparecer
diferente em cada máquina).

## Como atualizar (automático, desde 2026-07-13)

Se o navegador tiver um token do GitHub configurado em **Administração → 🔄
Sincronização entre TVs** (o mesmo token usado para sincronizar indicadores),
qualquer mudança feita na seção **"📺 Gestão à Vista — Configurações"**
(nome/data/hora do relógio, duração dos slides, ordem, filtro, fotos,
seleção manual de indicadores) já grava sozinha neste arquivo — não precisa
baixar nem subir nada. A gravação espera ~1,5s de inatividade antes de
comitar (pra não gerar um commit por pixel arrastado no slider ou por clique
em cada indicador da lista).

## Como atualizar (manual — sem token configurado)

1. Abra o dashboard no seu computador e entre na Administração (senha `1312`).
2. Configure o que quiser na seção **"📺 Gestão à Vista — Configurações"**
   normalmente.
3. Role até **"Sincronizar esta configuração em todas as TVs"** e clique em
   **"⬇ Baixar configuração (pres-config.json)"**. Um arquivo é baixado no
   seu computador.
4. No site do GitHub, abra este arquivo (`config/pres-config.json`) e clique
   no ícone de lápis (editar) — ou arraste o arquivo baixado para dentro
   desta pasta pelo botão "Add file → Upload files", substituindo o
   existente.
5. Comite (salve) a mudança direto na branch `main`.

Em ambos os casos: qualquer computador ou TV que abrir (ou recarregar) o
dashboard a partir de agora vai vir com essa mesma configuração.

## Importante

- Se este arquivo não existir ou não puder ser lido, o dashboard simplesmente
  usa a configuração salva localmente naquele navegador (ou os padrões de
  fábrica) — nunca trava por causa disso.
- A TV só aplica uma configuração nova quando a página for recarregada (F5)
  ou o app/navegador for reiniciado — não há polling automático em segundo
  plano enquanto ela já está rodando (decisão deliberada, ver
  `docs/decisoes-arquitetura.md`).
- Se duas pessoas mudarem a configuração quase ao mesmo tempo em navegadores
  diferentes, a última a gravar vence por inteiro (não há mesclagem campo a
  campo) — mesmo comportamento do `dados/admin-overrides.json`.
