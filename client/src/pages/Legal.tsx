import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { SELLER_INFO, isPlaceholder } from "@shared/sellerInfo";

// Keep unfinished drafts out of search results until every placeholder is filled.
const HAS_PLACEHOLDERS = Object.values(SELLER_INFO).some(isPlaceholder);

export type LegalDoc = "terms" | "privacy" | "withdrawal";

type Section = { heading: string; body: ReactNode[] };
type LegalContent = { title: string; description: string; sections: Section[] };

/** Seller detail; placeholders are highlighted so an unfinished page is obvious. */
function S({ field }: { field: keyof typeof SELLER_INFO }) {
  const value = SELLER_INFO[field];
  return isPlaceholder(value) ? <mark className="rounded bg-amber-200 px-1 text-amber-950">{value}</mark> : <>{value}</>;
}

function SellerBlock() {
  return (
    <span className="block rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <S field="name" />, <S field="address" />
      <br />
      IČO: <S field="companyId" />, <S field="vatStatus" />
      <br />
      <S field="registry" />
      <br />
      E-mail: <S field="email" />, tel.: <S field="phone" />
    </span>
  );
}

function L({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="text-violet-700 underline underline-offset-2">{children}</a>;
}

function termsCs(path: (p: string) => string): LegalContent {
  return {
    title: "Obchodní podmínky",
    description: "Obchodní podmínky pro nákup digitálního obsahu a členství na webu Human Design Chart.",
    sections: [
      { heading: "1. Prodávající", body: [<SellerBlock key="s" />, "Tyto obchodní podmínky upravují práva a povinnosti mezi prodávajícím a kupujícím při nákupu digitálního obsahu a služeb prostřednictvím tohoto webu. Vztahy neupravené těmito podmínkami se řídí českým právem, zejména zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 634/1992 Sb., o ochraně spotřebitele."] },
      { heading: "2. Předmět a cena", body: ["Předmětem koupě je digitální obsah (zejména osobní rozbor OMNI HD LAB · DEEP / Blueprint ve formě webové stránky, PDF a audia a navazující AI výklady) nebo členství s průběžným přístupem k funkcím webu.", <>Ceny jsou uvedeny u nabídky před odesláním objednávky a jsou konečné. Prodávající je <S field="vatStatus" />. Jednorázový nákup není předplatné; členství se platí opakovaně za zvolené období, dokud jej kupující nezruší.</>] },
      { heading: "3. Objednávka a uzavření smlouvy", body: ["Pro nákup je nutné přihlášení k uživatelskému účtu. Kupující před zaplacením vidí cenu a obsah objednávky. Smlouva je uzavřena okamžikem potvrzení platby platební bránou.", "Platby zpracovávají Stripe (karty, Apple Pay, Google Pay a další metody) a Comgate (karty, bankovní tlačítka, QR platby). Prodávající nemá přístup k údajům platebních karet."] },
      { heading: "4. Dodání", body: ["Digitální obsah je zpřístupněn v uživatelském účtu ihned po potvrzení platby. Pokud je potřeba další zpracování, stav je zobrazen v účtu. Pokud obsah nebude zpřístupněn do 24 hodin, kontaktujte nás na uvedeném e-mailu."] },
      { heading: "5. Odstoupení od smlouvy", body: [<>Spotřebitel může od smlouvy odstoupit bez udání důvodu do 14 dnů od jejího uzavření. U digitálního obsahu, který není dodáván na hmotném nosiči, toto právo zaniká, pokud bylo s jeho dodáním započato s předchozím výslovným souhlasem spotřebitele a spotřebitel vzal na vědomí, že tím právo na odstoupení ztrácí (§ 1837 písm. l) občanského zákoníku). Tento souhlas se uděluje zaškrtnutím při objednávce.</>, <>Postup a vzorový formulář najdete na stránce <L href={path("/withdrawal")}>Odstoupení a reklamace</L>. Členství lze kdykoli zrušit v účtu; zůstává aktivní do konce zaplaceného období.</>] },
      { heading: "6. Práva z vadného plnění", body: [<>Pokud digitální obsah nefunguje, není dostupný nebo neodpovídá popisu, má kupující práva z vadného plnění podle § 2389a a násl. občanského zákoníku. Reklamaci uplatněte na <S field="email" />; vyřídíme ji bez zbytečného odkladu, nejpozději do 30 dnů.</>] },
      { heading: "7. Povaha obsahu", body: ["Human Design je nástroj sebepoznání. Výklady, včetně textů generovaných umělou inteligencí, nejsou lékařskou, psychologickou, právní ani finanční radou a nenahrazují odbornou péči."] },
      { heading: "8. Mimosoudní řešení sporů", body: [<>K mimosoudnímu řešení spotřebitelských sporů je příslušná Česká obchodní inspekce, <L href="https://adr.coi.cz">adr.coi.cz</L>. Dozor nad dodržováním povinností vykonává Česká obchodní inspekce a v oblasti osobních údajů Úřad pro ochranu osobních údajů.</>] },
      { heading: "9. Závěrečná ustanovení", body: [<>Zpracování osobních údajů popisují <L href={path("/privacy")}>Zásady ochrany osobních údajů</L>. Tyto podmínky jsou účinné od <S field="effectiveDate" />.</>] },
    ],
  };
}

