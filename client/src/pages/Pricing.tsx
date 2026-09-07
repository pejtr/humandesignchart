import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Check, FileText, Gift, Heart, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { getRedditClickIdForCapi } from "@/hooks/useRedditPixel";

function formatPrice(amountMinor: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amountMinor / 100);
}

export default function Pricing() {
  const { locale } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { viewContent, initiateCheckout } = useMetaPixel();
  const isCs = locale === "cs";
  const [includePartnerAddon, setIncludePartnerAddon] = useState(false);
  const [voluntaryTopUpMinor, setVoluntaryTopUpMinor] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [showVoucher, setShowVoucher] = useState(false);
  const offerQuery = trpc.subscription.blueprintOffer.useQuery({ locale: isCs ? "cs" : "en" });
  const statusQuery = trpc.subscription.status.useQuery(undefined, { enabled: isAuthenticated });

  useSEO({ title: isCs ? "Honorace — Členství a dobrovolná podpora | Human Design" : "Honorarium — Membership and voluntary support | Human Design", description: isCs ? "Transparentní minimální honorace za službu a dobrovolná podpora dalšího rozvoje." : "Transparent minimum service prices and optional voluntary support.", ogImage: OG_IMAGES.default, ogUrl: `${window.location.origin}/${locale}/honorace`, locale: isCs ? "cs_CZ" : "en_US" });

  useEffect(() => {
    viewContent({ content_name: "Personal Human Design Blueprint", content_category: "report", content_ids: ["blueprint"], content_type: "product", value: (offerQuery.data?.amountMinor ?? 29000) / 100 });
  }, [offerQuery.data?.amountMinor, viewContent]);

  const checkout = trpc.subscription.createCheckout.useMutation({ onSuccess: ({ url }) => { if (url) window.location.assign(url); }, onError: error => toast.error(error.message) });
  const redeemVoucher = trpc.giftVoucher.redeem.useMutation({ onSuccess: () => { toast.success(isCs ? "Dárkový kód byl uplatněn." : "Gift voucher redeemed."); setVoucherCode(""); }, onError: error => toast.error(error.message) });
  const offer = offerQuery.data;
  const hasBlueprintAccess = Boolean(statusQuery.data?.isPremium || (statusQuery.data?.blueprintPdfCredits ?? 0) > 0);
  const price = offer ? formatPrice(offer.amountMinor, offer.currency, locale) : "…";
  const addonPrice = offer ? formatPrice(offer.partnerAddon.amountMinor, offer.currency, locale) : "…";
  const totalAmountMinor = offer ? offer.amountMinor + (includePartnerAddon ? offer.partnerAddon.amountMinor : 0) + voluntaryTopUpMinor : 0;
  const totalPrice = offer ? formatPrice(totalAmountMinor, offer.currency, locale) : "…";

  const beginCheckout = () => {
    if (!user) return window.location.assign(getLoginUrl());
    if (hasBlueprintAccess) return navigate(`/${locale}/dashboard`);
    if (!offer) return;
    initiateCheckout(totalAmountMinor / 100, { content_name: "Personal Human Design Blueprint", content_category: "report", content_ids: includePartnerAddon ? ["blueprint", "blueprint_partner"] : ["blueprint"], content_type: "product", num_items: includePartnerAddon ? 2 : 1 });
    checkout.mutate({ plan: "blueprint", locale, origin: window.location.origin, includePartnerAddon, voluntaryTopUpMinor, redditClickId: getRedditClickIdForCapi() });
  };
  const redeem = () => {
    if (!user) return window.location.assign(getLoginUrl());
    if (voucherCode.trim()) redeemVoucher.mutate({ code: voucherCode.trim() });
  };
  const features = isCs
    ? ["Vaše hlavní síla a způsob rozhodování", "Profil, centra, brány a kanály v souvislostech", "Praktický textový výklad a PDF Blueprint", "5 navazujících AI výkladů pro vaši mapu", "Doporučení pro práci, vztahy a každodenní rozhodování"]
    : ["Your core strength and decision-making approach", "Profile, centres, gates and channels in context", "Practical written reading and a PDF Blueprint", "5 follow-up AI readings for your chart", "Guidance for work, relationships and daily decisions"];

  return <div className="min-h-screen bg-[#fcfbff] text-slate-950">
    <Navbar offerMode />
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-8 md:pt-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800"><Sparkles className="size-4" /> {isCs ? "Honorace · jasně před potvrzením" : "Honorarium · clear before confirmation"}</p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-6xl">{isCs ? "Podpořte jen to, co vám dává smysl." : "Support only what feels meaningful to you."}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{isCs ? "Minimum kryje samotnou službu. Pokud chcete, můžete honoraci dobrovolně navýšit — bez odlišných funkcí, statusu nebo skrytých podmínek." : "The minimum covers the service itself. If you wish, you can voluntarily add support — with no different features, status or hidden conditions."}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"><LockKeyhole className="size-4 text-violet-600" /> {isCs ? "Bez předplatného" : "No subscription"}</span><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"><FileText className="size-4 text-violet-600" /> {isCs ? "Jednorázový nákup" : "One-time purchase"}</span></div>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-white p-4 shadow-xl shadow-violet-100/60"><img src="/images/brand/veleknezka-master-v1.png" width={941} height={1672} alt={isCs ? "Marie, průvodkyně Human Designem" : "Marie, Human Design guide"} className="aspect-[941/1672] w-full rounded-[1.35rem] object-cover object-top" /></div>
      </section>
      <section className="mx-auto max-w-4xl px-5 pb-16 md:px-8"><div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl md:p-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">{isCs ? "OMNI HD LAB · DEEP" : "OMNI HD LAB · DEEP"}</p><h2 className="mt-3 font-serif text-3xl">{isCs ? "Osobní hlubší rozbor vaší mapy." : "Personal deep reading of your chart."}</h2></div><div className="text-left sm:text-right"><p className="text-3xl font-bold">{price}</p><p className="mt-1 text-sm text-slate-500">{isCs ? "jednorázový nákup" : "one-time purchase"}</p></div></div><p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">{isCs ? "Získáváte kompletní osobní rozbor pro rozhodování, vztahy a práci v PDF, na webu i v audiu + permanentní uložení profilu." : "You get a complete personal reading for decision making, relationships and work in PDF, web & audio + permanent profile access."}</p><ul className="mt-8 grid gap-4 md:grid-cols-2">{features.map(feature => <li key={feature} className="flex gap-3 text-slate-700"><Check className="mt-0.5 size-5 shrink-0 text-emerald-600" />{feature}</li>)}</ul><Button size="lg" className="mt-6 w-full rounded-xl bg-[#C59235] py-6 text-base hover:bg-[#B88326] text-white shadow-md font-bold" onClick={beginCheckout} disabled={checkout.isPending || offerQuery.isLoading}>{hasBlueprintAccess ? (isCs ? "Otevřít moji mapu" : "Open my chart") : (isCs ? "Vytvořit OMNI HD LAB · DEEP (390 Kč)" : "Create OMNI HD LAB · DEEP (390 CZK)")}</Button><p className="mt-4 text-center text-sm text-slate-500">{offer?.delivery ?? (isCs ? "Přístup ihned po potvrzení platby." : "Access immediately after payment confirmation.")}</p></div></section>
      <section className="border-y border-amber-100 bg-amber-50/40 py-14"><div className="mx-auto max-w-5xl px-5 md:px-8"><h2 className="font-serif text-3xl">{isCs ? "Členství ORACULUM+ " : "ORACULUM+ Membership"}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{isCs ? "Průběžná hodnota, denní tranzity, reflexní deník a výhledy. Roční variantu s vyhodnocením připravujeme." : "Ongoing insights, daily transits, reflection journal and perspectives."}</p><div className="mt-8 grid gap-5 md:grid-cols-3">{[{ name: "ORACULUM+", minimum: "189 Kč / měsíc", recommended: "1 190 Kč / rok (-47 %)" }].map(tier => <div key={tier.name} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><p className="font-serif text-2xl font-bold">{tier.name}</p><p className="mt-3 text-sm font-semibold text-slate-700">{tier.minimum}</p><p className="text-xs text-amber-700 font-medium">{tier.recommended}</p></div>)}</div></div></section>
      <section className="border-y border-violet-100 bg-white py-14"><div className="mx-auto max-w-5xl px-5 md:px-8"><h2 className="font-serif text-3xl">{isCs ? "Jak to funguje" : "How it works"}</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{[isCs ? "Vypočítáte si mapu zdarma." : "Calculate your free chart.", isCs ? "Vyberete Blueprint pro svou mapu." : "Choose a Blueprint for your chart.", isCs ? "Po potvrzení platby pokračujete ve svém účtu." : "Continue in your account after payment confirmation."].map((step, index) => <div key={step} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-sm font-bold text-violet-700">0{index + 1}</p><p className="mt-3 font-medium text-slate-700">{step}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8"><div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="inline-flex items-center gap-2 font-semibold"><Heart className="size-4 text-rose-500" />{isCs ? "MAAT — vědomý přístup k Human Designu" : "MAAT — a conscious approach to Human Design"}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{isCs ? "Blueprint nenahrazuje vlastní zkušenost ani odbornou péči. Je to pozvání dívat se na sebe s větší pozorností a ověřovat si, co vám skutečně funguje." : "The Blueprint does not replace lived experience or professional care. It is an invitation to observe what truly works for you."}</p></div></section>
      <section className="mx-auto max-w-3xl px-5 pb-16 md:px-8"><h2 className="font-serif text-3xl">{isCs ? "Časté otázky" : "Frequently asked questions"}</h2><Accordion type="single" collapsible className="mt-5 rounded-2xl border border-slate-200 bg-white px-5"><AccordionItem value="access"><AccordionTrigger>{isCs ? "Kdy Blueprint dostanu?" : "When will I receive the Blueprint?"}</AccordionTrigger><AccordionContent>{isCs ? "Po potvrzení platby se přístup připraví ve vašem účtu. Pokud je potřeba další zpracování, stav vám ukážeme přímo v účtu." : "After payment confirmation, access is prepared in your account. If further processing is required, its status is shown there."}</AccordionContent></AccordionItem><AccordionItem value="subscription"><AccordionTrigger>{isCs ? "Je to předplatné?" : "Is this a subscription?"}</AccordionTrigger><AccordionContent>{isCs ? "Ne. Blueprint je jednorázový nákup. Budoucí členství Marie bude vždy uvedeno samostatně před potvrzením objednávky." : "No. Blueprint is a one-time purchase. Any future Marie membership will always be presented separately before checkout."}</AccordionContent></AccordionItem><AccordionItem value="gift"><AccordionTrigger>{isCs ? "Mám dárkový kód" : "I have a gift voucher"}</AccordionTrigger><AccordionContent><Button variant="outline" size="sm" onClick={() => setShowVoucher(true)}><Gift className="mr-2 size-4" />{isCs ? "Uplatnit dárkový kód" : "Redeem gift voucher"}</Button></AccordionContent></AccordionItem></Accordion></section>
      {showVoucher && <section className="mx-auto mb-16 max-w-xl rounded-2xl border border-violet-200 bg-white p-6 shadow-lg"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl">{isCs ? "Uplatnit dárkový kód" : "Redeem gift voucher"}</h2><Button variant="ghost" size="sm" onClick={() => setShowVoucher(false)}>{isCs ? "Zavřít" : "Close"}</Button></div><div className="mt-4 flex gap-2"><Input value={voucherCode} onChange={event => setVoucherCode(event.target.value)} placeholder={isCs ? "Vložte dárkový kód" : "Enter your gift voucher"} /><Button onClick={redeem} disabled={redeemVoucher.isPending}>{isCs ? "Uplatnit" : "Redeem"}</Button></div></section>}
    </main>
    <Footer />
  </div>;
}
