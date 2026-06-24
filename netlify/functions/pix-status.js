const https = require("https");

function httpsRequest(url, method, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "UMBRELLAB2B/1.0",
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const transactionId =
    event.queryStringParameters && event.queryStringParameters.transactionId;

  if (!transactionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "transactionId obrigatorio" }),
    };
  }

  const apiKey = process.env.UMBRELLAPAG_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gateway nao configurado" }),
    };
  }

  console.log("[pix-status] Consultando transacao UmbrellaPag:", transactionId);

  try {
    const result = await httpsRequest(
      `https://api-gateway.umbrellapag.com/api/user/transactions/${transactionId}`,
      "GET",
      { "x-api-key": apiKey }
    );

    console.log(
      "[pix-status] Resposta:",
      result.status,
      JSON.stringify(result.body)
    );

    if (result.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Transacao nao encontrada" }),
      };
    }

    if (result.status < 200 || result.status >= 300) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Erro ao consultar status do pagamento.",
          details: result.body,
        }),
      };
    }

    const responseBody = result.body;
    const transaction = responseBody.data || responseBody;

    const rawStatus = (
      transaction.status ||
      transaction.transactionState ||
      transaction.state ||
      ""
    ).toUpperCase();

    // Status de pagamento confirmado na UmbrellaPag
    const isPaid = [
      "PAID",
      "APPROVED",
      "COMPLETED",
      "CONCLUIDO",
      "PAGO",
      "APROVADO",
      "COMPLETO",
    ].includes(rawStatus);

    // Status de expiração/cancelamento
    const isExpired = [
      "EXPIRED",
      "CANCELLED",
      "CANCELED",
      "FAILED",
      "EXPIRADO",
      "CANCELADO",
      "FALHA",
    ].includes(rawStatus);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactionId,
        status: rawStatus,
        isPaid,
        isExpired,
        payedAt:
          transaction.paidAt ||
          transaction.updatedAt ||
          transaction.updated_at ||
          null,
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
