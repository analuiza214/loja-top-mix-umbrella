const https = require("https");

const GA4_MEASUREMENT_ID = "G-LDEVX5SEPE";

function httpsRequest(url, method, data, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getLeadByTransactionId(supabaseUrl, serviceKey, transactionId) {
  const url = `${supabaseUrl}/rest/v1/leads?transaction_id=eq.${encodeURIComponent(transactionId)}&purchase_sent=eq.false&order=created_at.desc&limit=1`;
  const res = await httpsRequest(url, "GET", null, {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
  });
  return Array.isArray(res.body) && res.body.length > 0 ? res.body[0] : null;
}

async function markLeadAsPaid(supabaseUrl, serviceKey, leadId) {
  const url = `${supabaseUrl}/rest/v1/leads?id=eq.${leadId}`;
  await httpsRequest(url, "PATCH", { purchase_sent: true, status: "pago" }, {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Prefer": "return=minimal",
  });
}

async function sendGa4Purchase(apiSecret, lead, transactionId, value) {
  const clientId = lead.ga_client_id || `server.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  const tracking = lead.tracking || {};

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${encodeURIComponent(apiSecret)}`;

  const payload = {
    client_id: clientId,
    events: [{
      name: "purchase",
      params: {
        transaction_id: transactionId,
        currency: "BRL",
        value: parseFloat(value),
        payment_type: "pix",
        ...Object.fromEntries(
          Object.entries(tracking).filter(([, v]) => v !== null && v !== undefined && v !== "")
        ),
        items: [{
          item_id: "topmix_order",
          item_name: lead.produtos || "Pedido TopMix Brasil",
          price: parseFloat(value),
          quantity: 1,
        }],
      },
    }],
  };

  await httpsRequest(url, "POST", payload, {});
  console.log(JSON.stringify({ event: "GA4_PURCHASE_SENT", transaction_id: transactionId, value, client_id: clientId }));
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let notification;
  try {
    notification = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON invalido." }) };
  }

  const { transactionId, status, transactionType, clientName, value } = notification;

  console.log(JSON.stringify({ event: "WEBHOOK_RECEIVED", transactionId, status, transactionType, clientName }));

  // Responde 200 imediatamente ? gateway nao vai reenviar
  const okResponse = { statusCode: 200, headers, body: JSON.stringify({ received: true }) };

  // So processa deposito PIX confirmado
  const rawStatus = (status || "").toUpperCase();
  const rawType = (transactionType || "").toUpperCase();
  const isPaid =
    rawStatus === "COMPLETO" || rawStatus === "PAID" ||
    rawStatus === "APPROVED" || rawStatus === "PAGO";
  const isDeposit =
    !rawType || rawType === "DEPOSITO" || rawType === "DEPOSIT" || rawType === "PIX";

  if (!isPaid || !isDeposit) {
    console.log(JSON.stringify({ event: "WEBHOOK_IGNORED", reason: "not_paid_or_not_deposit", status, transactionType }));
    return okResponse;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ga4ApiSecret = process.env.GA4_API_SECRET;

  if (!supabaseUrl || !serviceKey || !ga4ApiSecret) {
    console.error(JSON.stringify({
      event: "WEBHOOK_ERROR",
      error: "Missing env vars",
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasGa4Secret: !!ga4ApiSecret,
    }));
    return okResponse;
  }

  if (!transactionId) {
    console.error(JSON.stringify({ event: "WEBHOOK_ERROR", error: "No transactionId in payload" }));
    return okResponse;
  }

  const lead = await getLeadByTransactionId(supabaseUrl, serviceKey, transactionId);
  if (!lead) {
    console.log(JSON.stringify({ event: "LEAD_NOT_FOUND", transactionId }));
    return okResponse;
  }

  const amount = value || lead.valor;
  await sendGa4Purchase(ga4ApiSecret, lead, transactionId, amount);
  await markLeadAsPaid(supabaseUrl, serviceKey, lead.id);

  console.log(JSON.stringify({ event: "PIX_PAGO_PROCESSADO", transactionId, leadId: lead.id, value: amount }));

  return okResponse;
};
