# Atualização automática dos indicadores (dados/indicadores.csv)

Todo mês, em vez de pedir pro Claude editar o código à mão, basta subir aqui
a planilha atualizada — uma GitHub Action lê o arquivo, casa cada linha com
os indicadores do dashboard, e aplica os meses novos sozinha.

## Como atualizar todo mês

1. Abra `Planilha Geral de Indicadores (FR 15 01).xlsx` no Excel, normalmente.
2. Preencha as células em branco do mês mais recente na aba **"Indicadores"**
   (é a aba oficial — as outras são rascunho/backup e não devem ser usadas).
3. Com a aba "Indicadores" selecionada: **Arquivo → Salvar Como → CSV
   (Delimitado por vírgula) (*.csv)** — escolha só essa aba, não a planilha
   inteira. Se o Excel perguntar, confirme "manter apenas a planilha ativa".
4. No site do GitHub, vá em `dados/indicadores.csv` e clique no ícone de
   lápis (editar) ou em **Add file → Upload files**, substituindo o arquivo
   existente pelo que você acabou de exportar. Comite direto na `main`.
5. Pronto. Em 1-2 minutos, a aba **Actions** do repositório mostra uma
   execução chamada **"Atualizar indicadores"** rodando e terminando com ✓
   verde. O arquivo `dados/indicadores-valores.json` é atualizado sozinho, e
   o dashboard aplica os meses novos na próxima vez que a página carregar.

## Como conferir se deu tudo certo

Depois que a Action rodar, abra `dados/ultima-atualizacao.md` no
repositório — é um resumo automático dizendo quantos indicadores ganharam
mês novo, e alertando dois tipos de coisa que **não** são aplicadas
sozinhas (ficam de fora, sem risco de entrar errado):

- **Linhas da planilha sem indicador correspondente no dashboard** — nome
  digitado diferente do que está cadastrado, ou indicador realmente novo
  (nesse caso, precisa ser criado manualmente pela tela de Administração,
  ou peça pro Claude cadastrar).
- **Células com formato não reconhecido** — quando uma célula tem algo que
  não é número/percentual/hora reconhecível (ex.: uma data, ou texto solto),
  a Action não arrisca aplicar "no palpite" e deixa de fora, sinalizando aqui
  para preenchimento manual pela tela de Administração (ou peça pro Claude
  aplicar). Obs.: os indicadores "Relatório mensal ao CEO" (que usavam datas)
  foram descontinuados e removidos do dashboard em 2026-07-13.

## O que a Action NUNCA faz sozinha

- **Nunca sobrescreve um mês que já tem valor** — só preenche células que
  ainda estavam em branco. Mesmo que você suba a planilha errada ou repita
  um mês antigo, nada que já está no ar pode ser substituído por engano.
- **Nunca cria nem remove indicador** — se um indicador some da planilha ou
  aparece um novo, isso continua sendo decisão manual (do jeito que fizemos
  em 2026-07-06, removendo 19 indicadores descontinuados).
- **Não altera meta, unidade ou qualquer outro campo** — só os valores
  mensais (JAN-DEZ).

## Por que não usar a API do GitHub em runtime

Mesma razão do `fotos/manifest.json` e do `config/pres-config.json`: a API
REST do GitHub tem limite de 60 requisições/hora sem autenticação, arriscado
numa TV ligada o dia todo. O dashboard só busca
`dados/indicadores-valores.json` — um arquivo estático, na mesma origem do
site, sem limite de requisições e sem precisar de token nenhum.

## `dados/admin-overrides.json` — sincronização das edições do Admin (2026-07-13)

Arquivo diferente do `indicadores-valores.json` acima (esse é sobre a
planilha mensal). Este guarda o estado completo de qualquer indicador
criado, editado ou excluído pela tela de **Administração**, em qualquer
computador/TV — para que essas ações passem a valer em todos os telões
automaticamente, sem precisar exportar/importar backup na mão.

- **Leitura:** igual aos outros arquivos desta pasta — fetch estático, sem
  token, sem limite de requisições.
- **Escrita:** aqui SIM precisa de autenticação, porque é o navegador quem
  grava direto no repositório via API do GitHub. Configure em
  **Administração → 🔄 Sincronização entre TVs**, colando um token
  "fine-grained" (github.com → Settings → Developer settings → Fine-grained
  tokens) restrito a **este repositório**, só com permissão **Contents: Read
  and write**. O token fica salvo apenas no `localStorage` daquele
  navegador — nunca é commitado nem exposto em nenhum outro lugar.
- Sem token configurado, o Admin continua funcionando exatamente como antes
  (mudança fica só naquele navegador) — a sincronização é 100% opcional.
- Cada entrada em `rows` é a foto inteira daquele indicador (ou
  `{"deleted": true}` para exclusões) — não um diff de campo. Criar, editar
  metadados e lançar valores mensais usam o mesmo mecanismo: gravar a versão
  atual da linha inteira. Se duas pessoas editarem o MESMO indicador quase ao
  mesmo tempo em navegadores diferentes, a última a salvar vence.

## Por que não tem revisão (Pull Request) antes de aplicar

Por decisão do usuário: como a mesma matriz é sempre reaproveitada mês a mês
e só as células em branco são preenchidas, uma revisão não pegaria um erro
de digitação que a própria pessoa não percebeu ao preencher. Em vez de
revisão manual, a proteção é: só preenche o que está em branco, nunca cria
indicador sozinha, e qualquer coisa ambígua (nome sem correspondência exata,
célula em formato não numérico) fica de fora e é sinalizada em
`ultima-atualizacao.md`, em vez de aplicada "no melhor palpite".
