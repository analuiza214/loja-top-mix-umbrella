const https = require("https");

function httpsRequest(url, method, data, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: method || "GET",
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
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
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

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const transactionId = event.queryStringParameters && event.queryStringParameters.transactionId;
  if (!transactionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "transactionId obrigatorio" }) };
  }

  const apiKey = process.env.UMBRELLA_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Gateway nao configurado" }) };
  }

  console.log("[pix-status] Consultando transacao UmbrellaPag:", transactionId);

  try {
    const result = await httpsRequest(
      `https://api-gateway.umbrellapag.com/api/user/transactions/${encodeURIComponent(transactionId)}`,
      "GET",
      null,
      { "x-api-key": apiKey }
    );

    console.log("[pix-status] Resposta:", result.status, JSON.stringify(result.body).slice(0, 300));

    if (result.status === 404) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ transactionId, status: "NOT_FOUND", isPaid: false, isExpired: false }),
      };
    }

    const data = result.body?.data || result.body;

    const rawStatus = (
      data?.status ||
      data?.transactionState ||
      ""
    ).toUpperCase();

    const isPaid = ["PAID", "PAGO", "APPROVED", "CONFIRMED", "COMPLETED", "COMPLETO", "CONCLUIDO"].includes(rawStatus);
    const isExpired = ["CANCELLED", "CANCELADO", "EXPIRED", "EXPIRADO", "REFUSED", "RECUSADO", "FAILED", "FALHA"].includes(rawStatus);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactionId,
        status: rawStatus,
        isPaid,
        isExpired,
        payedAt: data?.paidAt || data?.updatedAt || null,
      }),
    };
  } catch (err) {
    console.error("[pix-status] Erro:", err);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "Erro ao consultar status do pagamento." }),
    };
  }
};
