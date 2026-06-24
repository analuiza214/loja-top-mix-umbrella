import { useState } from "react";
import { Link } from "wouter";
import {
  Search, Package, Truck, CheckCircle, Clock,
  ShieldCheck, ChevronRight, ArrowLeft, MapPin, Box,
  AlertTriangle, RotateCcw, Warehouse, CreditCard, MessageCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Formata data em pt-BR ────────────────────────────────────────────────────
function fmt(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " — "
    + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// ── Busca a data de origem no Supabase ────────────────────────────────────────
// Só funciona para códigos gerados pelo admin. Códigos inexistentes retornam null.
async function getDataOrigem(codigo: string): Promise<Date | null> {
  const { data } = await supabase
    .from("rastreio_origem")
    .select("origem_at")
    .eq("codigo", codigo)
    .maybeSingle();

  if (data?.origem_at) {
    return new Date(data.origem_at);
  }

  // Código não foi gerado pelo admin — nega o rastreio
  return null;
}

// ── Gera linha do tempo baseada no tempo real decorrido desde o 1º rastreio ──
// Cronograma:
//   +0 min    → Pedido Confirmado
//   +30 min   → Em Separação
//   +55 min   → Em Embalagem
//   +175 min  → Enviado / Em Trânsito
//   +2 dias   → Saiu para Entrega
//   +2d+1h    → ❌ Falha na Entrega
//   +2d+2h    → Em Trânsito — Retornando ao CD
//   +3 dias   → Chegou ao Centro de Distribuição
//   +3d+1h    → Aguardando Taxa de Reenvio
function gerarEtapas(origem: Date) {
  const agora  = new Date();
  const minDecorridos = (agora.getTime() - origem.getTime()) / (1000 * 60);

  const MIN_SEPARACAO   = 30;
  const MIN_EMBALAGEM   = 55;
  const MIN_TRANSITO    = 175;
  const MIN_SAIU        = 2 * 24 * 60;
  const MIN_FALHA       = 2 * 24 * 60 + 60;
  const MIN_RETORNANDO  = 2 * 24 * 60 + 120;
  const MIN_CD          = 3 * 24 * 60;
  const MIN_TAXA        = 3 * 24 * 60 + 60;

  const tSeparacao  = new Date(origem.getTime() + MIN_SEPARACAO  * 60 * 1000);
  const tEmbalagem  = new Date(origem.getTime() + MIN_EMBALAGEM  * 60 * 1000);
  const tTransito   = new Date(origem.getTime() + MIN_TRANSITO   * 60 * 1000);
  const tSaiu       = new Date(origem.getTime() + MIN_SAIU       * 60 * 1000);
  const tFalha      = new Date(origem.getTime() + MIN_FALHA      * 60 * 1000);
  const tRetornando = new Date(origem.getTime() + MIN_RETORNANDO * 60 * 1000);
  const tCD         = new Date(origem.getTime() + MIN_CD         * 60 * 1000);
  const tTaxa       = new Date(origem.getTime() + MIN_TAXA       * 60 * 1000);
  const tEntrega    = addDays(origem, 2);

  const fmtPrev = (d: Date) =>
    `Previsão: ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  const etapasBase = [
    {
      icone: CheckCircle,
      label: "Pedido Confirmado",
      descricao: "Pagamento recebido e pedido registrado com sucesso.",
      data: fmt(origem),
      ok: true,
      erro: false,
    },
    {
      icone: Box,
      label: "Em Separação",
      descricao: "Seu produto está sendo separado no estoque.",
      data: minDecorridos >= MIN_SEPARACAO ? fmt(tSeparacao) : fmtPrev(tSeparacao),
      ok: minDecorridos >= MIN_SEPARACAO,
      erro: false,
    },
    {
      icone: Package,
      label: "Em Embalagem",
      descricao: "O produto está sendo embalado com cuidado para envio.",
      data: minDecorridos >= MIN_EMBALAGEM ? fmt(tEmbalagem) : fmtPrev(tEmbalagem),
      ok: minDecorridos >= MIN_EMBALAGEM,
      erro: false,
    },
    {
      icone: Truck,
      label: "Enviado / Em Trânsito",
      descricao: "Pedido entregue aos Correios e a caminho de você.",
      data: minDecorridos >= MIN_TRANSITO ? fmt(tTransito) : fmtPrev(tTransito),
      ok: minDecorridos >= MIN_TRANSITO,
      erro: false,
    },
    {
      icone: MapPin,
      label: "Saiu para Entrega",
      descricao: "O pedido está com o entregador e chegará em breve.",
      data: minDecorridos >= MIN_SAIU ? fmt(tSaiu) : fmtPrev(tEntrega),
      ok: minDecorridos >= MIN_SAIU,
      erro: false,
    },
  ];

  const etapasExtras = [];

  if (minDecorridos >= MIN_FALHA) {
    etapasExtras.push({
      icone: AlertTriangle,
      label: "Falha na Tentativa de Entrega",
      descricao: "A transportadora tentou realizar a entrega, mas não foi possível concluí-la. Nenhum responsável encontrado no endereço informado.",
      data: fmt(tFalha),
      ok: false,
      erro: true,
    });
  }

  if (minDecorridos >= MIN_RETORNANDO) {
    etapasExtras.push({
      icone: RotateCcw,
      label: "Em Trânsito — Retornando ao CD",
      descricao: "O produto está retornando ao Centro de Distribuição de origem em Guarulhos, SP.",
      data: fmt(tRetornando),
      ok: true,
      erro: false,
    });
  }

  if (minDecorridos >= MIN_CD) {
    etapasExtras.push({
      icone: Warehouse,
      label: "Chegou ao Centro de Distribuição",
      descricao: "O produto chegou ao Centro de Distribuição — Guarulhos, SP. Aguardando instrução do destinatário.",
      data: fmt(tCD),
      ok: true,
      erro: false,
    });
  }

  if (minDecorridos >= MIN_TAXA) {
    etapasExtras.push({
      icone: CreditCard,
      label: "Aguardando Taxa de Reenvio",
      descricao: "Para que seu pedido seja reenviado, é necessário pagar a taxa de reenvio. Entre em contato conosco pelo WhatsApp para efetuar o pagamento e reagendar a entrega.",
      data: fmt(tTaxa),
      ok: false,
      erro: false,
      taxa: true,
    });
  }

  const todasEtapas = [...etapasBase, ...etapasExtras];

  let status: string;
  if (minDecorridos >= MIN_TAXA) {
    status = "⚠️ Taxa de Reenvio";
  } else if (minDecorridos >= MIN_CD) {
    status = "🏭 No Centro de Distribuição";
  } else if (minDecorridos >= MIN_RETORNANDO) {
    status = "🔄 Retornando ao CD";
  } else if (minDecorridos >= MIN_FALHA) {
    status = "❌ Falha na Entrega";
  } else if (minDecorridos >= MIN_SAIU) {
    status = "🚚 Saiu para Entrega";
  } else if (minDecorridos >= MIN_TRANSITO) {
    status = "🚛 Em Trânsito";
  } else if (minDecorridos >= MIN_EMBALAGEM) {
    status = "📦 Em Embalagem";
  } else if (minDecorridos >= MIN_SEPARACAO) {
    status = "🔍 Em Separação";
  } else {
    status = "✅ Confirmado";
  }

  return {
    etapas: todasEtapas,
    previsao: tEntrega.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    }),
    status,
    falhaEntrega: minDecorridos >= MIN_FALHA,
    aguardandoTaxa: minDecorridos >= MIN_TAXA,
  };
}

// ── Valida formato do código TM ───────────────────────────────────────────────
function codigoValido(cod: string): boolean {
  return /^TM[A-Z0-9]{6,10}$/i.test(cod.trim().replace(/[-\s]/g, ""));
}

export default function RastrearPedido() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<ReturnType<typeof gerarEtapas> | null>(null);
  const [codigoExibido, setCodigoExibido] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleRastrear(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const cod = codigo.trim();
    if (!cod) return;

    if (!codigoValido(cod)) {
      setErro("Código inválido. Use o código enviado pela Top Mix, ex: TM2A3B4C5D");
      return;
    }

    setLoading(true);
    try {
      const origem = await getDataOrigem(cod.toUpperCase());
      if (!origem) {
        setErro("Código não encontrado. Verifique o código enviado pela Top Mix e tente novamente.");
        return;
      }
      setCodigoExibido(cod.toUpperCase());
      setResultado(gerarEtapas(origem));
    } catch {
      setErro("Erro ao buscar o rastreio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar à Loja
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Rastrear Pedido</h1>
          <p className="text-sm text-gray-500 mt-1">Digite o código enviado pela Top Mix para ver o status da entrega.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleRastrear} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={codigo}
                onChange={e => { setCodigo(e.target.value); setErro(""); }}
                placeholder="Ex: TM2A3B4C5D"
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${erro ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl font-black text-sm text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
            >
              {loading ? "Buscando..." : "RASTREAR"}
            </button>
          </form>
          {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}
        </div>

        {/* Resultado */}
        {resultado && (
          <>
            {/* Alerta de falha na entrega */}
            {resultado.falhaEntrega && (
              <div className="bg-red-50 border border-red-300 rounded-2xl p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-black text-red-700 text-sm">Falha na Tentativa de Entrega</p>
                  <p className="text-red-600 text-xs mt-1 leading-relaxed">
                    Não foi possível realizar a entrega do seu pedido. A transportadora tentou entregar, mas não encontrou nenhum responsável no endereço informado. O produto está sendo retornado ao Centro de Distribuição em <strong>Guarulhos, SP</strong>.
                  </p>
                  {resultado.aguardandoTaxa && (
                    <p className="text-red-700 text-xs mt-2 font-bold">
                      Para receber seu pedido novamente, entre em contato e pague a taxa de reenvio.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Alerta de taxa de reenvio */}
            {resultado.aguardandoTaxa && (
              <div className="bg-orange-50 border border-orange-300 rounded-2xl p-5 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-black text-orange-700 text-sm">Taxa de Reenvio Necessária</p>
                    <p className="text-orange-600 text-xs mt-1 leading-relaxed">
                      Seu pedido chegou ao Centro de Distribuição em <strong>Guarulhos, SP</strong>. Para reenviarmos o produto ao seu endereço, é necessário o pagamento de uma <strong>taxa de reenvio</strong>.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 font-black text-sm px-3 py-1.5 rounded-lg">
                      💳 Taxa de reenvio: <span className="text-base">R$ 19,90</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://wa.me/5583993380181?text=${encodeURIComponent(`Olá! Meu pedido ${codigoExibido} não foi entregue e preciso pagar a taxa de reenvio de R$ 19,90 para receber meu produto. Podem me ajudar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Pagar Taxa de Reenvio pelo WhatsApp
                </a>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              {/* Cabeçalho do pedido */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Pedido</p>
                  <p className="font-black text-lg text-gray-900">{codigoExibido}</p>
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                  resultado.falhaEntrega
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {resultado.status}
                </span>
              </div>

              {/* Linha do tempo */}
              <div className="space-y-0">
                {resultado.etapas.map((etapa, i) => {
                  const Icon = etapa.icone;
                  const isLast = i === resultado.etapas.length - 1;
                  const isTaxa = (etapa as any).taxa === true;

                  const circleBg = etapa.erro
                    ? "bg-red-500"
                    : isTaxa
                    ? "bg-orange-400"
                    : etapa.ok
                    ? "bg-green-500"
                    : "bg-gray-200";

                  const iconColor = etapa.erro || etapa.ok || isTaxa ? "text-white" : "text-gray-400";

                  const lineBg = etapa.erro
                    ? "bg-red-200"
                    : etapa.ok
                    ? "bg-green-300"
                    : "bg-gray-200";

                  const labelColor = etapa.erro
                    ? "text-red-700"
                    : isTaxa
                    ? "text-orange-700"
                    : etapa.ok
                    ? "text-gray-900"
                    : "text-gray-400";

                  const dataColor = etapa.erro
                    ? "text-red-500"
                    : isTaxa
                    ? "text-orange-500"
                    : etapa.ok
                    ? "text-green-600"
                    : "text-gray-400";

                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${circleBg}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 my-1 ${lineBg}`}
                            style={{ minHeight: 28 }}
                          />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`text-sm font-bold ${labelColor}`}>
                          {etapa.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{etapa.descricao}</p>
                        <p className={`text-xs mt-0.5 font-semibold ${dataColor}`}>
                          {etapa.data}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Previsão de entrega — só mostra se não houve falha */}
              {!resultado.falhaEntrega && (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                  <strong>Previsão de entrega:</strong> até {resultado.previsao}. Fique atento — entregas podem variar conforme a região.
                </div>
              )}
            </div>
          </>
        )}

        {/* Onde encontro meu código */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-900 mb-4">Onde encontro meu código?</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              "No WhatsApp — enviamos o código assim que o pedido for confirmado",
              "O código começa sempre com TM seguido de letras e números",
              "Dúvidas? Fale conosco pelo WhatsApp (83) 99331-8120",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          Não encontrou? <Link href="/fale-conosco" className="text-yellow-600 font-bold hover:underline ml-1">Entre em contato</Link>
        </div>
      </div>
    </div>
  );
}
