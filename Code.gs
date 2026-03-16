// ============================================================
// FinTrack — Google Apps Script (Code.gs)
// Backend completo para o PWA de finanças pessoais
// ============================================================
// COMO PUBLICAR:
// 1. Cole este código em Extensões > Apps Script da sua planilha
// 2. Clique em Implantar > Nova implantação
// 3. Tipo: App da Web | Executar como: Eu | Acesso: Qualquer pessoa
// 4. Copie a URL gerada e cole no SPEC.md / no app
// ============================================================

const API_TOKEN = "fintrack2026";
const SHEET_NAMES = {
  TRANSACTIONS: "Transacoes",
  FIXED: "FIXOS",
  WALLETS: "Carteiras",
  RENDIMENTOS: "Rendimentos",
  METAS: "Metas",
  CRYPTO: "Crypto",
  BACKUP_LOG: "BackupLog",
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================

function validateToken(e) {
  const headers = e.headers || {};
  const body = e.postData ? JSON.parse(e.postData.contents || "{}") : {};
  const token =
    headers["X-API-Token"] || headers["x-api-token"] || body.token || "";
  return token === API_TOKEN;
}

// ============================================================
// INICIALIZAÇÃO DAS ABAS
// ============================================================

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEET_NAMES.TRANSACTIONS]: [
      "id",
      "data_hora",
      "valor",
      "tipo_fluxo",
      "categoria",
      "subcategoria",
      "descricao",
      "metodo_pagamento",
      "carteira_id",
      "tags",
    ],
    [SHEET_NAMES.FIXED]: [
      "id",
      "nome",
      "valor",
      "tipo_fluxo",
      "categoria",
      "subcategoria",
      "dia_vencimento",
      "metodo_pagamento",
      "carteira_id",
      "ativo",
      "data_inicio",
      "observacao",
    ],
    [SHEET_NAMES.WALLETS]: [
      "id",
      "nome",
      "cor",
      "tipo",
      "cdi_percentual",
      "saldo_inicial",
      "data_criacao",
      "ativo",
      "cdb",
      "conta_corrente",
      "fatura_cartao",
    ],
    [SHEET_NAMES.RENDIMENTOS]: [
      "id",
      "carteira_id",
      "mes",
      "ano",
      "valor_rendido",
      "saldo_final",
      "cdi_vigente",
    ],
    [SHEET_NAMES.METAS]: [
      "id",
      "nome",
      "valor_alvo",
      "valor_atual",
      "prazo",
      "carteira_id",
      "ativo",
      "data_criacao",
    ],
    [SHEET_NAMES.CRYPTO]: [
      "id",
      "simbolo",
      "nome",
      "quantidade",
      "preco_entrada",
      "data_compra",
      "carteira_id",
      "ativo",
    ],
  };

  for (const [name, headers] of Object.entries(schemas)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet
        .getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#f3f3f3");
    }
  }

  // Popula carteiras iniciais se vazia
  const walletsSheet = ss.getSheetByName(SHEET_NAMES.WALLETS);
  if (walletsSheet.getLastRow() <= 1) {
    const today = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy",
    );
    const initialWallets = [
      ["99pay",   "99Pay",          "#7f77dd", "cdi",    100, 0, today, true,  0, 0, 0],
      ["c6bank",  "C6Bank",         "#1d9e75", "cdi",    103, 0, today, true,  0, 0, 0],
      ["fisico",  "Dinheiro físico","#ef9f27", "fisico", "",  0, today, true,  0, 0, 0],
      ["crypto",  "Crypto",         "#378add", "crypto", "",  0, today, false, 0, 0, 0],
      ["geral",   "Geral",          "#888780", "fisico", "",  0, today, true,  0, 0, 0],
    ];
    walletsSheet
      .getRange(2, 1, initialWallets.length, 11)
      .setValues(initialWallets);
  }

  return "Abas inicializadas com sucesso!";
}

