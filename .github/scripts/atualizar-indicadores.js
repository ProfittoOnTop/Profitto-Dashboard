#!/usr/bin/env node
// Lê dados/indicadores.csv (exportado da aba "Indicadores" da planilha real,
// FR 15 01), casa cada linha com os indicadores já existentes em index.html
// por indicador+responsável / indicador+setor / indicador único (mesma
// prioridade do importador antigo do dashboard), e gera dados/indicadores-valores.json
// só com os MESES QUE AINDA ESTAVAM EM BRANCO — nunca sobrescreve um valor
// já gravado, nunca cria/remove indicador. Ver dados/README.md.
//
// Roda dentro da GitHub Action (.github/workflows/atualizar-indicadores.yml),
// sem dependências externas (só Node built-in).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CSV_PATH = path.join(ROOT, 'dados', 'indicadores.csv');
const HTML_PATH = path.join(ROOT, 'index.html');
const OUT_JSON = path.join(ROOT, 'dados', 'indicadores-valores.json');
const OUT_LOG = path.join(ROOT, 'dados', 'ultima-atualizacao.md');

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MONTH_ALIASES = {
  'jan':'JAN','janeiro':'JAN','jan.':'JAN',
  'fev':'FEV','fevereiro':'FEV','feb':'FEV','fev.':'FEV',
  'mar':'MAR','março':'MAR','marco':'MAR','mar.':'MAR',
  'abr':'ABR','abril':'ABR','apr':'ABR','abr.':'ABR',
  'mai':'MAI','maio':'MAI','may':'MAI','mai.':'MAI',
  'jun':'JUN','junho':'JUN','jun.':'JUN',
  'jul':'JUL','julho':'JUL','jul.':'JUL',
  'ago':'AGO','agosto':'AGO','aug':'AGO','ago.':'AGO',
  'set':'SET','setembro':'SET','sep':'SET','set.':'SET',
  'out':'OUT','outubro':'OUT','oct':'OUT','out.':'OUT',
  'nov':'NOV','novembro':'NOV','nov.':'NOV',
  'dez':'DEZ','dezembro':'DEZ','dec':'DEZ','dez.':'DEZ',
};

function normalizeKey(s) {
  return String(s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Distância de Levenshtein simples, só usada pra sugerir "quase-matches" no log.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// O Excel em português normalmente salva "CSV (Comma delimited)" em
// Windows-1252/ANSI, sem BOM (só a opção "CSV UTF-8" salva em UTF-8) — sem
// isso, acentos (ç, ã, õ...) viram lixo e quebram o casamento por nome.
function readCSVText(csvPath) {
  const buf = fs.readFileSync(csvPath);
  const hasBOM = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  return hasBOM ? buf.slice(3).toString('utf8') : buf.toString('latin1');
}

function parseCSVRows(text) {
  const clean = text.replace(/\r/g, '');
  const lines = clean.split('\n').filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  return lines.map(line => line.split(sep).map(v => v.trim().replace(/^"|"$/g, '')));
}

// A aba "Indicadores" tem uma linha de título (ex.: "FR 15 01 - R00 | ...")
// antes do cabeçalho de verdade — procura a primeira linha que pareça
// mesmo um cabeçalho (tem uma coluna reconhecível como "indicador").
function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const norm = rows[i].map(normalizeKey);
    if (norm.some(c => ['indicador', 'indicadores'].includes(c))) return i;
  }
  return 0;
}

