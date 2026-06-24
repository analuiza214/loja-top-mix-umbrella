import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { products, reviews } from "@/lib/data";
import { getImagePath } from "@/lib/utils";
import { ShieldCheck, Truck, Star, BadgeCheck, ChevronLeft, ChevronRight, AlertTriangle, ShoppingBag, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WistiaPlayer } from "@/components/wistia-player";

// ── Live purchase notifications ──
const buyers = [
  { name: "João M.",        city: "São Paulo, SP",        action: "acabou de garantir o kit aqui no site",  photo: "https://i.pravatar.cc/40?img=1"  },
  { name: "Ana Paula",      city: "Rio de Janeiro, RJ",   action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=2"  },
  { name: "Renata C.",      city: "Belo Horizonte, MG",   action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=3"  },
  { name: "Lucas T.",       city: "Brasília, DF",         action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=4"  },
  { name: "Maria J.",       city: "Curitiba, PR",         action: "comprou 3 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=5"  },
  { name: "Pedro A.",       city: "Fortaleza, CE",        action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=6"  },
  { name: "Camila R.",      city: "Salvador, BA",         action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=7"  },
  { name: "Felipe S.",      city: "Manaus, AM",           action: "garantiu o último kit disponível",       photo: "https://i.pravatar.cc/40?img=8"  },
  { name: "Beatriz N.",     city: "Recife, PE",           action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=9"  },
  { name: "Thiago O.",      city: "Porto Alegre, RS",     action: "comprou 1 kit aqui no site",             photo: "https://i.pravatar.cc/40?img=10" },
  { name: "Larissa P.",     city: "Goiânia, GO",          action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=11" },
  { name: "Rodrigo V.",     city: "Maceió, AL",           action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=13" },
  { name: "Priscila M.",    city: "Natal, RN",            action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=14" },
  { name: "Eduardo C.",     city: "Campo Grande, MS",     action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=15" },
  { name: "Juliana F.",     city: "Teresina, PI",         action: "comprou 3 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=16" },
  { name: "Rafael L.",      city: "João Pessoa, PB",      action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=17" },
  { name: "Vanessa S.",     city: "Aracaju, SE",          action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=18" },
  { name: "Bruno K.",       city: "Cuiabá, MT",           action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=19" },
  { name: "Patrícia H.",    city: "Macapá, AP",           action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=20" },
  { name: "Diego W.",       city: "Rio Branco, AC",       action: "comprou 1 kit aqui no site",             photo: "https://i.pravatar.cc/40?img=21" },
  { name: "Isabela Q.",     city: "Porto Velho, RO",      action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=22" },
  { name: "Henrique B.",    city: "Palmas, TO",           action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=23" },
  { name: "Aline G.",       city: "Florianópolis, SC",    action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=24" },
  { name: "Marcelo D.",     city: "Vitória, ES",          action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=26" },
  { name: "Tatiane X.",     city: "Belém, PA",            action: "comprou 3 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=27" },
  { name: "Gustavo E.",     city: "São Luís, MA",         action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=28" },
  { name: "Fernanda Z.",    city: "Campinas, SP",         action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=29" },
  { name: "Adriano Y.",     city: "Ribeirão Preto, SP",   action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=30" },
  { name: "Simone U.",      city: "Santos, SP",           action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=31" },
  { name: "Carlos F.",      city: "Uberlândia, MG",       action: "comprou 1 kit aqui no site",             photo: "https://i.pravatar.cc/40?img=33" },
  { name: "Débora I.",      city: "Contagem, MG",         action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=34" },
  { name: "Leandro J.",     city: "Joinville, SC",        action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=35" },
  { name: "Mônica T.",      city: "Londrina, PR",         action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=36" },
  { name: "Alexandre R.",   city: "Sorocaba, SP",         action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=37" },
  { name: "Cíntia N.",      city: "Duque de Caxias, RJ",  action: "comprou 3 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=38" },
  { name: "Weslley O.",     city: "Nova Iguaçu, RJ",      action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=39" },
  { name: "Karina P.",      city: "Osasco, SP",           action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=40" },
  { name: "Fábio Q.",       city: "São Bernardo, SP",     action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=41" },
  { name: "Natália V.",     city: "Guarulhos, SP",        action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=42" },
  { name: "Sérgio W.",      city: "Mogi das Cruzes, SP",  action: "comprou 1 kit aqui no site",             photo: "https://i.pravatar.cc/40?img=43" },
  { name: "Elaine H.",      city: "Santo André, SP",      action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=45" },
  { name: "Paulo G.",       city: "São José, SC",         action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=46" },
  { name: "Cláudia B.",     city: "Feira de Santana, BA", action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=48" },
  { name: "Tiago D.",       city: "Caucaia, CE",          action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=49" },
  { name: "Viviane C.",     city: "Olinda, PE",           action: "comprou 3 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=50" },
  { name: "Anderson L.",    city: "Caruaru, PE",          action: "acabou de garantir o kit",               photo: "https://i.pravatar.cc/40?img=51" },
  { name: "Cristiane M.",   city: "Pelotas, RS",          action: "comprou 2 kits aqui no site",            photo: "https://i.pravatar.cc/40?img=52" },
  { name: "Roberto S.",     city: "Caxias do Sul, RS",    action: "garantiu o kit agora mesmo",             photo: "https://i.pravatar.cc/40?img=53" },
  { name: "Sandra K.",      city: "Anápolis, GO",         action: "acabou de comprar aqui no site",         photo: "https://i.pravatar.cc/40?img=54" },
  { name: "Márcio E.",      city: "São José dos Campos",  action: "comprou 1 kit aqui no site",             photo: "https://i.pravatar.cc/40?img=55" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── FAQ Section ──
const homeFaqs = [
  {
    icon: "✅",
    q: "É original mesmo? Não é falsificado?",
    r: "100% original Panini! Todos os nossos álbuns e figurinhas são adquiridos diretamente do distribuidor oficial autorizado. Você recebe o produto lacrado de fábrica, com o selo de autenticidade Panini. Nunca vendemos produtos falsificados.",
  },
  {
    icon: "📦",
    q: "É PDF? Tenho que imprimir em casa?",
    r: "Não! São figurinhas físicas oficiais Panini, impressas pela própria editora. Você recebe o álbum encadernado e os envelopes lacrados com as figurinhas de papel, exatamente igual ao que encontra nas bancas — só que com frete grátis e preço melhor.",
  },
  {
    icon: "🛡️",
    q: "Qual a garantia que tenho ao comprar?",
    r: "Você tem 90 dias de garantia total. Se por qualquer motivo não ficar satisfeito, devolvemos 100% do seu dinheiro, sem burocracia e sem perguntas. Além disso, sua compra é protegida por pagamento seguro (Pix, cartão ou boleto) — seus dados ficam sempre protegidos.",
  },
  {
    icon: "🚚",
    q: "Em quantos dias chega? Frete é grátis?",
    r: "Sim, frete 100% grátis para todo o Brasil! O prazo de entrega é de 1 a 3 dias úteis após a confirmação do pagamento. Pedidos pagos via Pix até às 14h saem no mesmo dia. Você recebe o código de rastreamento por e-mail assim que seu pacote for postado.",
  },
];

function HomeFaqSection() {
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {homeFaqs.map((item, i) => (
        <div key={i} className="border-b border-gray-100 last:border-0">
          <button
            onClick={() => setAberto(aberto === i ? null : i)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left"
          >
            <span className="text-xl shrink-0">{item.icon}</span>
            <span className="flex-1 text-sm font-bold text-gray-800">{item.q}</span>
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200"
              style={{
                background: aberto === i ? "linear-gradient(135deg,#E09400,#f5b800)" : "#f3f4f6",
                transform: aberto === i ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <span className="text-xs font-black" style={{ color: aberto === i ? "#fff" : "#6b7280" }}>+</span>
            </span>
          </button>
          {aberto === i && (
            <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed pl-14">{item.r}</p>
          )}
        </div>
      ))}
    </div>
  );
}

const TOTAL_STOCK = 120;
const INITIAL_SOLD = 31;

function StockSection() {
  const [sold, setSold] = useState(INITIAL_SOLD);
  const [visible, setVisible] = useState(true);
  const queueRef = useRef<typeof buyers>([]);
  const posRef = useRef(0);
  const [buyer, setBuyer] = useState(() => {
    queueRef.current = shuffleArray(buyers);
    posRef.current = 0;
    return queueRef.current[0];
  });

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        posRef.current += 1;
        if (posRef.current >= queueRef.current.length) {
          const last = queueRef.current[queueRef.current.length - 1];
          let next = shuffleArray(buyers);
          while (next[0] === last) next = shuffleArray(buyers);
          queueRef.current = next;
          posRef.current = 0;
        }
        setBuyer(queueRef.current[posRef.current]);
        setSold(s => (s < TOTAL_STOCK - 1 ? s + 1 : s));
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const remaining = TOTAL_STOCK - sold;
  const pct = Math.round((sold / TOTAL_STOCK) * 100);

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold flex-wrap">
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Oferta acaba enquanto o estoque durar!
        </span>
        <span
          className="flex items-center gap-1 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "linear-gradient(90deg, #15803d, #22c55e)" }}
        >
          <Truck className="h-3 w-3" /> Frete Grátis • Aproveite
        </span>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #22c55e 0%, #eab308 55%, #ef4444 100%)" }}
            initial={{ width: `${pct - 4}%` }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow">
            {pct}% vendido
          </span>
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-semibold">
          <span className="text-green-600">✅ {sold} vendidos</span>
          <span className="text-red-500">⚡ Apenas {remaining} restantes!</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={buyer.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-white shadow-md"
            style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
          >
            <div className="relative shrink-0">
              <img
                src={buyer.photo}
                alt={buyer.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-green-400"
                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name)}&background=22c55e&color=fff&size=40`; }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-gray-900 leading-tight">{buyer.name} <span className="text-gray-400 font-normal">de {buyer.city}</span></p>
              <p className="text-[10px] text-gray-600 leading-tight truncate">{buyer.action}</p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-0.5 text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <ShoppingBag className="h-2.5 w-2.5" /> agora
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Reviewer photos ──
const reviewerPhotos: Record<string, string> = {
  "Carlos A.":   "https://i.pravatar.cc/80?img=12",
  "Fernanda L.": "https://i.pravatar.cc/80?img=47",
  "Ana C.":      "https://i.pravatar.cc/80?img=25",
  "Rafael M.":   "https://i.pravatar.cc/80?img=8",
  "Juliana P.":  "https://i.pravatar.cc/80?img=32",
  "Bruno S.":    "https://i.pravatar.cc/80?img=15",
  "Tatiane R.":  "https://i.pravatar.cc/80?img=44",
  "Diego F.":    "https://i.pravatar.cc/80?img=6",
  "Henrique L.": "https://i.pravatar.cc/80?img=23",
  "Vanessa O.":  "https://i.pravatar.cc/80?img=38",
};

function getReviewerPhoto(author: string): string {
  if (reviewerPhotos[author]) return reviewerPhotos[author];
  const hash = Math.abs(author.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return `https://i.pravatar.cc/80?img=${(hash % 70) + 1}`;
}

// ── Sphere / Coverflow Carousel ──
// Cards are arranged on a virtual sphere surface:
// - Center card faces you directly (flat, large, in front)
// - Side cards curve away as if wrapped around a sphere
// - Far cards are almost edge-on and fade out
function getCardTransform(offset: number) {
  const absOff = Math.abs(offset);
  const sign = offset < 0 ? -1 : 1;

  if (absOff === 0) {
    return {
      x: "0%",
      rotateY: 0,
      scale: 1,
      opacity: 1,
      zIndex: 20,
      filter: "brightness(1)",
    };
  }
  if (absOff === 1) {
    return {
      x: `${sign * 72}%`,
      rotateY: sign * -48,
      scale: 0.76,
      opacity: 0.88,
      zIndex: 15,
      filter: "brightness(0.88)",
    };
  }
  if (absOff === 2) {
    return {
      x: `${sign * 115}%`,
      rotateY: sign * -65,
      scale: 0.55,
      opacity: 0.55,
      zIndex: 10,
      filter: "brightness(0.72)",
    };
  }
  return {
    x: `${sign * 145}%`,
    rotateY: sign * -75,
    scale: 0.35,
    opacity: 0,
    zIndex: 5,
    filter: "brightness(0.5)",
  };
}

function ReviewCard({ review }: { review: typeof reviews[number] }) {
  const reviewerPhoto = getReviewerPhoto(review.author);
  const resultPhotos = review.photos ?? (review.photo ? [review.photo] : []);

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative overflow-hidden h-full"
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #fffdf5 100%)",
        border: "2px solid #f5b800",
        boxShadow: "0 16px 50px rgba(224,148,0,0.20), 0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* Top-right glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,184,0,0.20) 0%, transparent 70%)" }} />
      {/* Bottom-left glow */}
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)" }} />

      {/* Stars */}
      <div className="flex gap-0.5 relative z-10">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
      </div>

      {/* Text */}
      <p className="text-sm text-gray-700 leading-relaxed italic relative z-10 flex-1">
        "{review.text}"
      </p>

      {/* Result photos */}
      {resultPhotos.length > 0 && (
        <div className="flex gap-2 relative z-10">
          {resultPhotos.map((p, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={getImagePath(p)}
                alt="Foto do resultado"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-yellow-200"
                style={{ boxShadow: "0 4px 14px rgba(224,148,0,0.25)" }}
                loading="lazy"
                decoding="async"
              />
              {i === 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                  ✓ Real
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 pt-3 border-t border-yellow-100 relative z-10">
        <div className="relative shrink-0">
          <img
            src={reviewerPhoto}
            alt={review.author}
            className="w-11 h-11 rounded-full object-cover border-2 border-yellow-300 shadow"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            loading="lazy"
            decoding="async"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
            style={{ background: "#16a34a" }}>
            <BadgeCheck className="h-3 w-3 text-white" />
          </div>
        </div>
        <div>
          <div className="font-bold text-sm text-gray-900">{review.author}</div>
          <div className="text-xs text-green-600 font-medium">Comprador Verificado ✓</div>
        </div>
        <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg,#fff3cc,#ffe58f)", color: "#a06800" }}>
          ⭐ Verificado
        </span>
      </div>
    </div>
  );
}

function SphereCarousel() {
  const [active, setActive] = useState(0);
  const total = reviews.length;

  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % total), 5500);
    return () => clearInterval(id);
  }, [total]);

  const prev = () => setActive(i => (i - 1 + total) % total);
  const next = () => setActive(i => (i + 1) % total);

  const visibleRange = [-2, -1, 0, 1, 2];

  return (
    <div className="relative select-none">
      <div
        className="relative overflow-visible"
        style={{
          perspective: "1100px",
          perspectiveOrigin: "50% 50%",
          height: 420,
        }}
      >
        {visibleRange.map(offset => {
          const idx = ((active + offset) % total + total) % total;
          const review = reviews[idx];
          const t = getCardTransform(offset);
          const isCenter = offset === 0;

          if (isCenter) {
            return (
              <motion.div
                key={active}
                initial={{ x: "120%", opacity: 0, scale: 0.85, zIndex: 20 }}
                animate={{ x: "0%", opacity: 1, scale: 1, zIndex: 20, filter: "brightness(1)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  width: "min(340px, 80vw)",
                  marginLeft: "calc(min(340px, 80vw) / -2)",
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                  cursor: "default",
                }}
              >
                <ReviewCard review={review} />
              </motion.div>
            );
          }

          return (
            <motion.div
              key={`${idx}-${offset}`}
              animate={{
                x: t.x,
                rotateY: t.rotateY,
                scale: t.scale,
                opacity: t.opacity,
                zIndex: t.zIndex,
                filter: t.filter,
              }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "min(340px, 80vw)",
                marginLeft: "calc(min(340px, 80vw) / -2)",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                cursor: "pointer",
                pointerEvents: Math.abs(offset) > 2 ? "none" : "auto",
              }}
              onClick={() => {
                if (offset === -1) prev();
                else if (offset === 1) next();
              }}
            >
              <ReviewCard review={review} />
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-yellow-400 hover:bg-yellow-50 transition-all shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? 24 : 8,
                height: 8,
                background: i === active ? "#E09400" : "#d1d5db",
                boxShadow: i === active ? "0 2px 8px rgba(224,148,0,0.45)" : "none",
              }}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-yellow-400 hover:bg-yellow-50 transition-all shadow-sm"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function Home() {
  const mainProduct = products[0];

  return (
    <div className="w-full bg-white">

      {/* HERO */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">

          <Link href={`/produto/${mainProduct.slug}`} className="block">
            <div className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group">
              <img
                src={getImagePath("/images/hero-kit.jpg")}
                alt="Kit Álbum Copa do Mundo 2026 + 250 Figurinhas"
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-2xl" />
            </div>
          </Link>

          <div className="mt-5 space-y-4">
            <div className="text-center">
              {mainProduct.originalPrice && (
                <div className="text-xs text-gray-400 line-through">De R$ {mainProduct.originalPrice.toFixed(2).replace('.', ',')}</div>
              )}
              <div className="flex items-baseline gap-2 justify-center">
                <span className="text-4xl font-black" style={{ color: "#E09400" }}>
                  R$ {mainProduct.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">-59% OFF</span>
              </div>
              <div className="text-sm font-semibold text-green-700 mt-0.5">
                💚 No Pix: R$ {mainProduct.pixPrice.toFixed(2).replace('.', ',')}
                <span className="text-gray-400 font-normal text-xs"> (10% OFF)</span>
              </div>
              <div className="text-xs text-gray-400">{mainProduct.installment} no cartão sem juros</div>
            </div>

            <Link href={`/produto/${mainProduct.slug}`} className="block">
              <button
                className="pulse-blue w-full py-4 rounded-xl font-black text-base text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb, #1d4ed8)" }}
              >
                🛒 COMPRAR AGORA
              </button>
            </Link>

            <StockSection />

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-1 pb-2 border-t border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-green-600" /> Frete Grátis</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> 100% Original Panini</span>
              <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-green-600" /> Parcela sem juros</span>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO — POR QUE TÃO BARATO? */}
      <section className="py-8 bg-gray-50 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-black tracking-widest uppercase text-red-600 mb-1">▶ Assista antes de comprar</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Por que o preço está tão baixo?</h2>
            <p className="text-sm text-gray-500 mt-1">Entenda como conseguimos oferecer o menor preço do mercado</p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg"
            style={{ border: "2px solid #e5e7eb", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <WistiaPlayer mediaId="5hq52h0zlz" aspect={0.5625} />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-5">
            <p className="text-xs font-black tracking-widest uppercase text-green-700 mb-1">Coleção Copa 2026</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Escolha Seu Kit</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map((product, idx) => {
              const topLabel =
                idx === 0 ? <span className="badge-relampago"><span className="fire-icon">🔥</span>Oferta Relâmpago</span>
                : idx === 3 ? <span className="badge-album">Ideal p/ quem já tem o álbum</span>
                : idx === 4 ? <span className="badge-presente">Ótimo para presentear</span>
                : null;

              const cardStyle =
                idx === 0 ? {
                  border: "2px solid #ff6600",
                  boxShadow: "0 0 0 3px rgba(255,102,0,0.12), 0 4px 20px rgba(255,102,0,0.22)",
                }
                : idx === 3 ? {
                  border: "2px solid #22c55e",
                  boxShadow: "0 0 0 3px rgba(34,197,94,0.10), 0 4px 20px rgba(34,197,94,0.18)",
                }
                : idx === 4 ? {
                  border: "2px solid #ff7700",
                  boxShadow: "0 0 0 3px rgba(255,119,0,0.10), 0 4px 20px rgba(255,119,0,0.16)",
                }
                : {
                  border: "1.5px solid #e5e7eb",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                };

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex flex-col"
                >
                  {topLabel ? (
                    <div className="flex justify-center mb-1.5">{topLabel}</div>
                  ) : (
                    <div className="mb-1.5 h-[22px]" />
                  )}
                  <Link href={`/produto/${product.slug}`} className="flex-1">
                    <div
                      className="bg-white rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col h-full hover:scale-[1.02] hover:shadow-xl"
                      style={cardStyle}
                    >
                      {idx === 0 && (
                        <div className="px-2 pt-2">
                          <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Mais vendido</span>
                        </div>
                      )}
                      <div className="p-3 aspect-square bg-gray-50 flex items-center justify-center">
                        <img src={getImagePath(product.mainImage)} alt={product.name} className="w-full h-full object-contain" loading="lazy" decoding="async" />
                      </div>
                      <div className="p-2.5 flex flex-col flex-1 gap-1">
                        <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-700">{product.rating}</span>
                          <span>({product.reviewCount})</span>
                        </div>
                        <div className="mt-auto">
                          <div className="font-black text-base" style={{ color: "#E09400" }}>R$ {product.price.toFixed(2).replace('.', ',')}</div>
                          <div className="text-[10px] text-green-600 font-medium mb-1.5">Pix: R$ {product.pixPrice.toFixed(2).replace('.', ',')}</div>
                          <button className="w-full py-1.5 rounded-lg text-[11px] font-black text-white hover:opacity-90 active:scale-95 transition-all"
                            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
                            VER KIT
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PIX BANNER */}
      <section className="py-6 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)" }}>
            <p className="text-green-200 text-xs font-bold tracking-widest uppercase mb-1">Desconto Exclusivo</p>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">10% OFF PAGANDO NO PIX</h3>
            <p className="text-green-100 text-sm mb-4">Aprovação instantânea. Sem taxas. Frete grátis.</p>
            <Link href="/produto/album-250-figurinhas">
              <button className="px-7 py-2.5 rounded-xl font-black text-sm bg-white hover:bg-gray-50 transition-all shadow"
                style={{ color: "#166534" }}>
                QUERO O DESCONTO PIX
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS — Sphere Coverflow */}
      <section className="py-10 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-black tracking-widest uppercase text-green-700 mb-1">+1.847 avaliações verificadas</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">O que nossos clientes dizem</h2>
          </div>
          <SphereCarousel />
        </div>
      </section>

      {/* DEPOIMENTOS EM VÍDEO */}
      <section className="py-12 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-black tracking-widest uppercase text-green-700 mb-1">📦 Chegou certinho!</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Clientes que receberam e aprovaram</h2>
            <p className="text-sm text-gray-500 mt-1">Veja quem já garantiu o kit e recebeu em casa</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { mediaId: "h9j9o2l9vc", aspect: 0.5625, name: "Vanessa Santos", city: "São Paulo, SP", stars: 5 },
              { mediaId: "p8ikrk6u0t", aspect: 0.5625, name: "Roberta Soares", city: "Rio de Janeiro, RJ", stars: 5 },
              { mediaId: "egdiv3fvbn", aspect: 0.75,   name: "Ana Lima",        city: "Belo Horizonte, MG", stars: 5 },
              { mediaId: "4jk3s1rj65", aspect: 0.75,   name: "Patrícia Mendes", city: "Curitiba, PR", stars: 5 },
            ].map((dep) => (
              <div key={dep.mediaId} className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <WistiaPlayer mediaId={dep.mediaId} aspect={dep.aspect} />
                <div className="px-3 py-2.5">
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: dep.stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-900 whitespace-nowrap">{dep.name}</p>
                  <p className="text-[11px] text-gray-400 whitespace-nowrap">{dep.city}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2.5">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-semibold text-green-700">+14.000 pedidos entregues em todo o Brasil</span>
            </div>
          </div>
        </div>
      </section>

      {/* GARANTIA 90 DIAS */}
      <section className="py-10 bg-white px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden border-2"
            style={{ borderColor: "#16a34a", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }} />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15 pointer-events-none"
              style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                  <ShieldCheck className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="inline-block bg-green-600 text-white text-xs font-black px-3 py-1 rounded-full mb-3 tracking-wider uppercase shadow">
                Garantia Total
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
                Garantia de <span className="text-green-600">90 Dias</span>
              </h3>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4 max-w-lg mx-auto">
                Se por qualquer motivo você não ficar satisfeito com o seu kit, <strong>devolvemos 100% do seu dinheiro</strong> sem burocracia, sem perguntas. Sua satisfação é nossa prioridade.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  { icon: "🔒", label: "Compra 100% Segura" },
                  { icon: "💸", label: "Reembolso Total Garantido" },
                  { icon: "📦", label: "Produto Original Panini" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-green-100 flex flex-col items-center gap-1.5">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[11px] font-semibold text-gray-700 leading-snug text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ — OBJEÇÕES PRINCIPAIS */}
      <section className="py-10 bg-gray-50 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-black tracking-widest uppercase text-green-700 mb-1">Tire suas dúvidas</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Perguntas Frequentes</h2>
          </div>
          <HomeFaqSection />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-10 bg-white px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">
            Não deixe seu filho ficar<br />
            <span style={{ color: "#E09400" }}>sem o álbum da Copa!</span>
          </h2>
          <p className="text-gray-500 text-sm">Estoque limitado. Produto 100% original Panini.</p>
          <Link href="/produto/album-250-figurinhas">
            <button className="w-full sm:w-auto px-10 py-4 rounded-xl font-black text-base text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb, #1d4ed8)" }}>
              GARANTIR MEU KIT — R$ 49,00
            </button>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Compra Segura</span>
            <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-green-600" /> Frete Grátis</span>
          </div>
        </div>
      </section>

    </div>
  );
}
