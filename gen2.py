import sys
with open("server/data/angelNumbers.ts", "r", encoding="utf-8") as f:
    orig_content = f.read()

prefix = orig_content[:orig_content.find("export function getAngelNumberBySlug")]
# find the last `];`
idx = prefix.rfind("];")
if idx != -1:
    prefix = prefix[:idx]

js_code = prefix

extra_numbers = [
    ("444-vyznam", "444", "Andělské číslo 444: Nejvyšší ochrana a stabilita", "ochrana", "Generátor — stabilní a vytrvalá energie"),
    ("555-vyznam", "555", "Andělské číslo 555: Velká životní transformace", "transformace", "Slezina — adaptace na změny"),
    ("666-vyznam", "666", "Andělské číslo 666: Rovnováha a materiální svět", "hojnost", "Ego centrum — materiální rovnováha"),
    ("777-vyznam", "777", "Andělské číslo 777: Spirituální požehnání a intuice", "probuzeni", "Korunní centrum — spirituální inspirace"),
    ("888-vyznam", "888", "Andělské číslo 888: Finanční hojnost a prosperita", "hojnost", "Ego centrum — manifestace hmoty"),
    ("999-vyznam", "999", "Andělské číslo 999: Uzavření cyklu a nový prostor", "transformace", "Kořenové centrum — puštění tlaku minulosti"),
    ("000-vyznam", "000", "Andělské číslo 000: Nekonečný potenciál a čistý štít", "probuzeni", "Reflektor — nekonečná zrcadlící kapacita"),
    ("1010-vyznam", "1010", "Andělské číslo 1010: Duchovní probuzení a akce", "probuzeni", "Manifestující Generátor — rychlý duchovní růst"),
    ("1212-vyznam", "1212", "Andělské číslo 1212: Hluboké vztahy a podpora", "laska", "Centrum G — láska a identita"),
    ("1234-vyznam", "1234", "Andělské číslo 1234: Postupný růst a správná cesta", "manifestace", "Generátor — krok za krokem k cíli"),
    ("2222-vyznam", "2222", "Andělské číslo 2222: Dokonalá rovnováha a mír", "ochrana", "Projektor — mistrovství v rovnováze"),
    ("3333-vyznam", "3333", "Andělské číslo 3333: Božské vedení a silná tvorba", "manifestace", "Hrdlové centrum — silná komunikace"),
    ("4444-vyznam", "4444", "Andělské číslo 4444: Tvrdá práce se vyplácí", "hojnost", "Sakrální centrum — konzistentní výkon"),
    ("5555-vyznam", "5555", "Andělské číslo 5555: Masivní životní zlom", "transformace", "Poloviční definice — touha po celistvosti"),
    ("twin-flame-andelska-cisla", "Twin Flame", "Andělská čísla pro Twin Flame: Zjistěte, zda je blízko", "laska", "Vztahová (Composite) mapa"),
    ("andelska-cisla-v-lasce", "Láska", "Andělská čísla a Láska: Která čísla přitahují partnera?", "laska", "Solární plexus — emoce a vztahy"),
    ("proc-vidim-stejna-cisla", "?", "Proč stále vidím stejná čísla? Význam probuzení", "probuzeni", "Otevřená centra — vnímavost vlivům"),
    ("zrcadlove-casy", "11:11", "Zrcadlové časy: Co znamenají hodiny 11:11, 22:22?", "probuzeni", "Reflektor — čisté zrcadlo"),
    ("andelska-cisla-a-human-design", "HD", "Andělská čísla a Human Design: Tajemné propojení", "pruvodce", "Všechny typy"),
    ("11-vyznam", "11", "Andělské číslo 11: Mistrovské číslo inspirace", "probuzeni", "Brána 11 — brána idejí"),
    ("22-vyznam", "22", "Andělské číslo 22: Mistrovské číslo budovatelů", "hojnost", "Brána 22 — brána milosti"),
    ("33-vyznam", "33", "Andělské číslo 33: Mistrovské číslo soucitu", "laska", "Brána 33 — brána ústupu"),
    ("44-vyznam", "44", "Andělské číslo 44: Léčení rodových linií", "transformace", "Brána 44 — brána pozornosti"),
    ("55-vyznam", "55", "Andělské číslo 55: Osobní svoboda a nezávislost", "transformace", "Brána 55 — brána ducha"),
    ("andelska-cisla-penize-hojnost", "$", "Která andělská čísla přinášejí peníze a hojnost?", "hojnost", "Srdce/Ego — materiální hojnost"),
    # New 20 viral articles
    ("1144-vyznam", "1144", "Andělské číslo 1144: Využijte svůj potenciál", "manifestace", "Manifestujúci Generátor - rychlý potenciál"),
    ("717-vyznam", "717", "Andělské číslo 717: Vaše spiritualita se prohlubuje", "probuzeni", "Slezinové centrum - jemná intuice"),
    ("818-vyznam", "818", "Andělské číslo 818: Finanční posun a sebedůvěra", "hojnost", "Ego centrum - sebehodnota"),
    ("1221-vyznam", "1221", "Andělské číslo 1221: Změna perspektivy a naděje", "transformace", "Ajna - konceptualizace"),
    ("andelska-cisla-tehotenstvi", "Baby", "Andělská čísla signalizující těhotenství a rodinu", "laska", "Sakrální centrum - tvoření života"),
    ("karmicka-cisla", "Karma", "Karmická čísla v numerologii a andělském kódu", "transformace", "Kořenové centrum - karmický tlak"),
    ("911-vyznam", "911", "Andělské číslo 911: Světlonoš a záchrana", "ochrana", "Projektor - vedení ostatních"),
    ("414-vyznam", "414", "Andělské číslo 414: Vaše andělská základna je pevná", "ochrana", "Generátor - pevný základ"),
    ("616-vyznam", "616", "Andělské číslo 616: Pozitivní výsledek už brzy", "manifestace", "Manifestor - přivolání výsledku"),
    ("313-vyznam", "313", "Andělské číslo 313: Velký průlom ve vaší kariéře", "hojnost", "Hrdlové centrum - akce a průlom"),
    ("0101-vyznam", "0101", "01:01 Zrcadlový čas: Co znamená v lásce?", "laska", "Centrum G - cesta lásky"),
    ("2121-vyznam", "2121", "21:21 Zrcadlový čas: Vzájemné porozumění", "laska", "Solární plexus - emoční propojení"),
    ("1515-vyznam", "1515", "15:15 Zrcadlový čas: Velká změna na obzoru", "transformace", "Slezinové centrum - příprava na změnu"),
    ("2020-vyznam", "2020", "20:20 Zrcadlový čas: Pravda vyjde najevo", "probuzeni", "Ajna - jasné vidění"),
    ("2323-vyznam", "2323", "23:23 Zrcadlový čas: Andělé stojí po vašem boku", "ochrana", "Kořenové centrum - uvolnění se do důvěry"),
    ("andelska-cisla-pro-ochranu", "Štít", "Nejsilnější andělská čísla pro ochranu a štít", "ochrana", "Všechny typy - energetická imunita"),
    ("jak-si-vypocitat-andelske-cislo", "Kalkulátor", "Jak zjistit své osobní andělské číslo z data narození", "pruvodce", "Profil (např. 1/3)"),
    ("cisla-z-nemocnice-nebo-smrti", "Přízrak", "Znamenají některá andělská čísla něco špatného?", "ochrana", "Slezina - strachy mírněny intuicí"),
    ("andelske-znameni-na-obloze", "☁", "Andělská znamení mimo čísla: Peříčka a zvířata", "pruvodce", "Všechny otevřená centra - vnímavost"),
    ("manifestace-369", "3-6-9", "Nikola Tesla a kód 369: Jak manifestovat realitu", "manifestace", "Manifestor - síla iniciace")
]

