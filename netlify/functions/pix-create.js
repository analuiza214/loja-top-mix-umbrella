const https = require("https");

function httpsRequest(url, method, data, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: method || "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "UMBRELLAB2B/1.0",
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
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.UMBRELLAPAG_API_KEY;

  if (!apiKey) {
    console.error("[pix-create] Variavel UMBRELLAPAG_API_KEY nao configurada");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Gateway de pagamento nao configurado." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "JSON invalido." }),
    };
  }

  const { amount, name, document, email, phone, productName } = body;

  if (!amount || !name) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Campos obrigatorios: amount, name." }),
    };
  }

  const cpfDigits = document ? String(document).replace(/\D/g, "") : "";

  // Monta o payload conforme schema oficial da UmbrellaPag
  const payload = {
    amount: Number(amount),
    currency: "BRL",
    paymentMethod: "PIX",
    installments: 1,
    customer: {
      name: name,
      // document deve ser objeto { number, type } — nao uma string simples
      document: {
        number: cpfDigits || "00000000000",
        type: "CPF",
      },
      ...(email ? { email } : {}),
      ...(phone ? { phone: String(phone).replace(/\D/g, "") } : {}),
    },
    // Campo obrigatorio para PIX: informa em quantos dias expira
    pix: {
      expiresInDays: 1,
    },
    items: [
      {
        title: productName || "Produto",
        quantity: 1,
        unitPrice: Number(amount),
        tangible: false,
      },
    ],
  };

  console.log("[pix-create] Criando transacao UmbrellaPag:", {
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    customerName: payload.customer.name,
  });

  try {
    const result = await httpsRequest(
      "https://api-gateway.umbrellapag.com/api/user/transactions",
      "POST",
      payload,
      { "x-api-key": apiKey }
    );

    console.log("[pix-create] Resposta UmbrellaPag - status:", result.status);
    console.log("[pix-create] Body:", JSON.stringify(result.body));

    if (result.status < 200 || result.status >= 300) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Erro ao gerar PIX. Tente novamente.",
          details: result.body,
        }),
      };
    }

    const responseBody = result.body;
    const data = responseBody.data || responseBody;

    if (!data) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Resposta invalida do gateway." }),
      };
    }

    const transactionId = data.id || data.transactionId || data._id || null;

    // Busca o QR Code nos campos possiveis da resposta UmbrellaPag
    const pixCode =
      (data.pix && data.pix.qrCode) ||
      (data.pix && data.pix.brCode) ||
      data.qrCode ||
      data.pixCode ||
      data.pixCopiaECola ||
      data.emv ||
      data.brCode ||
      data.copyPaste ||
      null;

    const qrCodeBase64 =
      (data.pix && data.pix.qrCodeBase64) ||
      (data.pix && data.pix.qrCodeImage) ||
      data.qrCodeBase64 ||
      data.qrCodeImage ||
      data.qrcodeBase64 ||
      null;

    const qrCodeImage =
      (data.pix && data.pix.qrCodeUrl) ||
      data.qrCodeUrl ||
      data.qrcodeUrl ||
      null;

    if (!pixCode && !qrCodeBase64) {
      console.error(
        "[pix-create] Codigo PIX nao encontrado na resposta:",
        JSON.stringify(data)
      );
      // Retorna 200 com rawResponse para debug — nao bloqueia o usuario
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          transactionId,
          status: data.status || data.transactionState || "PENDENTE",
          pixCode: null,
          qrCodeBase64: null,
          qrCodeImage: null,
          _debug: data,
        }),
      };
    }

    console.log("[pix-create] PIX gerado com sucesso:", {
      transactionId,
      hasPixCode: !!pixCode,
      hasQrBase64: !!qrCodeBase64,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        transactionId,
        status: data.status || data.transactionState || "PENDENTE",
        pixCode: pixCode || null,
        qrCodeBase64: qrCodeBase64 || null,
        qrCodeImage: qrCodeImage || null,
      }),
    };
  } catch (err) {
    console.error("[pix-create] Erro:", err);
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Erro de comunicacao com o gateway." }),
    };
  }
};
