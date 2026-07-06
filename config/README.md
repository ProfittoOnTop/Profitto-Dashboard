# Configuração da Gestão à Vista (config/pres-config.json)

Este arquivo guarda a configuração da apresentação (relógio/contagem
regressiva, duração de cada slide, ordem, filtro de processo, galeria de
fotos) para que **qualquer computador ou TV que abrir o dashboard receba a
mesma configuração**, em vez de cada um guardar a sua própria (que é o
comportamento padrão do navegador, e a razão de o relógio aparecer
diferente em cada máquina).

## Como atualizar

1. Abra o dashboard no seu computador e entre na Administração (senha `1312`).
2. Configure o que quiser na seção **"📺 Gestão à Vista — Configurações"**
   (nome/data/hora do relógio, duração dos slides, fotos etc.) normalmente.
3. Role até **"Sincronizar esta configuração em todas as TVs"** e clique em
   **"⬇ Baixar configuração (pres-config.json)"**. Um arquivo é baixado no
   seu computador.
4. No site do GitHub, abra este arquivo (`config/pres-config.json`) e clique
   no ícone de lápis (editar) — ou arraste o arquivo baixado para dentro
   desta pasta pelo botão "Add file → Upload files", substituindo o
   existente.
5. Comite (salve) a mudança direto na branch `main`.

Pronto — qualquer computador ou TV que abrir (ou recarregar) o dashboard a
partir de agora vai vir com essa mesma configuração.

## Importante

- **Não precisa mexer neste arquivo na mão** — ele é só o que o botão
  "Baixar configuração" já gera pronto; edite pela tela de Administração e
  baixe de novo.
- Se este arquivo não existir ou não puder ser lido, o dashboard simplesmente
  usa a configuração salva localmente naquele navegador (ou os padrões de
  fábrica) — nunca trava por causa disso.
- A TV só aplica uma configuração nova quando a página for recarregada (F5)
  ou o app/navegador for reiniciado — não é necessário nenhuma ação além
  disso, mas também não é automático enquanto ela já está rodando.
