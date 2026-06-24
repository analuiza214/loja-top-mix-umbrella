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

  const { amount, name, document, email, phone, productName, address } = body;

  if (!amount || !name) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Campos obrigatorios: amount, name." }),
    };
  }

  // Frontend envia valor em reais (ex: 44.10) — API espera centavos (ex: 4410)
  const amountInCents = Math.round(Number(amount) * 100);

  // CPF: remove mascara (ex: "397.666.978-41" → "39766697841")
  const cpfDigits = document ? String(document).replace(/\D/g, "") : "";
  if (!cpfDigits || cpfDigits.length !== 11) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "CPF invalido. Informe 11 digitos." }),
    };
  }

  // Telefone: precisa do codigo do pais 55 sem o + (ex: "5511999999999")
  const phoneRaw = phone ? String(phone).replace(/\D/g, "") : "11999999999";
  const phoneFormatted = phoneRaw.startsWith("55") ? phoneRaw : `55${phoneRaw}`;

  // Endereco dentro de customer — campo e streetNumber (nao number)
  const customerAddress = address
    ? {
        street: address.street || address.rua || "",
        streetNumber: address.streetNumber || address.number || address.numero || "0",
        complement: address.complement || address.complemento || "",
        zipCode: (address.zipCode || address.cep || "").replace(/\D/g, ""),
        neighborhood: address.neighborhood || address.bairro || "Centro",
        city: address.city || address.cidade || "",
        state: address.state || address.estado || "",
        country: "BR",
      }
    : undefined;

  const payload = {
    amount: amountInCents,
    currency: "BRL",
    paymentMethod: "PIX",
    installments: 1,
    customer: {
      name: name,
      document: { number: cpfDigits, type: "CPF" },
      email: email || "cliente@email.com",
      phone: phoneFormatted,
      ...(customerAddress ? { address: customerAddress } : {}),
    },
    pix: { expiresInDays: 1 },
    items: [
      {
        title: productName || "Produto",
        quantity: 1,
        unitPrice: amountInCents,
        tangible: false,
      },
    ],
  };

  console.log("[pix-create] Enviando para UmbrellaPag:", {
    amountCents: amountInCents,
    customer: payload.customer.name,
    hasAddress: !!customerAddress,
  });

  try {
    const result = await httpsRequest(
      "https://api-gateway.umbrellapag.com/api/user/transactions",
      "POST",
      payload,
      { "x-api-key": apiKey }
    );

    console.log("[pix-create] Status:", result.status);
    console.log("[pix-create] Body:", JSON.stringify(result.body));

    const responseBody = result.body;
    const data = responseBody.data || responseBody;

    // Transacao recusada pelo provider
    if (data && data.status === "refused") {
      const motivo =
        (responseBody.error && responseBody.error.refusedReason) ||
        responseBody.message ||
        "Transacao recusada pelo gateway.";
      console.error("[pix-create] Recusada:", motivo);
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: motivo }),
      };
    }

    if (result.status < 200 || result.status >= 300) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Erro ao gerar PIX.", details: responseBody }),
      };
    }

    const transactionId = data.id || null;

    // QR Code: campo correto e data.pix.qrcode (minusculo)
    // Tambem verificamos data.qrCode e data.barcode como fallback
    const pixCode =
      (data.pix && data.pix.qrcode) ||
      (data.pix && data.pix.qrCode) ||
      data.qrCode ||
      data.qrcode ||
      data.barcode ||
      null;

    console.log("[pix-create] PIX gerado com sucesso! ID:", transactionId, "| temCodigo:", !!pixCode);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        transactionId,
        status: data.status || "WAITING_PAYMENT",
        pixCode,
        qrCodeBase64: null,
        qrCodeImage: (data.pix && data.pix.url) || null,
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
