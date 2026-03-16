// Lê sempre em tempo de chamada para refletir o que o usuário salvou em Perfil.
// Fallback para variáveis de ambiente (definidas no .env).
const getConfig = () => {
  try {
    const s = JSON.parse(localStorage.getItem("fintrack_settings") || "{}");
    return {
      scriptUrl: s.apiUrl  || import.meta.env.VITE_API_URL  || "",
      token:     s.apiToken || import.meta.env.VITE_API_TOKEN || "",
    };
  } catch {
    return {
      scriptUrl: import.meta.env.VITE_API_URL  || "",
      token:     import.meta.env.VITE_API_TOKEN || "",
    };
  }
};

/**
 * GET all data, optionally filtered.
 * Sem custom headers → sem preflight CORS.
 * Token via query param (Code.gs lê de e.parameter.token).
 */
export const fetchData = async (params = {}) => {
  const { scriptUrl, token } = getConfig();
  const searchParams = new URLSearchParams({ token });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, v);
  });
  const fetchUrl = `${scriptUrl}?${searchParams.toString()}`;

  console.log(
    "[sheets.fetchData] fetchUrl=",
    fetchUrl,
    "params=",
    params,
    "tokenPresent=",
    Boolean(token),
  );
  const res = await fetch(fetchUrl, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[sheets.fetchData] non-ok response", res.status, text);
    throw new Error(`API error: ${res.status} ${text}`);
  }
  const json = await res.json().catch((err) => {
    console.error("[sheets.fetchData] invalid json", err);
    throw err;
  });
  return json;
};

/**
 * POST action. Usa Content-Type: text/plain para não disparar preflight.
 * Token incluído no body e como query param.
 * Apps Script lê e.postData.contents independente do Content-Type.
 */
export const postAction = async (action, data) => {
  const { scriptUrl, token } = getConfig();
  const fetchUrl = `${scriptUrl}?token=${token}`;

  console.log(
    "[sheets.postAction] action=",
    action,
    "fetchUrl=",
    fetchUrl,
    "data=",
    data,
    "tokenPresent=",
    Boolean(token),
  );
  const res = await fetch(fetchUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, data, token }),
  }).catch((err) => {
    console.error("[sheets.postAction] fetch failed", err);
    throw err;
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[sheets.postAction] non-ok response", res.status, text);
    throw new Error(`API error: ${res.status} ${text}`);
  }

  const text = await res.text().catch(() => "");
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("[sheets.postAction] invalid json response", text, err);
    throw err;
  }

  if (json.status === "error") {
    console.error("[sheets.postAction] api error payload", json);
    throw new Error(json.message || "API error");
  }

  console.log("[sheets.postAction] success", json);
  return json;
};

export const addTransaction  = (data) => postAction("add_transaction", data);
export const addFixed        = (data) => postAction("add_fixed", data);
export const toggleFixed     = (data) => postAction("toggle_fixed", data);
export const addRendimento   = (data) => postAction("add_rendimento", data);
export const addMeta         = (data) => postAction("add_meta", data);
export const addCrypto       = (data) => postAction("add_crypto", data);
export const updateWallet    = (data) => postAction("update_wallet", data);
export const transfer        = (data) => postAction("transfer", data);