// ============================================================
// HELPERS
// ============================================================

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    initSheets();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return data.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function generateId(prefix) {
  const now = new Date();
  const ts = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "yyyyMMddHHmmss",
  );
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}_${ts}_${rand}`;
}

function formatDateTime(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "dd/MM/yyyy - HH:mm:ss",
  );
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ============================================================
// GET — Leitura de dados
// ============================================================

function doGet(e) {
  try {
    const params = e.parameter || {};
    const sheet = params.sheet;
    const mes = params.mes ? parseInt(params.mes) : null;
    const ano = params.ano ? parseInt(params.ano) : null;
    const carteira = params.carteira || null;

    if (sheet === SHEET_NAMES.TRANSACTIONS) {
      return jsonResponse({
        transactions: getTransactions(mes, ano, carteira),
      });
    }

    // Retorna tudo
    const result = {
      transactions: getTransactions(mes, ano, carteira),
      fixed: sheetToObjects(getSheet(SHEET_NAMES.FIXED)),
      wallets: sheetToObjects(getSheet(SHEET_NAMES.WALLETS)),
      rendimentos: sheetToObjects(getSheet(SHEET_NAMES.RENDIMENTOS)),
      metas: sheetToObjects(getSheet(SHEET_NAMES.METAS)),
      crypto: sheetToObjects(getSheet(SHEET_NAMES.CRYPTO)),
    };

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function getTransactions(mes, ano, carteira) {
  const all = sheetToObjects(getSheet(SHEET_NAMES.TRANSACTIONS));

  return all.filter((t) => {
    if (carteira && t.carteira_id !== carteira) return false;
    if (mes || ano) {
      const dateParts = t.data_hora.split(" ")[0].split("/");
      const tMes = parseInt(dateParts[1]);
      const tAno = parseInt(dateParts[2]);
      if (mes && tMes !== mes) return false;
      if (ano && tAno !== ano) return false;
    }
    return true;
  });
}

// ============================================================
// POST — Escrita de dados
// ============================================================

function doPost(e) {
  try {
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    // Aceita token no header, no body, ou libera se chamada interna (sem postData)
    const headers = e.headers || {};
    const params = e.parameter || {};
    const token =
      headers["X-API-Token"] ||
      headers["x-api-token"] ||
      body.token ||
      params.token ||
      "";

    // Logging for debugging invalid token issues
    try {
      Logger.log("doPost.headers=%s", JSON.stringify(headers));
    } catch (err) {
      Logger.log("doPost.headers error");
    }
    try {
      Logger.log("doPost.body=%s", JSON.stringify(body));
    } catch (err) {
      Logger.log("doPost.body error");
    }
    try {
      Logger.log("doPost.params=%s", JSON.stringify(params));
    } catch (err) {
      Logger.log("doPost.params error");
    }
    Logger.log("doPost.tokenPresent=%s tokenValue=%s", Boolean(token), token);
    Logger.log("doPost.tokenValid=%s", token === API_TOKEN);

    if (e.postData && token !== API_TOKEN) {
      Logger.log("doPost: token inválido - rejecting");
      return jsonResponse({ status: "error", message: "Token inválido" });
    }

    const action = body.action;
    const data = body.data;

    switch (action) {
      case "add_transaction":
        return jsonResponse(addTransaction(data));
      case "add_fixed":
        return jsonResponse(addFixed(data));
      case "add_rendimento":
        return jsonResponse(addRendimento(data));
      case "add_meta":
        return jsonResponse(addMeta(data));
      case "add_crypto":
        return jsonResponse(addCrypto(data));
      case "update_wallet":
        return jsonResponse(updateWallet(data));
      case "transfer":
        return jsonResponse(addTransfer(data));
      case "update_meta":
        return jsonResponse(updateMeta(data));
      case "toggle_fixed":
        return jsonResponse(toggleFixed(data));
      case "migrate":
        return jsonResponse(migrateOldData());
      case "backup_drive":
        return jsonResponse(createMonthlyBackup());
      case "init":
        return jsonResponse({ status: "success", message: initSheets() });
      default:
        return jsonResponse({
          status: "error",
          message: "Ação desconhecida: " + action,
        });
    }
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ============================================================
// AÇÕES DE ESCRITA
// ============================================================

function addTransaction(data) {
  const sheet = getSheet(SHEET_NAMES.TRANSACTIONS);
  const now = new Date(data.date || new Date());
  const id = data.id || generateId("txn");

  const row = [
    id,
    formatDateTime(now),
    parseFloat(data.valor) || 0,
    data.tipo_fluxo || "saida",
    data.categoria || "",
    data.subcategoria || "",
    data.descricao || "",
    data.metodo_pagamento || "pix",
    data.carteira_id || "geral",
    data.tags || "",
  ];

  sheet.appendRow(row);

  // Se é gasto fixo, adiciona também na aba FIXOS
  if (data.is_fixed) {
    addFixed({
      id: "fix_" + id,
      nome: data.descricao || data.categoria,
      valor: data.valor,
      tipo_fluxo: data.tipo_fluxo,
      categoria: data.categoria,
      subcategoria: data.subcategoria,
      dia_vencimento: now.getDate(),
      metodo_pagamento: data.metodo_pagamento || "pix",
      carteira_id: data.carteira_id || "geral",
      ativo: true,
      data_inicio: Utilities.formatDate(
        now,
        Session.getScriptTimeZone(),
        "dd/MM/yyyy",
      ),
      observacao: "",
    });
  }

  return { status: "success", id };
}

function addFixed(data) {
  const sheet = getSheet(SHEET_NAMES.FIXED);
  const id = data.id || generateId("fix");

  const row = [
    id,
    data.nome || "",
    parseFloat(data.valor) || 0,
    data.tipo_fluxo || "saida",
    data.categoria || "",
    data.subcategoria || "",
    parseInt(data.dia_vencimento) || 1,
    data.metodo_pagamento || "pix",
    data.carteira_id || "geral",
    data.ativo !== false,
    data.data_inicio ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy",
      ),
    data.observacao || "",
  ];

  sheet.appendRow(row);
  return { status: "success", id };
}

function addRendimento(data) {
  const sheet = getSheet(SHEET_NAMES.RENDIMENTOS);
  const id =
    data.id ||
    `rend_${data.carteira_id}_${String(data.mes).padStart(2, "0")}${data.ano}`;

  // Verifica se já existe rendimento para esse mês/carteira
  const existing = sheetToObjects(sheet).find(
    (r) =>
      r.carteira_id === data.carteira_id &&
      parseInt(r.mes) === parseInt(data.mes) &&
      parseInt(r.ano) === parseInt(data.ano),
  );

  if (existing) {
    // Atualiza linha existente
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (
        allData[i][1] === data.carteira_id &&
        parseInt(allData[i][2]) === parseInt(data.mes) &&
        parseInt(allData[i][3]) === parseInt(data.ano)
      ) {
        sheet.getRange(i + 1, 5).setValue(parseFloat(data.valor_rendido) || 0);
        sheet.getRange(i + 1, 6).setValue(parseFloat(data.saldo_final) || 0);
        sheet.getRange(i + 1, 7).setValue(parseFloat(data.cdi_vigente) || 0);
        break;
      }
    }
    return { status: "success", id: existing.id, updated: true };
  }

  const row = [
    id,
    data.carteira_id,
    parseInt(data.mes),
    parseInt(data.ano),
    parseFloat(data.valor_rendido) || 0,
    parseFloat(data.saldo_final) || 0,
    parseFloat(data.cdi_vigente) || 0,
  ];

  sheet.appendRow(row);
  return { status: "success", id };
}

function addMeta(data) {
  const sheet = getSheet(SHEET_NAMES.METAS);
  const id = data.id || generateId("meta");
  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy",
  );

  const row = [
    id,
    data.nome || "",
    parseFloat(data.valor_alvo) || 0,
    parseFloat(data.valor_atual) || 0,
    data.prazo || "",
    data.carteira_id || "",
    data.ativo !== false,
    today,
  ];

  sheet.appendRow(row);
  return { status: "success", id };
}

function updateMeta(data) {
  const sheet = getSheet(SHEET_NAMES.METAS);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      if (data.valor_atual !== undefined)
        sheet.getRange(i + 1, 4).setValue(parseFloat(data.valor_atual));
      if (data.ativo !== undefined)
        sheet.getRange(i + 1, 7).setValue(data.ativo);
      return { status: "success" };
    }
  }
  return { status: "error", message: "Meta não encontrada" };
}

function addCrypto(data) {
  const sheet = getSheet(SHEET_NAMES.CRYPTO);
  const id = data.id || generateId("crypto");
  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy",
  );

  const row = [
    id,
    (data.simbolo || "").toUpperCase(),
    data.nome || "",
    parseFloat(data.quantidade) || 0,
    parseFloat(data.preco_entrada) || 0,
    data.data_compra || today,
    "crypto",
    data.ativo !== false,
  ];

  sheet.appendRow(row);
  return { status: "success", id };
}

function updateWallet(data) {
  const sheet = getSheet(SHEET_NAMES.WALLETS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      // Save every field present in data (except id) using dynamic header lookup
      Object.entries(data).forEach(function(entry) {
        const key = entry[0];
        const value = entry[1];
        if (key === "id") return;
        const col = headers.indexOf(key) + 1;
        if (col > 0) {
          const numericFields = ["saldo_inicial", "cdi_percentual", "cdb", "conta_corrente", "fatura_cartao"];
          sheet.getRange(i + 1, col).setValue(
            numericFields.indexOf(key) >= 0 ? parseFloat(value) || 0 : value
          );
        }
      });
      return { status: "success" };
    }
  }
  return { status: "error", message: "Carteira não encontrada" };
}

// Adiciona colunas extras na aba Carteiras (rodar uma vez se a planilha já existia)
function addC6Columns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.WALLETS);
  if (!sheet) { Logger.log("Aba Carteiras não encontrada"); return; }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const cols = ["cdb", "conta_corrente", "fatura_cartao"];
  cols.forEach(function(col) {
    if (headers.indexOf(col) < 0) {
      const nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue(col).setFontWeight("bold").setBackground("#f3f3f3");
      // Preenche 0 em todas as linhas existentes
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, nextCol, sheet.getLastRow() - 1, 1).setValue(0);
      }
    }
  });
  Logger.log("Colunas adicionadas: " + cols.join(", "));
}

function addTransfer(data) {
  const now = new Date();

  // Registra saída na carteira origem
  addTransaction({
    valor: data.valor,
    tipo_fluxo: "saida",
    categoria: "Patrimônio",
    subcategoria: "Transferência entre carteiras",
    descricao: `Transferência para ${data.para}`,
    metodo_pagamento: "transferencia",
    carteira_id: data.de,
    tags: "transferencia",
    date: now.toISOString(),
  });

  // Registra entrada na carteira destino
  addTransaction({
    valor: data.valor,
    tipo_fluxo: "entrada",
    categoria: "Patrimônio",
    subcategoria: "Transferência entre carteiras",
    descricao: `Transferência de ${data.de}`,
    metodo_pagamento: "transferencia",
    carteira_id: data.para,
    tags: "transferencia",
    date: now.toISOString(),
  });

  return {
    status: "success",
    message: `Transferência de R$${data.valor} registrada`,
  };
}

function toggleFixed(data) {
  const sheet = getSheet(SHEET_NAMES.FIXED);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      const currentStatus = allData[i][9];
      sheet.getRange(i + 1, 10).setValue(!currentStatus);
      return { status: "success", ativo: !currentStatus };
    }
  }
  return { status: "error", message: "Fixo não encontrado" };
}

// ============================================================
// RECORRÊNCIA MENSAL (trigger no dia 1 de cada mês)
// ============================================================

function processRecurringTransactions() {
  const sheet = getSheet(SHEET_NAMES.FIXED);
  const txSheet = getSheet(SHEET_NAMES.TRANSACTIONS);

  const fixedItems = sheetToObjects(sheet).filter((f) => f.ativo === true);
  if (fixedItems.length === 0) return;

  const now = new Date();
  const newRows = [];

  fixedItems.forEach((item) => {
    const id = generateId("txn");
    newRows.push([
      id,
      formatDateTime(now),
      parseFloat(item.valor) || 0,
      item.tipo_fluxo,
      item.categoria,
      item.subcategoria,
      `${item.nome} (Recorrente)`,
      item.metodo_pagamento,
      item.carteira_id,
      "recorrente",
    ]);
  });

  if (newRows.length > 0) {
    txSheet
      .getRange(txSheet.getLastRow() + 1, 1, newRows.length, 10)
      .setValues(newRows);
  }

  Logger.log(`Recorrência processada: ${newRows.length} transações lançadas`);
}

// ============================================================
// RESUMO SEMANAL POR EMAIL (trigger toda segunda-feira)
// ============================================================

function sendWeeklyReport() {
  const email = Session.getActiveUser().getEmail();
  if (!email) return;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const transactions = sheetToObjects(getSheet(SHEET_NAMES.TRANSACTIONS));

  // Filtra última semana
  const weekTx = transactions.filter((t) => {
    if (!t.data_hora) return false;
    const parts = t.data_hora.split(" ")[0].split("/");
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date >= weekAgo && date <= now;
  });

  const gastos = weekTx
    .filter((t) => t.tipo_fluxo === "saida")
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

  const entradas = weekTx
    .filter((t) => t.tipo_fluxo === "entrada")
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);

  // Top categoria
  const catTotals = {};
  weekTx
    .filter((t) => t.tipo_fluxo === "saida")
    .forEach((t) => {
      catTotals[t.categoria] =
        (catTotals[t.categoria] || 0) + (parseFloat(t.valor) || 0);
    });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const subject = `FinTrack — Resumo da semana 📊`;
  const body = `