function termsEn(path: (p: string) => string): LegalContent {
  return {
    title: "Terms and Conditions",
    description: "Terms for purchasing digital content and membership on Human Design Chart.",
    sections: [
      { heading: "1. Seller", body: [<SellerBlock key="s" />, "These terms govern purchases of digital content and services on this website. Czech law applies, in particular Act No. 89/2012 Coll. (Civil Code) and Act No. 634/1992 Coll. (Consumer Protection), without limiting the mandatory consumer protection of your country of residence."] },
      { heading: "2. Subject and price", body: ["You buy digital content (in particular the personal OMNI HD LAB · DEEP / Blueprint reading as a web page, PDF and audio, plus follow-up AI readings) or a membership with ongoing access to site features.", <>Prices are shown with the offer before you place the order and are final. VAT status: <S field="vatStatus" />. A one-time purchase is not a subscription; a membership renews for the chosen period until cancelled.</>] },
      { heading: "3. Order and contract", body: ["You need to be signed in to buy. You see the price and contents before paying. The contract is concluded when the payment gateway confirms the payment.", "Payments are processed by Stripe and Comgate. The seller never has access to your card details."] },
      { heading: "4. Delivery", body: ["Digital content is made available in your account immediately after payment confirmation. If it is not available within 24 hours, contact us at the e-mail above."] },
      { heading: "5. Right of withdrawal", body: ["Consumers may withdraw within 14 days of the contract without giving a reason. For digital content not supplied on a tangible medium, this right ends once delivery has begun with your prior express consent and your acknowledgement that you thereby lose the right of withdrawal. You give this consent with the checkbox at checkout.", <>See <L href={path("/withdrawal")}>Withdrawal and complaints</L> for the procedure and model form. Memberships can be cancelled any time in your account and stay active until the end of the paid period.</>] },
      { heading: "6. Defective content", body: [<>If the digital content does not work, is unavailable, or does not match its description, you have statutory rights for defective performance. Send complaints to <S field="email" />; we resolve them without undue delay and within 30 days at the latest.</>] },
      { heading: "7. Nature of the content", body: ["Human Design is a self-reflection tool. Readings, including AI-generated text, are not medical, psychological, legal or financial advice and do not replace professional care."] },
      { heading: "8. Out-of-court dispute resolution", body: [<>The Czech Trade Inspection Authority handles out-of-court consumer disputes: <L href="https://adr.coi.cz/en">adr.coi.cz</L>.</>] },
      { heading: "9. Final provisions", body: [<>Personal data processing is described in the <L href={path("/privacy")}>Privacy Policy</L>. These terms are effective from <S field="effectiveDate" />.</>] },
    ],
  };
}

const PROCESSORS_CS = "Stripe a Comgate (platby); Google, Meta (Facebook) a Apple (přihlášení); Google Analytics, Google Ads, Meta Pixel a Conversions API, Reddit a Seznam Sklik (měření a reklama, jen se souhlasem); poskytovatel AI modelu pro generování výkladů (Google Gemini nebo jiný nastavený model); ElevenLabs (audio); Brevo (e-maily); Fakturoid (fakturace); CRM LeadOS / Optimateo; úložiště souborů; hosting.";
const PROCESSORS_EN = "Stripe and Comgate (payments); Google, Meta (Facebook) and Apple (sign-in); Google Analytics, Google Ads, Meta Pixel and Conversions API, Reddit and Seznam Sklik (measurement and advertising, only with consent); the AI model provider used for readings (Google Gemini or another configured model); ElevenLabs (audio); Brevo (e-mail); Fakturoid (invoicing); LeadOS / Optimateo CRM; file storage; hosting.";

