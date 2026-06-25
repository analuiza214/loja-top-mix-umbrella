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

function gerarCpfAleatorio() {
  const rand = () => Math.floor(Math.random() * 9);
  const d = Array.from({ length: 9 }, rand);
  let sum = d.reduce((acc, v, i) => acc + v * (10 - i), 0);
  d.push(((sum * 10) % 11) % 10);
  sum = d.reduce((acc, v, i) => acc + v * (11 - i), 0);
  d.push(((sum * 10) % 11) % 10);
  return d.join("");
}

function formatDocument(doc) {
  const digits = String(doc || "").replace(/\D/g, "");
  if (digits.length === 14) return { number: digits, type: "CNPJ" };
  const validCpf = digits.length === 11 ? digits : gerarCpfAleatorio();
  return { number: validCpf, type: "CPF" };
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
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.UMBRELLA_API_KEY;

  if (!apiKey) {
    console.error("[pix-create] Variavel UMBRELLA_API_KEY nao configurada");
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Gateway de pagamento nao configurado." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "JSON invalido." }) };
  }

  const { amount, name, document, productName, email, phone } = body;

  if (!amount || !name) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Campos obrigatorios: amount, name." }) };
  }

  const siteUrl = process.env.URL || process.env.DEPLOY_URL || "";
  const webhookUrl = siteUrl ? `${siteUrl}/.netlify/functions/pix-webhook` : undefined;

  const amountInCents = Math.round(Number(amount) * 100);

  const payload = {
    amount: amountInCents,
    currency: "BRL",
    paymentMethod: "PIX",
    customer: {
      name: String(name),
      email: email || "cliente@email.com",
      phone: phone ? String(phone).replace(/\D/g, "") : "11999999999",
      document: formatDocument(document),
    },
    items: [
      {
        title: productName || "Kit Album Copa Do Mundo 2026 Capa Mole + 250 Figurinhas Panini",
        unitPrice: amountInCents,
        quantity: 1,
        tangible: false,
      },
    ],
    pix: {
      expiresInDays: 1,
    },
    ...(webhookUrl ? { postbackUrl: webhookUrl } : {}),
  };

  console.log("[pix-create] Criando transacao UmbrellaPag:", { amount: amountInCents, payerName: name });

  try {
    const result = await httpsRequest(
      "https://api-gateway.umbrellapag.com/api/user/transactions",
      "POST",
      payload,
      { "x-api-key": apiKey }
    );

    console.log("[pix-create] Resposta UmbrellaPag - status:", result.status);
    console.log("[pix-create] Body:", JSON.stringify(result.body).slice(0, 500));

    if (result.status < 200 || result.status >= 300) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Erro ao gerar PIX. Tente novamente.", details: result.body }),
      };
    }

    const data = result.body?.data || result.body;

    if (!data) {
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: "Resposta invalida do gateway." }) };
    }

    const pixCode = data.qrCode || data.pix?.qrcode || data.pix?.copyPaste || null;
    const qrCodeBase64 = data.qrCodeImage || data.pix?.qrCodeBase64 || null;
    const qrCodeImage = data.pix?.url || data.qrCodeUrl || null;
    const tid = data.id || data.transactionId || data.externalRef;

    if (!pixCode) {
      console.error("[pix-create] Codigo PIX nao encontrado:", JSON.stringify(data).slice(0, 300));
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "QR Code PIX nao gerado. Verifique as credenciais.", rawResponse: data }),
      };
    }

    console.log("[pix-create] PIX gerado com sucesso:", { tid, preview: pixCode.slice(0, 30) });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        transactionId: tid,
        status: data.status || "WAITING_PAYMENT",
        pixCode,
        qrCodeBase64: qrCodeBase64 || null,
        qrCodeImage: qrCodeImage || null,
      }),
    };
  } catch (err) {
    console.error("[pix-create] Erro:", err);
    return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: "Erro de comunicacao com o gateway." }) };
  }
};