import random

for slug, num, title, cat, hd in extra_numbers:
    colors = ['bg-gradient-to-br from-indigo-100 to-purple-100', 'bg-gradient-to-br from-pink-100 to-rose-100', 'bg-gradient-to-br from-amber-100 to-orange-100', 'bg-gradient-to-br from-emerald-100 to-teal-100', 'bg-gradient-to-br from-blue-100 to-cyan-100']
    icons = ['Sparkles', 'Star', 'Shield', 'Zap', 'Heart', 'Moon', 'Sun']
    
    catLabel = "Průvodce"
    if cat == "manifestace": catLabel = "Manifestace"
    if cat == "ochrana": catLabel = "Ochrana"
    if cat == "transformace": catLabel = "Transformace"
    if cat == "laska": catLabel = "Láska"
    if cat == "hojnost": catLabel = "Hojnost"
    if cat == "probuzeni": catLabel = "Probuzení"

    article = f"""
  {{
    slug: "{slug}",
    number: "{num}",
    title: "{title}",
    metaTitle: "{title} | Význam a symbolika",
    metaDescription: "Přečtěte si kompletní význam andělského čísla {num}. Objevte, co vám chtějí andělé vzkázat v oblasti lásky, kariéry a duchovního rozvoje.",
    excerpt: "Číslo {num} se vám neukazuje náhodou. Vaši strážní andělé se vám snaží poslat důležitou zprávu, která může změnit váš pohled na aktuální situaci.",
    category: "{cat}",
    categoryLabel: "{catLabel}",
    readingTime: 6,
    publishedAt: "2026-07-04",
    updatedAt: "2026-07-13",
    coverColor: "{random.choice(colors)}",
    coverIcon: "{random.choice(icons)}",
    tags: ["{num}", "{catLabel.lower()}", "andělská čísla", "numerologie", "poselství"],
    relatedNumbers: ["111", "222", "333", "444", "555"],
    hdConnection: "{hd}",
    faq: [
      {{ question: "Co znamená andělské číslo {num}?", answer: "Toto číslo je silným znamením od vesmíru. Značí, že vaše současné myšlenky a činy jsou energeticky podporovány z vyšších sfér." }},
      {{ question: "Co dělat, když vidím {num}?", answer: "Zastavte se a buďte vnímaví ke svým pocitům. Vesmír vám posílá toto číslo jako synchronicitu v pravý čas." }},
      {{ question: "Znamená {num} něco v lásce?", answer: "Ano, všechna andělská čísla ovlivňují vztahovou rovinu. {num} obvykle nese poselství důvěry a propojování s vaší spřízněnou duší." }},
    ],
    content: `## Poselství čísla {num}

Každé andělské číslo je klíčem k pochopení naší cesty. Když vidíte **{num}**, andělé se vás snaží upozornit na silnou energetickou bránu, která se před vámi právě otevírá. Numerologie vždy vychází z univerzálních zákonů a čísla na nás mluví jazykem synchronicity.

### Trpělivost a víra v proces
Všímejte si, na co jste přesně mysleli, když se před vámi {num} objevilo na hodinách nebo poznávací značce. Odpověď často spočívá v této úvodní myšlence. Čísla nesou kód, který pomáhá uklidnit naši mysl a přinést nám hlubší ujištění.

## Proč {num} vídáte v životě?
Když se andělé rozhodnou intervenovat, často k tomu používají právě číselné kódování. Je to nejjednodušší způsob, jak upoutat naši pozornost v materiálním, uspěchaném světě. Váš strážný anděl ví, že dříve nebo později vašemu vědomí neunikne.

### Láska a vztahy
Číslo {num} ovlivňuje naše osobní vibrace v partnerství. Nezadaní by se měli otevřít novým příležitostem, zatímco zadaným toto číslo přináší stabilitu, růst nebo potřebnou pozitivní změnu. U Twin Flame spojení je to téměř vždy ukazatel pokroku v lekcích obou partnerů.

## Human Design a {num}
V kontextu vašeho bodygraphu, Human Design analyzuje energii stejně přesně jako andělská čísla. **{hd}** má hlubokou souvislost s vibrací čísla {num}. Lidé s určitým nastavením mají větší tendenci vidět konkrétní číselné řady.

**[Zajímá vás váš Human Design typ? Vypočítejte si mapu zdarma →](/cs/calculate)**`
  }},"""
    js_code += article

js_code += """
];

export function getAngelNumberBySlug(slug: string): AngelNumberArticle | undefined {
  return ANGEL_NUMBERS.find(a => a.slug === slug);
}

export function getAngelNumbersByCategory(category: string): AngelNumberArticle[] {
  return ANGEL_NUMBERS.filter(a => a.category === category);
}

export function getRelatedAngelNumbers(slug: string, limit = 4): AngelNumberArticle[] {
  const article = getAngelNumberBySlug(slug);
  if (!article) return [];
  return ANGEL_NUMBERS
    .filter(a => a.slug !== slug && (a.relatedNumbers.includes(article.number) || a.category === article.category))
    .slice(0, limit);
}

export { ANGEL_NUMBERS as angelNumbers };
"""

with open("server/data/angelNumbers.ts", "w", encoding="utf-8") as f:
    f.write(js_code)
print("Updated successfully")