Olá! Aqui está o seu resumo financeiro da semana:

💸 Total gasto: R$${gastos.toFixed(2).replace(".", ",")}
💰 Total recebido: R$${entradas.toFixed(2).replace(".", ",")}
📈 Saldo da semana: R$${(entradas - gastos).toFixed(2).replace(".", ",")}
🏷️ Maior categoria: ${topCat ? `${topCat[0]} (R$${topCat[1].toFixed(2).replace(".", ",")})` : "N/A"}
📝 Transações registradas: ${weekTx.length}

Acesse o FinTrack para ver mais detalhes.
  `.trim();

  MailApp.sendEmail(email, subject, body);
  Logger.log(`Resumo semanal enviado para ${email}`);
}

// ============================================================
// BACKUP AUTOMÁTICO (trigger todo dia 1)
// ============================================================

function createMonthlyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  const monthYear = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "MM-yyyy",
  );
  const backupName = `FinTrack_Backup_${monthYear}`;

  const folder = DriveApp.getRootFolder();
  let backupFolder;

  // Procura ou cria pasta de backups
  const folders = folder.getFoldersByName("FinTrack Backups");
  if (folders.hasNext()) {
    backupFolder = folders.next();
  } else {
    backupFolder = folder.createFolder("FinTrack Backups");
  }

  // Copia a planilha
  const backup = ss.copy(backupName);
  DriveApp.getFileById(backup.getId()).moveTo(backupFolder);

  Logger.log(`Backup criado: ${backupName}`);
  return { status: "success", name: backupName };
}

// ============================================================
// MIGRAÇÃO DOS DADOS ANTIGOS
// ============================================================

function migrateOldData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Primeiro inicializa as novas abas
  initSheets();

  // Tenta ler dados antigos — pode estar na aba "Transacoes" com schema antigo
  const oldSheet =
    ss.getSheetByName("Transacoes_OLD") || ss.getSheetByName("Transacoes");
  if (!oldSheet || oldSheet.getLastRow() < 2) {
    return { status: "error", message: "Nenhum dado antigo encontrado" };
  }

  const oldData = oldSheet
    .getRange(2, 1, oldSheet.getLastRow() - 1, 6)
    .getValues();
  const newSheet = getSheet(SHEET_NAMES.TRANSACTIONS);
  const newRows = [];
  let migratedCount = 0;
  let skippedCount = 0;

  oldData.forEach((row, index) => {
    const [dataHora, valorRaw, tipo, categoria, subcategoria, descricao] = row;

    if (!dataHora || !valorRaw) {
      skippedCount++;
      return;
    }

    // Converte valor de "R$37,00" para 37.0
    let valor = 0;
    if (typeof valorRaw === "string") {
      valor =
        parseFloat(
          valorRaw
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim(),
        ) || 0;
    } else {
      valor = parseFloat(valorRaw) || 0;
    }

    // Normaliza tipo
    const tipoFluxo =
      tipo === "Entrada" || tipo === "entrada" ? "entrada" : "saida";

    // Mapeia categorias antigas para novas
    let novaCat = categoria;
    let novaSub = subcategoria;

    const descLower = (descricao || "").toLowerCase();

    // Remapeia casos especiais
    if (categoria === "Salário") {
      novaCat = "Receita";
      novaSub = "Salário";
    } else if (categoria === "Investimentos" && descLower.includes("aposta")) {
      novaCat = "Apostas e jogos";
      novaSub = "Ganho";
    } else if (
      categoria === "Outros" &&
      subcategoria === "Geral" &&
      descLower.includes("aposta")
    ) {
      novaCat = "Apostas e jogos";
      novaSub = "Ganho";
    } else if (categoria === "Outros" && subcategoria === "Vendas") {
      novaCat = "Receita";
      novaSub = "Freelance e vendas";
    } else if (categoria === "Outros" && subcategoria === "Reembolso") {
      novaCat = "Receita";
      novaSub = "Reembolso";
    } else if (categoria === "Outros") {
      novaCat = "Receita";
      novaSub = "Outros";
    } else if (categoria === "Compras" && subcategoria === "Ferramentas") {
      if (descLower.includes("curso") || descLower.includes("hot")) {
        novaCat = "Educação";
        novaSub = "Cursos";
      } else if (descLower.includes("telegram")) {
        novaCat = "Educação";
        novaSub = "Comunidades";
      }
    } else if (categoria === "Assinaturas" && subcategoria === "Geral") {
      novaCat = "Assinaturas";
      novaSub = "Telecom";
    } else if (categoria === "Transporte" && subcategoria === "Geral") {
      novaCat = "Transporte";
      novaSub = "Pedágio";
    } else if (categoria === "Transporte" && subcategoria === "Uber/Táxi") {
      novaSub = "Uber e 99";
    } else if (categoria === "Saúde" && descLower.includes("psicologo")) {
      novaSub = "Psicólogo";
    } else if (categoria === "Saúde" && descLower.includes("quiro")) {
      novaSub = "Fisio e quiro";
    } else if (categoria === "Lazer" && subcategoria === "Cinema/Eventos") {
      novaSub = "Cinema e eventos";
    } else if (categoria === "Lazer" && subcategoria === "Hobby") {
      if (descLower.includes("futebol")) novaSub = "Futebol e esporte";
      else if (descLower.includes("parque") || descLower.includes("standup"))
        novaSub = "Hobbies";
      else novaSub = "Hobbies";
    }

    const id = `txn_legacy_${String(index + 1).padStart(4, "0")}`;

    newRows.push([
      id,
      dataHora,
      valor,
      tipoFluxo,
      novaCat,
      novaSub,
      descricao || "",
      "pix",
      "geral",
      "migrado",
    ]);

    migratedCount++;
  });

  if (newRows.length > 0) {
    newSheet
      .getRange(newSheet.getLastRow() + 1, 1, newRows.length, 10)
      .setValues(newRows);
  }

  return {
    status: "success",
    migrated: migratedCount,
    skipped: skippedCount,
    message: `Migração concluída: ${migratedCount} transações migradas, ${skippedCount} ignoradas`,
  };
}

// ============================================================
// CONFIGURAR TRIGGERS AUTOMÁTICOS
// ============================================================

function setupTriggers() {
  // Remove triggers existentes para evitar duplicatas
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));

  // Recorrência: todo dia 1 às 08:00
  ScriptApp.newTrigger("processRecurringTransactions")
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();

  // Backup: todo dia 1 às 07:00
  ScriptApp.newTrigger("createMonthlyBackup")
    .timeBased()
    .onMonthDay(1)
    .atHour(7)
    .create();

  // Resumo semanal: toda segunda-feira às 08:00
  ScriptApp.newTrigger("sendWeeklyReport")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();

  Logger.log("Triggers configurados com sucesso!");
  return "Triggers configurados: recorrência mensal, backup e resumo semanal";
}

// ============================================================
// FUNÇÃO DE TESTE (rode manualmente para validar)
// ============================================================

function testAPI() {
  Logger.log("=== Inicializando abas ===");
  Logger.log(initSheets());

  Logger.log("=== Testando addTransaction ===");
  const txResult = addTransaction({
    valor: 35.9,
    tipo_fluxo: "saida",
    categoria: "Alimentação",
    subcategoria: "Restaurante",
    descricao: "Teste de transação",
    metodo_pagamento: "pix",
    carteira_id: "geral",
  });
  Logger.log(JSON.stringify(txResult));

  Logger.log("=== Testando addRendimento ===");
  const rendResult = addRendimento({
    carteira_id: "99pay",
    mes: 3,
    ano: 2026,
    valor_rendido: 45.2,
    saldo_final: 3245.2,
    cdi_vigente: 10.5,
  });
  Logger.log(JSON.stringify(rendResult));

  Logger.log("=== Lendo dados ===");
  const data = sheetToObjects(getSheet(SHEET_NAMES.TRANSACTIONS));
  Logger.log(`Total transações: ${data.length}`);

  Logger.log("=== Todos os testes passaram! ===");
}