function parseCellValue(raw, existingValues) {
  const text = String(raw ?? '').trim();
  if (!text) return { skip: true };
  const lower = text.toLowerCase();
  if (lower === 'n/a' || lower === 'na' || lower === '-') return { skip: true };

  // Se os valores já gravados desse indicador são texto (ex.: "ok"/"nok"),
  // mantém a mesma convenção — não tenta converter pra número.
  const existingIsString = Object.values(existingValues || {}).some(v => typeof v === 'string');
  if (existingIsString) return { value: text };

  // Duração "H:MM" ou "HH:MM" (ex.: Academia CEO) — o dashboard guarda como
  // horas decimais (4:30 → 4.5), não como fração de dia. Usar (hh+mm/60)/24
  // (a convenção interna do Excel para células de hora) faz o valor virar
  // ~40x menor que a meta e o indicador aparecer sempre "abaixo da meta"
  // mesmo quando a meta quase sempre é batida — bug real encontrado e
  // corrigido em 2026-07-07.
  const timeMatch = text.match(/^(\d{1,3}):(\d{2})$/);
  if (timeMatch) {
    const hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    return { value: +(hh + mm / 60).toFixed(2) };
  }

  // Percentual "75%" / "6,38%" — dashboard guarda como fração (0.75, 0.0638).
  // Exige a célula inteira no formato número+%, não só terminar com "%".
  if (/^-?\d+([.,]\d+)?%$/.test(text)) {
    const n = parseFloat(text.slice(0, -1).replace(',', '.'));
    return isNaN(n) ? { skip: true, flagUnrecognized: true } : { value: n / 100 };
  }

  // Número simples — só aceita se a célula INTEIRA for um número (vírgula ou
  // ponto decimal). Datas exportadas pelo Excel podem vir em formatos bem
  // variados ("1-Jun", "30/jan", "01/06/2026" — depende de config regional),
  // e um parseFloat "parcial" combinaria com qualquer um desses e devolveria
  // um número plausível só que errado (ex.: "1-Jun" → 1). Em vez de tentar
  // adivinhar todo formato de data possível, qualquer coisa que sobre depois
  // do número é motivo pra sinalizar em vez de aplicar.
  if (/^-?\d+([.,]\d+)?$/.test(text)) {
    const n = parseFloat(text.replace(',', '.'));
    return isNaN(n) ? { skip: true, flagUnrecognized: true } : { value: n };
  }

  return { skip: true, flagUnrecognized: true };
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.log('dados/indicadores.csv não encontrado — nada a fazer.');
    return;
  }

  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const htmlMatch = html.match(/const DEFAULT_DATA = (\[[\s\S]*?\]);/);
  if (!htmlMatch) throw new Error('DEFAULT_DATA não encontrado em index.html');
  const DATA = JSON.parse(htmlMatch[1]);

  const rawRows = parseCSVRows(readCSVText(CSV_PATH));
  if (!rawRows.length) { console.log('CSV vazio.'); return; }
  const headerIdx = findHeaderRowIndex(rawRows);
  const headers = rawRows[headerIdx];
  const dataRows = rawRows.slice(headerIdx + 1).filter(r => r.some(c => c !== ''));

  const monthCols = {}; // { colIndex → MES }
  headers.forEach((h, i) => {
    const alias = MONTH_ALIASES[normalizeKey(h)];
    if (alias) monthCols[i] = alias;
  });

  const indColIdx = headers.findIndex(h => ['indicador', 'indicadores'].includes(normalizeKey(h)));
  const respColIdx = headers.findIndex(h => ['responsavel', 'resp', 'responsible'].includes(normalizeKey(h)));
  // "SETOR" na planilha é o que corresponde ao campo "processo" do dashboard —
  // a coluna "PROCESSO" da planilha (valores tipo GPR/VENDAS/OBJETIVO) é um
  // nível hierárquico diferente e não corresponde a nada no dashboard.
  const setorColIdx = headers.findIndex(h => normalizeKey(h) === 'setor');

  if (indColIdx === -1) throw new Error('Coluna "Indicador" não encontrada no CSV.');

  const mapByIndResp = {}, mapByIndProc = {}, mapByInd = {}, indCounts = {};
  DATA.forEach(d => {
    const ki = normalizeKey(d.indicador), kr = normalizeKey(d.resp || ''), kp = normalizeKey(d.processo || '');
    mapByIndResp[ki + '||' + kr] = d;
    mapByIndProc[ki + '||' + kp] = d;
    mapByInd[ki] = d;
    indCounts[ki] = (indCounts[ki] || 0) + 1;
  });

  const patch = [];
  const matchedLog = [];
  const unmatchedLog = [];
  const flaggedLog = [];

  dataRows.forEach(row => {
    const nomeIndicador = row[indColIdx] || '';
    if (!nomeIndicador.trim()) return;
    const resp = respColIdx !== -1 ? row[respColIdx] || '' : '';
    const setor = setorColIdx !== -1 ? row[setorColIdx] || '' : '';

    const ki = normalizeKey(nomeIndicador), kr = normalizeKey(resp), ks = normalizeKey(setor);
    let found = mapByIndResp[ki + '||' + kr]
      || mapByIndProc[ki + '||' + ks]
      || (indCounts[ki] === 1 ? mapByInd[ki] : null);

    if (!found) {
      // sugere o quase-match mais próximo (só pro log, nunca aplicado)
      let melhor = null, melhorDist = Infinity;
      DATA.forEach(d => {
        if (normalizeKey(d.resp || '') !== kr) return;
        const dist = levenshtein(ki, normalizeKey(d.indicador));
        if (dist < melhorDist) { melhorDist = dist; melhor = d; }
      });
      unmatchedLog.push({ nomeIndicador, resp, setor, sugestao: melhorDist <= 6 ? melhor : null, dist: melhorDist });
      return;
    }

    const fills = {};
    const flags = [];
    Object.entries(monthCols).forEach(([colIdx, mes]) => {
      if (found.values && found.values[mes] !== undefined) return; // já preenchido, nunca sobrescreve
      const raw = row[colIdx];
      const parsed = parseCellValue(raw, found.values);
      if (parsed.skip) {
        if (parsed.flagUnrecognized) flags.push(`${mes}: formato não reconhecido "${raw}" — preencher manualmente`);
        return;
      }
      fills[mes] = parsed.value;
    });

    if (Object.keys(fills).length) patch.push({ id: found.id, values: fills });
    matchedLog.push({ id: found.id, indicador: found.indicador, resp: found.resp, novosMeses: Object.keys(fills) });
    if (flags.length) flaggedLog.push({ id: found.id, indicador: found.indicador, resp: found.resp, flags });
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(patch, null, 2));

  const dataHora = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const linhas = [
    '# Última atualização automática de indicadores',
    '',
    `Gerado em ${dataHora} pela Action "Atualizar indicadores" a partir de dados/indicadores.csv.`,
    '',
    `**${matchedLog.filter(m => m.novosMeses.length).length}** indicadores ganharam mês(es) novo(s).`,
    `**${unmatchedLog.length}** linhas da planilha não bateram com nenhum indicador do dashboard.`,
    `**${flaggedLog.length}** indicadores tiveram alguma célula não aplicada automaticamente (data ou formato não reconhecido).`,
    '',
  ];
  if (matchedLog.some(m => m.novosMeses.length)) {
    linhas.push('## Meses aplicados');
    matchedLog.filter(m => m.novosMeses.length).forEach(m => {
      linhas.push(`- **${m.indicador}** (${m.resp}, id ${m.id}): ${m.novosMeses.join(', ')}`);
    });
    linhas.push('');
  }
  if (flaggedLog.length) {
    linhas.push('## Precisam de atenção manual (data ou formato não reconhecido)');
    flaggedLog.forEach(f => {
      linhas.push(`- **${f.indicador}** (${f.resp}, id ${f.id}): ${f.flags.join('; ')}`);
    });
    linhas.push('');
  }
  if (unmatchedLog.length) {
    linhas.push('## Linhas da planilha sem indicador correspondente no dashboard');
    unmatchedLog.forEach(u => {
      const sugestaoTxt = u.sugestao ? ` — talvez seja "${u.sugestao.indicador}" (id ${u.sugestao.id})? distância ${u.dist}` : '';
      linhas.push(`- "${u.nomeIndicador}" (${u.resp} / ${u.setor})${sugestaoTxt}`);
    });
    linhas.push('');
  }
  fs.writeFileSync(OUT_LOG, linhas.join('\n'));

  console.log(linhas.join('\n'));
}

main();
