# Pasta `/fotos/` — Galeria "O que vem por aí"

Esta pasta alimenta os slides de fotos que aparecem intercalados entre os
indicadores na **Gestão à Vista** (apresentação em tela cheia).

## Como usar (não precisa saber programar)

1. Arraste uma ou mais fotos (`.jpg`, `.jpeg`, `.png` ou `.webp`) para dentro
   desta pasta, pelo site do GitHub ou pelo GitHub Desktop.
2. Faça o commit (salvar) normalmente.
3. Pronto. Em até 1-2 minutos, o arquivo `manifest.json` desta pasta é
   atualizado sozinho por uma automação (GitHub Action) e a foto passa a
   aparecer na apresentação.
4. Para remover uma foto, é só apagar o arquivo da pasta e commitar — ela some
   da apresentação automaticamente na próxima atualização do manifest.

**Nunca edite `manifest.json` manualmente.** Ele é gerado e sobrescrito
automaticamente. Se você editar e a Action rodar de novo, sua edição é
substituída pelo conteúdo real da pasta.

## Se a foto não aparecer

- Confirme que a extensão é `.jpg`, `.jpeg`, `.png` ou `.webp` (outros
  formatos são ignorados).
- Veja a aba **Actions** do repositório no GitHub — deve haver uma execução
  recente do workflow "Gerar manifest de fotos" com um ✓ verde. Se estiver
  vermelho (✗), abra a execução para ver o erro.
- Se a aba Actions nunca rodou nada, as GitHub Actions podem estar
  desativadas neste repositório — veja o passo a passo em
  `docs/habilitar-github-actions.md` no projeto de desenvolvimento, ou peça
  para reativar em Settings → Actions → General.

## Formato do manifest (referência técnica)

`manifest.json` é uma lista simples de nomes de arquivo, por exemplo:

```json
["evento-lancamento.jpg", "obra-shopping-centro.png"]
```

O dashboard usa o nome do arquivo apenas para exibir a imagem — não é preciso
legenda, já que as fotos aqui são majoritariamente cards de divulgação de
eventos que já trazem o próprio texto.