function privacyCs(path: (p: string) => string): LegalContent {
  return {
    title: "Zásady ochrany osobních údajů",
    description: "Jak Human Design Chart zpracovává osobní údaje.",
    sections: [
      { heading: "1. Správce", body: [<SellerBlock key="s" />] },
      { heading: "2. Jaké údaje zpracováváme", body: ["Údaje účtu (jméno, e-mail, identifikátor poskytovatele přihlášení), údaje o narození zadané pro výpočet mapy (datum, čas, místo), obsah výkladů a konverzací s AI průvodcem, údaje o objednávkách a platbách (bez čísel karet), technické údaje (IP adresa, prohlížeč, cookies) a údaje o používání webu."] },
      { heading: "3. Účely a právní základy", body: ["Plnění smlouvy: účet, výpočet mapy, dodání zakoupeného obsahu, zákaznická podpora. Právní povinnost: účetnictví a daně. Oprávněný zájem: bezpečnost, prevence podvodů, zlepšování služby. Souhlas: analytické a marketingové cookies, měření konverzí pro reklamu, newsletter. Souhlas lze kdykoli odvolat v nastavení cookies nebo odkazem v e-mailu."] },
      { heading: "4. Příjemci a zpracovatelé", body: [PROCESSORS_CS, <>Hosting: <S field="hosting" />. Někteří zpracovatelé sídlí mimo EU (zejména v USA); předávání probíhá na základě rámce EU–USA pro ochranu údajů nebo standardních smluvních doložek.</>] },
      { heading: "5. Doba uložení", body: ["Údaje účtu po dobu jeho existence; po zrušení účtu je smažeme nebo anonymizujeme do 30 dnů, pokud je nemusíme uchovat ze zákona. Účetní doklady 10 let. Údaje zpracovávané na základě souhlasu do jeho odvolání."] },
      { heading: "6. Vaše práva", body: [<>Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost, vznést námitku a odvolat souhlas. Žádosti zasílejte na <S field="email" />. Máte také právo podat stížnost u Úřadu pro ochranu osobních údajů, <L href="https://uoou.gov.cz">uoou.gov.cz</L>.</>] },
      { heading: "7. Cookies", body: ["Nezbytné cookies používáme vždy. Analytické a marketingové cookies a pixely se načítají až po vašem souhlasu v liště cookies, kterou můžete kdykoli znovu otevřít a souhlas změnit."] },
      { heading: "8. Účinnost", body: [<>Tyto zásady jsou účinné od <S field="effectiveDate" />. Související: <L href={path("/terms")}>Obchodní podmínky</L>.</>] },
    ],
  };
}

function privacyEn(path: (p: string) => string): LegalContent {
  return {
    title: "Privacy Policy",
    description: "How Human Design Chart processes personal data.",
    sections: [
      { heading: "1. Controller", body: [<SellerBlock key="s" />] },
      { heading: "2. Data we process", body: ["Account data (name, e-mail, sign-in provider identifier), birth data you enter to calculate a chart (date, time, place), readings and conversations with the AI guide, order and payment data (never card numbers), technical data (IP address, browser, cookies) and usage data."] },
      { heading: "3. Purposes and legal bases", body: ["Contract: your account, chart calculation, delivery of purchases, support. Legal obligation: accounting and tax. Legitimate interest: security, fraud prevention, improving the service. Consent: analytics and marketing cookies, ad conversion measurement, newsletter. You can withdraw consent at any time in the cookie settings or via the link in any e-mail."] },
      { heading: "4. Recipients and processors", body: [PROCESSORS_EN, <>Hosting: <S field="hosting" />. Some processors are outside the EU (mainly the USA); transfers rely on the EU–US Data Privacy Framework or standard contractual clauses.</>] },
      { heading: "5. Retention", body: ["Account data for as long as the account exists; deleted or anonymised within 30 days after the account is closed unless the law requires otherwise. Accounting records for 10 years. Consent-based data until consent is withdrawn."] },
      { heading: "6. Your rights", body: [<>You have the right of access, rectification, erasure, restriction, portability, objection and to withdraw consent. Send requests to <S field="email" />. You can also complain to the Czech data protection authority, <L href="https://uoou.gov.cz/en">uoou.gov.cz</L>, or your local authority.</>] },
      { heading: "7. Cookies", body: ["Essential cookies are always used. Analytics and marketing cookies and pixels load only after you consent in the cookie banner, which you can reopen to change your choice."] },
      { heading: "8. Effective date", body: [<>Effective from <S field="effectiveDate" />. See also the <L href={path("/terms")}>Terms and Conditions</L>.</>] },
    ],
  };
}

