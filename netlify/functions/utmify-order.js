const https = require("https");

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
      res.on("data", (c) => (raw += c));
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

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "POST only" }) };

  const UTMIFY_API_TOKEN = process.env.UTMIFY_API_TOKEN;
  if (!UTMIFY_API_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "UTMIFY_API_TOKEN nao configurado" }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON invalido" }) }; }

  const {
    orderId, status, customerName, customerEmail, customerPhone, customerDocument,
    productName, valueInCents, tracking, createdAt,
  } = payload;

  if (!orderId || !status) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "orderId e status sao obrigatorios" }) };
  }

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  const utmifyPayload = {
    orderId: String(orderId),
    platform: "TopMixBrasil",
    paymentMethod: "pix",
    status: status, // "waiting_payment" | "paid"
    createdAt: createdAt || now,
    approvedDate: status === "paid" ? now : null,
    refundedAt: null,
    customer: {
      name: customerName || "Cliente",
      email: customerEmail || "sem-email@topmix.com",
      phone: customerPhone || null,
      document: customerDocument || null,
      country: "BR",
    },
    products: [
      {
        id: "topmix_kit",
        name: productName || "Kit Album Copa Do Mundo 2026",
        planId: "topmix_kit",
        planName: productName || "Kit Album Copa Do Mundo 2026",
        quantity: 1,
        priceInCents: valueInCents || 0,
      },
    ],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: tracking?.utm_source || null,
      utm_campaign: tracking?.utm_campaign || null,
      utm_medium: tracking?.utm_medium || null,
      utm_content: tracking?.utm_content || null,
      utm_term: tracking?.utm_term || null,
    },
    commission: {
      totalPriceInCents: valueInCents || 0,
      gatewayFeeInCents: 0,
      userCommissionInCents: valueInCents || 0,
    },
    isTest: false,
  };

  try {
    const result = await httpsRequest(
      "https://api.utmify.com.br/api-credentials/orders",
      "POST",
      utmifyPayload,
      { "x-api-token": UTMIFY_API_TOKEN }
    );
    console.log("[utmify-order] Resposta:", result.status, JSON.stringify(result.body));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, utmifyStatus: result.status }) };
  } catch (err) {
    console.error("[utmify-order] Erro:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