function withdrawalCs(path: (p: string) => string): LegalContent {
  return {
    title: "Odstoupení od smlouvy a reklamace",
    description: "Jak odstoupit od smlouvy nebo reklamovat digitální obsah.",
    sections: [
      { heading: "Odstoupení do 14 dnů", body: [<>Od smlouvy můžete odstoupit do 14 dnů od jejího uzavření zasláním oznámení na <S field="email" />, například pomocí formuláře níže. Peníze vrátíme do 14 dnů od doručení odstoupení stejným způsobem, jakým jste platili.</>, <>U digitálního obsahu toto právo zaniká, jakmile s jeho dodáním začneme s vaším výslovným souhlasem uděleným při objednávce (§ 1837 písm. l) občanského zákoníku). Podrobnosti v <L href={path("/terms")}>obchodních podmínkách</L>.</>] },
      { heading: "Vzorový formulář pro odstoupení od smlouvy", body: [<span key="f" className="block whitespace-pre-line rounded-xl bg-slate-50 p-4 font-mono text-sm ring-1 ring-slate-200">{`Adresát: ${SELLER_INFO.name}, ${SELLER_INFO.address}, ${SELLER_INFO.email}

Oznamuji, že tímto odstupuji od smlouvy o dodání tohoto digitálního obsahu / poskytnutí této služby: ……
Datum objednání: ……
Jméno a příjmení spotřebitele: ……
E-mail účtu: ……
Datum: ……`}</span>] },
      { heading: "Reklamace", body: [<>Pokud zakoupený obsah nefunguje nebo neodpovídá popisu, napište na <S field="email" /> s popisem problému a e-mailem účtu. Reklamaci vyřídíme do 30 dnů a o výsledku vás informujeme e-mailem.</>] },
    ],
  };
}

function withdrawalEn(path: (p: string) => string): LegalContent {
  return {
    title: "Withdrawal and complaints",
    description: "How to withdraw from a contract or complain about digital content.",
    sections: [
      { heading: "14-day withdrawal", body: [<>You can withdraw within 14 days of the contract by notifying us at <S field="email" />, for example with the form below. We refund you within 14 days of receiving the notice, using the same payment method.</>, <>For digital content this right ends once delivery has begun with your express consent given at checkout. See the <L href={path("/terms")}>Terms and Conditions</L>.</>] },
      { heading: "Model withdrawal form", body: [<span key="f" className="block whitespace-pre-line rounded-xl bg-slate-50 p-4 font-mono text-sm ring-1 ring-slate-200">{`To: ${SELLER_INFO.name}, ${SELLER_INFO.address}, ${SELLER_INFO.email}

I hereby give notice that I withdraw from my contract for the supply of the following digital content / service: ……
Ordered on: ……
Name of consumer: ……
Account e-mail: ……
Date: ……`}</span>] },
      { heading: "Complaints", body: [<>If your purchase does not work or does not match its description, write to <S field="email" /> with a description and your account e-mail. We resolve complaints within 30 days and reply by e-mail.</>] },
    ],
  };
}

const CONTENT: Record<LegalDoc, { cs: (path: (p: string) => string) => LegalContent; en: (path: (p: string) => string) => LegalContent }> = {
  terms: { cs: termsCs, en: termsEn },
  privacy: { cs: privacyCs, en: privacyEn },
  withdrawal: { cs: withdrawalCs, en: withdrawalEn },
};

export default function Legal({ doc }: { doc: LegalDoc }) {
  const { locale, localePath } = useLanguage();
  const content = CONTENT[doc][locale === "cs" ? "cs" : "en"](localePath);
  useSEO({ title: `${content.title} | Human Design Chart`, description: content.description, ogUrl: `${window.location.origin}/${locale}/${doc}`, locale: locale === "cs" ? "cs_CZ" : "en_US", noIndex: HAS_PLACEHOLDERS });

  return (
    <div className="min-h-screen bg-[#fcfbff] text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">{content.title}</h1>
        <div className="mt-10 space-y-10">
          {content.sections.map(section => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl">{section.heading}</h2>
              <div className="mt-3 space-y-3 leading-7 text-slate-700">
                {section.body.map((paragraph, index) => <div key={index}>{paragraph}</div>)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
