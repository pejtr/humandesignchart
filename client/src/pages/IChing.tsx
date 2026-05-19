import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// I Ching hexagram data (64 hexagrams) — bilingual EN + CS
const HEXAGRAMS: Array<{
  number: number;
  name: string;
  nameCz: string;
  chinese: string;
  meaning: string;
  meaningCz: string;
  judgment: string;
  judgmentCz: string;
  image: string;
  imageCz: string;
  lines: [number, number, number, number, number, number]; // 0=yin, 1=yang from bottom to top
}> = [
  { number: 1, name: "The Creative", nameCz: "Tvůrčí", chinese: "乾", meaning: "Pure creative force, heaven, initiative", meaningCz: "Čistá tvůrčí síla, nebe, iniciativa", judgment: "The Creative works sublime success, furthering through perseverance.", judgmentCz: "Tvůrčí přináší vznešený úspěch skrze vytrvalost.", image: "The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.", imageCz: "Pohyb nebes je plný síly. Vznešený člověk se tak stává silným a neúnavným.", lines: [1,1,1,1,1,1] },
  { number: 2, name: "The Receptive", nameCz: "Přijímající", chinese: "坤", meaning: "Pure receptive force, earth, devotion", meaningCz: "Čistá přijímající síla, země, oddanost", judgment: "The Receptive brings about sublime success, furthering through the perseverance of a mare.", judgmentCz: "Přijímající přináší vznešený úspěch skrze vytrvalost klisny.", image: "The earth's condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.", imageCz: "Podmínkou země je přijímající oddanost. Vznešený člověk se šíří ducha tak nese vnější svět.", lines: [0,0,0,0,0,0] },
  { number: 3, name: "Difficulty at the Beginning", nameCz: "Obtíže na počátku", chinese: "屯", meaning: "Initial difficulty, sprouting, gathering support", meaningCz: "Počáteční obtíže, klíčení, shromažďování podpory", judgment: "Difficulty at the Beginning works supreme success. It furthers one to appoint helpers.", judgmentCz: "Obtíže na počátku přinášejí nejvyšší úspěch. Prospěšné je jmenovat pomocníky.", image: "Clouds and thunder: the image of Difficulty at the Beginning.", imageCz: "Mraky a hrom: obraz Obtíží na počátku.", lines: [1,0,0,0,1,0] },
  { number: 4, name: "Youthful Folly", nameCz: "Mladická pošetilost", chinese: "蒙", meaning: "Inexperience, learning, seeking guidance", meaningCz: "Nezkušenost, učení, hledání vedení", judgment: "Youthful Folly has success. It is not I who seek the young fool; the young fool seeks me.", judgmentCz: "Mladická pošetilost přináší úspěch. Nejsem to já, kdo hledá mladého blázna; mladý blázen hledá mě.", image: "A spring wells up at the foot of the mountain: youthful folly.", imageCz: "Pramen vyvěrá u paty hory: mladická pošetilost.", lines: [0,1,0,0,0,1] },
  { number: 5, name: "Waiting", nameCz: "Čekání", chinese: "需", meaning: "Patience, nourishment, waiting for the right moment", meaningCz: "Trpělivost, výživa, čekání na správný okamžik", judgment: "Waiting. If you are sincere, you have light and success.", judgmentCz: "Čekání. Jsi-li upřímný, máš světlo a úspěch.", image: "Clouds rise up to heaven: the image of Waiting.", imageCz: "Mraky stoupají k nebi: obraz Čekání.", lines: [1,1,1,0,1,0] },
  { number: 6, name: "Conflict", nameCz: "Spor", chinese: "讼", meaning: "Dispute, seeking resolution, inner truth", meaningCz: "Spor, hledání řešení, vnitřní pravda", judgment: "Conflict. You are sincere and are being obstructed.", judgmentCz: "Spor. Jsi upřímný, ale narážíš na překážky.", image: "Heaven and water go their opposite ways: the image of Conflict.", imageCz: "Nebe a voda jdou opačnými cestami: obraz Sporu.", lines: [0,1,0,1,1,1] },
  { number: 7, name: "The Army", nameCz: "Vojsko", chinese: "师", meaning: "Discipline, leadership, organized force", meaningCz: "Disciplína, vedení, organizovaná síla", judgment: "The Army. The army needs perseverance and a strong man.", judgmentCz: "Vojsko. Vojsko potřebuje vytrvalost a silného muže.", image: "In the middle of the earth is water: the image of the Army.", imageCz: "Uprostřed země je voda: obraz Vojska.", lines: [0,1,0,0,0,0] },
  { number: 8, name: "Holding Together", nameCz: "Soudržnost", chinese: "比", meaning: "Union, alliance, seeking connection", meaningCz: "Jednota, spojenectví, hledání spojení", judgment: "Holding Together brings good fortune.", judgmentCz: "Soudržnost přináší štěstí.", image: "On the earth is water: the image of Holding Together.", imageCz: "Na zemi je voda: obraz Soudržnosti.", lines: [0,0,0,0,1,0] },
  { number: 9, name: "Small Taming", nameCz: "Malé zkrocení", chinese: "小畜", meaning: "Gentle restraint, small accumulation", meaningCz: "Jemné omezení, malé hromadění", judgment: "The Taming Power of the Small has success. Dense clouds, no rain.", judgmentCz: "Zkrotitelská síla malého přináší úspěch. Husté mraky, žádný déšť.", image: "The wind drives across heaven: Small Taming.", imageCz: "Vítr se žene přes nebe: Malé zkrocení.", lines: [1,1,1,0,1,1] },
  { number: 10, name: "Treading", nameCz: "Chůze", chinese: "履", meaning: "Conduct, careful behavior, treading on the tiger's tail", meaningCz: "Chování, opatrné jednání, šlápnutí na tygří ocas", judgment: "Treading upon the tail of the tiger. It does not bite the man. Success.", judgmentCz: "Šlápnutí na ocas tygra. Nekousne člověka. Úspěch.", image: "Heaven above, the lake below: Treading.", imageCz: "Nebe nahoře, jezero dole: Chůze.", lines: [1,1,0,1,1,1] },
  { number: 11, name: "Peace", nameCz: "Mír", chinese: "泰", meaning: "Harmony, prosperity, heaven and earth in communion", meaningCz: "Harmonie, prosperita, nebe a země v souladu", judgment: "Peace. The small departs, the great approaches. Good fortune. Success.", judgmentCz: "Mír. Malé odchází, velké přichází. Štěstí. Úspěch.", image: "Heaven and earth unite: the image of Peace.", imageCz: "Nebe a země se spojují: obraz Míru.", lines: [1,1,1,0,0,0] },
  { number: 12, name: "Standstill", nameCz: "Stagnace", chinese: "否", meaning: "Stagnation, obstruction, withdrawal", meaningCz: "Stagnace, překážka, stažení se", judgment: "Standstill. Evil people do not further the perseverance of the superior man.", judgmentCz: "Stagnace. Zlí lidé nepomáhají vytrvalosti vznešeného člověka.", image: "Heaven and earth do not unite: Standstill.", imageCz: "Nebe a země se nespojují: Stagnace.", lines: [0,0,0,1,1,1] },
  { number: 13, name: "Fellowship", nameCz: "Společenství", chinese: "同人", meaning: "Community, fellowship with others", meaningCz: "Komunita, společenství s druhými", judgment: "Fellowship with Men in the open. Success.", judgmentCz: "Společenství s lidmi na otevřeném místě. Úspěch.", image: "Heaven together with fire: Fellowship with Men.", imageCz: "Nebe spolu s ohněm: Společenství s lidmi.", lines: [1,0,1,1,1,1] },
  { number: 14, name: "Great Possession", nameCz: "Velké vlastnictví", chinese: "大有", meaning: "Abundance, great wealth, supreme success", meaningCz: "Hojnost, velké bohatství, nejvyšší úspěch", judgment: "Possession in Great Measure. Supreme success.", judgmentCz: "Vlastnictví ve velkém měřítku. Nejvyšší úspěch.", image: "Fire in heaven above: Great Possession.", imageCz: "Oheň nahoře na nebi: Velké vlastnictví.", lines: [1,1,1,1,0,1] },
  { number: 15, name: "Modesty", nameCz: "Skromnost", chinese: "谦", meaning: "Humility, moderation, inner worth", meaningCz: "Pokora, umírněnost, vnitřní hodnota", judgment: "Modesty creates success. The superior man carries things through.", judgmentCz: "Skromnost vytváří úspěch. Vznešený člověk věci dotahuje do konce.", image: "Within the earth, a mountain: Modesty.", imageCz: "Uvnitř země hora: Skromnost.", lines: [0,0,1,0,0,0] },
  { number: 16, name: "Enthusiasm", nameCz: "Nadšení", chinese: "豫", meaning: "Inspiration, delight, harmonious movement", meaningCz: "Inspirace, radost, harmonický pohyb", judgment: "Enthusiasm. It furthers one to install helpers and to set armies marching.", judgmentCz: "Nadšení. Prospěšné je jmenovat pomocníky a dát vojskům pochodovat.", image: "Thunder comes resounding out of the earth: Enthusiasm.", imageCz: "Hrom se rozléhá ze země: Nadšení.", lines: [0,0,0,1,0,0] },
  { number: 17, name: "Following", nameCz: "Následování", chinese: "随", meaning: "Adaptation, following the flow", meaningCz: "Přizpůsobení, následování proudu", judgment: "Following has supreme success. Perseverance furthers. No blame.", judgmentCz: "Následování přináší nejvyšší úspěch. Vytrvalost prospívá. Bez viny.", image: "Thunder in the middle of the lake: Following.", imageCz: "Hrom uprostřed jezera: Následování.", lines: [1,0,0,1,1,0] },
  { number: 18, name: "Work on the Decayed", nameCz: "Práce na zkažení", chinese: "蛊", meaning: "Repair, renovation, correcting what has been spoiled", meaningCz: "Oprava, renovace, náprava toho, co bylo zkaženo", judgment: "Work on what has been spoiled has supreme success.", judgmentCz: "Práce na tom, co bylo zkaženo, přináší nejvyšší úspěch.", image: "The wind blows low on the mountain: Decay.", imageCz: "Vítr vane nízko na hoře: Zkáza.", lines: [0,1,1,0,0,1] },
  { number: 19, name: "Approach", nameCz: "Přiblížení", chinese: "临", meaning: "Drawing near, advance, becoming great", meaningCz: "Přiblížení, postup, stávání se velkým", judgment: "Approach has supreme success. Perseverance furthers.", judgmentCz: "Přiblížení přináší nejvyšší úspěch. Vytrvalost prospívá.", image: "The earth above the lake: Approach.", imageCz: "Země nad jezerem: Přiblížení.", lines: [1,1,0,0,0,0] },
  { number: 20, name: "Contemplation", nameCz: "Rozjímání", chinese: "观", meaning: "Observation, insight, viewing from above", meaningCz: "Pozorování, vhled, pohled shora", judgment: "Contemplation. The ablution has been made, but not yet the offering.", judgmentCz: "Rozjímání. Omytí bylo provedeno, ale oběť ještě ne.", image: "The wind blows over the earth: Contemplation.", imageCz: "Vítr vane nad zemí: Rozjímání.", lines: [0,0,0,0,1,1] },
  { number: 21, name: "Biting Through", nameCz: "Prokousnutí", chinese: "噬嗑", meaning: "Decisive action, justice, breaking through obstacles", meaningCz: "Rozhodná akce, spravedlnost, proražení překážek", judgment: "Biting Through has success. It is favorable to let justice be administered.", judgmentCz: "Prokousnutí přináší úspěch. Prospěšné je nechat vykonat spravedlnost.", image: "Thunder and lightning: Biting Through.", imageCz: "Hrom a blesk: Prokousnutí.", lines: [1,0,0,1,0,1] },
  { number: 22, name: "Grace", nameCz: "Půvab", chinese: "贲", meaning: "Beauty, adornment, elegance in form", meaningCz: "Krása, ozdoba, elegance formy", judgment: "Grace has success. In small matters it is favorable to undertake something.", judgmentCz: "Půvab přináší úspěch. V malých věcech je prospěšné něco podniknout.", image: "Fire at the foot of the mountain: Grace.", imageCz: "Oheň u paty hory: Půvab.", lines: [1,0,0,1,0,1] },
  { number: 23, name: "Splitting Apart", nameCz: "Rozpad", chinese: "剥", meaning: "Deterioration, stripping away, letting go", meaningCz: "Zhoršení, odstraňování, pouštění", judgment: "Splitting Apart. It does not further one to go anywhere.", judgmentCz: "Rozpad. Nikam jít nepomáhá.", image: "The mountain rests on the earth: Splitting Apart.", imageCz: "Hora spočívá na zemi: Rozpad.", lines: [0,0,0,0,0,1] },
  { number: 24, name: "Return", nameCz: "Návrat", chinese: "复", meaning: "Turning point, renewal, the return of light", meaningCz: "Zlomový bod, obnova, návrat světla", judgment: "Return. Success. Going out and coming in without error.", judgmentCz: "Návrat. Úspěch. Odcházení a přicházení bez chyby.", image: "Thunder within the earth: Return.", imageCz: "Hrom uvnitř země: Návrat.", lines: [1,0,0,0,0,0] },
  { number: 25, name: "Innocence", nameCz: "Nevinnost", chinese: "无妄", meaning: "Unexpected, naturalness, acting without ulterior motive", meaningCz: "Neočekávané, přirozenost, jednání bez postranních úmyslů", judgment: "Innocence. Supreme success. Perseverance furthers.", judgmentCz: "Nevinnost. Nejvyšší úspěch. Vytrvalost prospívá.", image: "Under heaven thunder rolls: Innocence.", imageCz: "Pod nebem se valí hrom: Nevinnost.", lines: [1,0,0,1,1,1] },
  { number: 26, name: "Great Taming", nameCz: "Velké zkrocení", chinese: "大畜", meaning: "Great accumulation, holding firm, nourishing worth", meaningCz: "Velké hromadění, pevné držení, výživa hodnoty", judgment: "The Taming Power of the Great. Perseverance furthers.", judgmentCz: "Zkrotitelská síla velkého. Vytrvalost prospívá.", image: "Heaven within the mountain: Great Taming.", imageCz: "Nebe uvnitř hory: Velké zkrocení.", lines: [1,1,1,0,0,1] },
  { number: 27, name: "Nourishment", nameCz: "Výživa", chinese: "颐", meaning: "Providing nourishment, caring for what matters", meaningCz: "Poskytování výživy, péče o to, na čem záleží", judgment: "The Corners of the Mouth. Perseverance brings good fortune.", judgmentCz: "Koutky úst. Vytrvalost přináší štěstí.", image: "At the foot of the mountain, thunder: Nourishment.", imageCz: "U paty hory hrom: Výživa.", lines: [1,0,0,0,0,1] },
  { number: 28, name: "Great Excess", nameCz: "Velký přebytek", chinese: "大过", meaning: "Extraordinary times, critical mass, great preponderance", meaningCz: "Mimořádné časy, kritická masa, velká převaha", judgment: "Preponderance of the Great. The ridgepole sags to the breaking point.", judgmentCz: "Převaha velkého. Hřebenová vaznice se prohýbá až k bodu zlomu.", image: "The lake rises above the trees: Great Excess.", imageCz: "Jezero stoupá nad stromy: Velký přebytek.", lines: [0,1,1,1,1,0] },
  { number: 29, name: "The Abysmal", nameCz: "Propast", chinese: "坎", meaning: "Danger, water, the abyss, perseverance through difficulty", meaningCz: "Nebezpečí, voda, propast, vytrvalost v obtížích", judgment: "The Abysmal repeated. If you are sincere, you have success.", judgmentCz: "Propast opakovaná. Jsi-li upřímný, máš úspěch.", image: "Water flows on and reaches the goal: the Abysmal repeated.", imageCz: "Voda teče dál a dosahuje cíle: Propast opakovaná.", lines: [0,1,0,0,1,0] },
  { number: 30, name: "The Clinging", nameCz: "Lpění", chinese: "离", meaning: "Clarity, fire, illumination, dependence", meaningCz: "Jasnost, oheň, osvícení, závislost", judgment: "The Clinging. Perseverance furthers. It brings success.", judgmentCz: "Lpění. Vytrvalost prospívá. Přináší úspěch.", image: "That which is bright rises twice: the Clinging.", imageCz: "To, co je jasné, vychází dvakrát: Lpění.", lines: [1,0,1,1,0,1] },
  { number: 31, name: "Influence", nameCz: "Vliv", chinese: "咸", meaning: "Attraction, mutual influence, courtship", meaningCz: "Přitažlivost, vzájemný vliv, námluvy", judgment: "Influence. Success. Perseverance furthers. To take a maiden to wife brings good fortune.", judgmentCz: "Vliv. Úspěch. Vytrvalost prospívá. Vzít si dívku za ženu přináší štěstí.", image: "A lake on the mountain: Influence.", imageCz: "Jezero na hoře: Vliv.", lines: [0,0,1,1,1,0] },
  { number: 32, name: "Duration", nameCz: "Trvání", chinese: "恒", meaning: "Endurance, perseverance, continuity", meaningCz: "Vytrvalost, trvalost, kontinuita", judgment: "Duration. Success. No blame. Perseverance furthers.", judgmentCz: "Trvání. Úspěch. Bez viny. Vytrvalost prospívá.", image: "Thunder and wind: Duration.", imageCz: "Hrom a vítr: Trvání.", lines: [0,1,1,1,0,0] },
  { number: 33, name: "Retreat", nameCz: "Ústup", chinese: "遁", meaning: "Strategic withdrawal, retreat at the right time", meaningCz: "Strategický ústup, stažení ve správný čas", judgment: "Retreat. Success. In what is small, perseverance furthers.", judgmentCz: "Ústup. Úspěch. V malém vytrvalost prospívá.", image: "Mountain under heaven: Retreat.", imageCz: "Hora pod nebem: Ústup.", lines: [0,0,1,1,1,1] },
  { number: 34, name: "Great Power", nameCz: "Velká síla", chinese: "大壮", meaning: "Great strength, power of the great", meaningCz: "Velká síla, moc velkého", judgment: "The Power of the Great. Perseverance furthers.", judgmentCz: "Síla velkého. Vytrvalost prospívá.", image: "Thunder in heaven above: Great Power.", imageCz: "Hrom nahoře na nebi: Velká síla.", lines: [1,1,1,1,0,0] },
  { number: 35, name: "Progress", nameCz: "Pokrok", chinese: "晋", meaning: "Advancement, rapid progress, sunrise", meaningCz: "Postup, rychlý pokrok, východ slunce", judgment: "Progress. The powerful prince is honored with horses in large numbers.", judgmentCz: "Pokrok. Mocný kníže je poctěn velkým počtem koní.", image: "The sun rises over the earth: Progress.", imageCz: "Slunce vychází nad zemí: Pokrok.", lines: [0,0,0,1,0,1] },
  { number: 36, name: "Darkening of the Light", nameCz: "Zatmění světla", chinese: "明夷", meaning: "Adversity, concealing brightness, inner light", meaningCz: "Protivenství, skrývání jasu, vnitřní světlo", judgment: "Darkening of the Light. In adversity it furthers one to be persevering.", judgmentCz: "Zatmění světla. V protivenství prospívá být vytrvalý.", image: "The light has sunk into the earth: Darkening of the Light.", imageCz: "Světlo se ponořilo do země: Zatmění světla.", lines: [1,0,1,0,0,0] },
  { number: 37, name: "The Family", nameCz: "Rodina", chinese: "家人", meaning: "Family, clan, domestic order", meaningCz: "Rodina, klan, domácí pořádek", judgment: "The Family. The perseverance of the woman furthers.", judgmentCz: "Rodina. Vytrvalost ženy prospívá.", image: "Wind comes forth from fire: The Family.", imageCz: "Vítr vychází z ohně: Rodina.", lines: [1,0,1,0,1,1] },
  { number: 38, name: "Opposition", nameCz: "Protiklad", chinese: "睽", meaning: "Polarity, contrast, opposition of forces", meaningCz: "Polarita, kontrast, protiklad sil", judgment: "Opposition. In small matters, good fortune.", judgmentCz: "Protiklad. V malých věcech štěstí.", image: "Above, fire; below, the lake: Opposition.", imageCz: "Nahoře oheň, dole jezero: Protiklad.", lines: [1,1,0,1,0,1] },
  { number: 39, name: "Obstruction", nameCz: "Překážka", chinese: "蹇", meaning: "Obstacles, difficulty, seeing the way through", meaningCz: "Překážky, obtíže, vidění cesty vpřed", judgment: "Obstruction. The southwest furthers. The northeast does not further.", judgmentCz: "Překážka. Jihozápad prospívá. Severovýchod nepomáhá.", image: "Water on the mountain: Obstruction.", imageCz: "Voda na hoře: Překážka.", lines: [0,0,1,0,1,0] },
  { number: 40, name: "Deliverance", nameCz: "Osvobození", chinese: "解", meaning: "Release, liberation, resolution of tension", meaningCz: "Uvolnění, osvobození, rozřešení napětí", judgment: "Deliverance. The southwest furthers.", judgmentCz: "Osvobození. Jihozápad prospívá.", image: "Thunder and rain set in: Deliverance.", imageCz: "Přichází hrom a déšť: Osvobození.", lines: [0,1,0,1,0,0] },
  { number: 41, name: "Decrease", nameCz: "Úbytek", chinese: "损", meaning: "Sacrifice, decrease, simplification", meaningCz: "Oběť, úbytek, zjednodušení", judgment: "Decrease combined with sincerity brings about supreme good fortune.", judgmentCz: "Úbytek spojený s upřímností přináší nejvyšší štěstí.", image: "At the foot of the mountain, the lake: Decrease.", imageCz: "U paty hory jezero: Úbytek.", lines: [1,1,0,0,0,1] },
  { number: 42, name: "Increase", nameCz: "Přírůstek", chinese: "益", meaning: "Augmentation, increase, benefit", meaningCz: "Rozmnožení, přírůstek, prospěch", judgment: "Increase. It furthers one to undertake something.", judgmentCz: "Přírůstek. Prospěšné je něco podniknout.", image: "Wind and thunder: Increase.", imageCz: "Vítr a hrom: Přírůstek.", lines: [1,0,0,0,1,1] },
  { number: 43, name: "Breakthrough", nameCz: "Průlom", chinese: "夬", meaning: "Determination, resoluteness, breaking through", meaningCz: "Odhodlání, rozhodnost, proražení", judgment: "Breakthrough. One must resolutely make the matter known at the court of the king.", judgmentCz: "Průlom. Věc musí být rozhodně oznámena u královského dvora.", image: "The lake has risen up to heaven: Breakthrough.", imageCz: "Jezero stouplo až k nebi: Průlom.", lines: [1,1,1,1,1,0] },
  { number: 44, name: "Coming to Meet", nameCz: "Setkání", chinese: "姤", meaning: "Encounter, temptation, unexpected meeting", meaningCz: "Setkání, pokušení, nečekané setkání", judgment: "Coming to Meet. The maiden is powerful. One should not marry such a maiden.", judgmentCz: "Setkání. Dívka je mocná. Takovou dívku by si neměl nikdo brát.", image: "Under heaven, wind: Coming to Meet.", imageCz: "Pod nebem vítr: Setkání.", lines: [0,1,1,1,1,1] },
  { number: 45, name: "Gathering Together", nameCz: "Shromáždění", chinese: "萃", meaning: "Assembly, congregation, collecting", meaningCz: "Shromáždění, kongregace, sbírání", judgment: "Gathering Together. Success. The king approaches his temple.", judgmentCz: "Shromáždění. Úspěch. Král přistupuje ke svému chrámu.", image: "Over the earth, the lake: Gathering Together.", imageCz: "Nad zemí jezero: Shromáždění.", lines: [0,0,0,1,1,0] },
  { number: 46, name: "Pushing Upward", nameCz: "Vzestup", chinese: "升", meaning: "Ascending, growing, pushing upward", meaningCz: "Stoupání, růst, tlačení nahoru", judgment: "Pushing Upward has supreme success.", judgmentCz: "Vzestup přináší nejvyšší úspěch.", image: "Within the earth, wood grows: Pushing Upward.", imageCz: "Uvnitř země roste dřevo: Vzestup.", lines: [0,1,1,0,0,0] },
  { number: 47, name: "Oppression", nameCz: "Útlak", chinese: "困", meaning: "Exhaustion, confinement, adversity", meaningCz: "Vyčerpání, omezení, protivenství", judgment: "Oppression. Success. Perseverance. The great man brings about good fortune.", judgmentCz: "Útlak. Úspěch. Vytrvalost. Velký člověk přináší štěstí.", image: "There is no water in the lake: Oppression.", imageCz: "V jezeře není voda: Útlak.", lines: [0,1,0,1,1,0] },
  { number: 48, name: "The Well", nameCz: "Studna", chinese: "井", meaning: "Source, nourishing, the well of life", meaningCz: "Zdroj, výživa, studna života", judgment: "The Well. The town may be changed, but the well cannot be changed.", judgmentCz: "Studna. Město může být změněno, ale studna nemůže být změněna.", image: "Water over wood: the Well.", imageCz: "Voda nad dřevem: Studna.", lines: [0,1,1,0,1,0] },
  { number: 49, name: "Revolution", nameCz: "Revoluce", chinese: "革", meaning: "Transformation, radical change, molting", meaningCz: "Transformace, radikální změna, svlékání kůže", judgment: "Revolution. On your own day you are believed. Supreme success.", judgmentCz: "Revoluce. Ve svůj vlastní den jsi věřen. Nejvyšší úspěch.", image: "Fire in the lake: Revolution.", imageCz: "Oheň v jezeře: Revoluce.", lines: [1,0,1,1,1,0] },
  { number: 50, name: "The Cauldron", nameCz: "Kotel", chinese: "鼎", meaning: "Transformation, nourishment, the sacred vessel", meaningCz: "Transformace, výživa, posvátná nádoba", judgment: "The Cauldron. Supreme good fortune. Success.", judgmentCz: "Kotel. Nejvyšší štěstí. Úspěch.", image: "Fire over wood: the Cauldron.", imageCz: "Oheň nad dřevem: Kotel.", lines: [0,1,1,1,0,1] },
  { number: 51, name: "The Arousing", nameCz: "Probuzení", chinese: "震", meaning: "Shock, thunder, awakening", meaningCz: "Šok, hrom, probuzení", judgment: "Shock brings success. Shock comes—oh, oh! Laughing words—ha, ha!", judgmentCz: "Šok přináší úspěch. Šok přichází — ach, ach! Smějící se slova — ha, ha!", image: "Thunder repeated: the Arousing.", imageCz: "Hrom opakovaný: Probuzení.", lines: [1,0,0,1,0,0] },
  { number: 52, name: "Keeping Still", nameCz: "Klid", chinese: "艮", meaning: "Stillness, meditation, stopping at the right time", meaningCz: "Klid, meditace, zastavení ve správný čas", judgment: "Keeping Still. Keeping his back still so that he no longer feels his body.", judgmentCz: "Klid. Drží záda v klidu tak, že již necítí své tělo.", image: "Mountains standing close together: Keeping Still.", imageCz: "Hory stojící blízko sebe: Klid.", lines: [0,0,1,0,0,1] },
  { number: 53, name: "Development", nameCz: "Vývoj", chinese: "渐", meaning: "Gradual progress, step by step advancement", meaningCz: "Postupný pokrok, krok za krokem", judgment: "Development. The maiden is given in marriage. Good fortune.", judgmentCz: "Vývoj. Dívka je provdána. Štěstí.", image: "On the mountain, a tree: Development.", imageCz: "Na hoře strom: Vývoj.", lines: [0,0,1,0,1,1] },
  { number: 54, name: "The Marrying Maiden", chinese: "归妹", nameCz: "Vdávající se dívka", meaning: "Subordinate position, affection, propriety", meaningCz: "Podřízené postavení, náklonnost, slušnost", judgment: "The Marrying Maiden. Undertakings bring misfortune. Nothing that would further.", judgmentCz: "Vdávající se dívka. Podnikání přináší neštěstí. Nic, co by prospívalo.", image: "Thunder over the lake: the Marrying Maiden.", imageCz: "Hrom nad jezerem: Vdávající se dívka.", lines: [1,1,0,1,0,0] },
  { number: 55, name: "Abundance", nameCz: "Hojnost", chinese: "丰", meaning: "Fullness, peak, zenith of abundance", meaningCz: "Plnost, vrchol, zenit hojnosti", judgment: "Abundance has success. The king attains abundance. Be not sad.", judgmentCz: "Hojnost přináší úspěch. Král dosahuje hojnosti. Nebuď smutný.", image: "Both thunder and lightning come: Abundance.", imageCz: "Přichází hrom i blesk: Hojnost.", lines: [1,0,1,1,0,0] },
  { number: 56, name: "The Wanderer", nameCz: "Poutník", chinese: "旅", meaning: "Travel, transition, the stranger", meaningCz: "Cestování, přechod, cizinec", judgment: "The Wanderer. Success through smallness. Perseverance brings good fortune.", judgmentCz: "Poutník. Úspěch skrze malost. Vytrvalost přináší štěstí.", image: "Fire on the mountain: the Wanderer.", imageCz: "Oheň na hoře: Poutník.", lines: [0,0,1,1,0,1] },
  { number: 57, name: "The Gentle", nameCz: "Jemnost", chinese: "巽", meaning: "Penetration, wind, gentle influence", meaningCz: "Pronikání, vítr, jemný vliv", judgment: "The Gentle. Success through what is small. It furthers one to have somewhere to go.", judgmentCz: "Jemnost. Úspěch skrze malé. Prospěšné je mít kam jít.", image: "Winds following one upon the other: the Gentle.", imageCz: "Větry následující jeden za druhým: Jemnost.", lines: [0,1,1,0,1,1] },
  { number: 58, name: "The Joyous", nameCz: "Radost", chinese: "兑", meaning: "Joy, lake, pleasure, openness", meaningCz: "Radost, jezero, potěšení, otevřenost", judgment: "The Joyous. Success. Perseverance is favorable.", judgmentCz: "Radost. Úspěch. Vytrvalost je příznivá.", image: "Lakes resting one on the other: the Joyous.", imageCz: "Jezera spočívající jedno na druhém: Radost.", lines: [1,1,0,1,1,0] },
  { number: 59, name: "Dispersion", nameCz: "Rozptýlení", chinese: "涣", meaning: "Dissolution, dispersal, overcoming egotism", meaningCz: "Rozpuštění, rozptyl, překonání egoismu", judgment: "Dispersion. Success. The king approaches his temple.", judgmentCz: "Rozptýlení. Úspěch. Král přistupuje ke svému chrámu.", image: "The wind drives over the water: Dispersion.", imageCz: "Vítr se žene nad vodou: Rozptýlení.", lines: [0,1,0,0,1,1] },
  { number: 60, name: "Limitation", nameCz: "Omezení", chinese: "节", meaning: "Restraint, moderation, setting limits", meaningCz: "Zdrženlivost, umírněnost, stanovení hranic", judgment: "Limitation. Success. Galling limitation must not be persevered in.", judgmentCz: "Omezení. Úspěch. V trpkém omezení nelze vytrvat.", image: "Water over lake: Limitation.", imageCz: "Voda nad jezerem: Omezení.", lines: [1,1,0,0,1,0] },
  { number: 61, name: "Inner Truth", nameCz: "Vnitřní pravda", chinese: "中孚", meaning: "Insight, sincerity, inner truth", meaningCz: "Vhled, upřímnost, vnitřní pravda", judgment: "Inner Truth. Pigs and fishes. Good fortune.", judgmentCz: "Vnitřní pravda. Prasata a ryby. Štěstí.", image: "Wind over lake: Inner Truth.", imageCz: "Vítr nad jezerem: Vnitřní pravda.", lines: [1,1,0,0,1,1] },
  { number: 62, name: "Small Excess", nameCz: "Malý přebytek", chinese: "小过", meaning: "Attention to detail, small matters, the flying bird", meaningCz: "Pozornost k detailům, malé věci, letící pták", judgment: "Preponderance of the Small. Success. Perseverance furthers.", judgmentCz: "Převaha malého. Úspěch. Vytrvalost prospívá.", image: "Thunder on the mountain: Small Excess.", imageCz: "Hrom na hoře: Malý přebytek.", lines: [0,0,1,1,0,0] },
  { number: 63, name: "After Completion", nameCz: "Po dokončení", chinese: "既济", meaning: "Transition, order achieved, vigilance needed", meaningCz: "Přechod, dosažený pořádek, potřeba bdělosti", judgment: "After Completion. Success in small matters. Perseverance furthers.", judgmentCz: "Po dokončení. Úspěch v malých věcech. Vytrvalost prospívá.", image: "Water over fire: After Completion.", imageCz: "Voda nad ohněm: Po dokončení.", lines: [1,0,1,0,1,0] },
  { number: 64, name: "Before Completion", nameCz: "Před dokončením", chinese: "未济", meaning: "Transition, almost there, the final crossing", meaningCz: "Přechod, téměř tam, poslední přechod", judgment: "Before Completion. Success. But if the little fox, after nearly completing the crossing...", judgmentCz: "Před dokončením. Úspěch. Ale pokud malá liška, po téměř dokončeném přechodu...", image: "Fire over water: Before Completion.", imageCz: "Oheň nad vodou: Před dokončením.", lines: [0,1,0,1,0,1] },
];

function HexagramDisplay({ hex }: { hex: typeof HEXAGRAMS[0] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {[...hex.lines].reverse().map((line, i) => (
        <div key={i} className="flex items-center gap-1">
          {line === 1 ? (
            <div className="w-16 h-2 bg-foreground rounded-sm" />
          ) : (
            <>
              <div className="w-6 h-2 bg-foreground rounded-sm" />
              <div className="w-2" />
              <div className="w-6 h-2 bg-foreground rounded-sm" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function IChing() {
  const [selectedHex, setSelectedHex] = useState<typeof HEXAGRAMS[0] | null>(null);
  const [oracleResult, setOracleResult] = useState<typeof HEXAGRAMS[0] | null>(null);
  const { t, locale, localePath } = useLanguage();
  const isEn = locale === "en";

  useEffect(() => {
    if (isEn) {
      document.title = "☯️ I Ching Oracle — Human Design Hexagrams & Wisdom 🎴";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Consult the I Ching oracle. Explore all 64 hexagrams and their connection to Human Design gates and life themes."
      );
    } else {
      document.title = "☯️ I-Ťing Orákulum — Human Design Hexagramy & Moudrost 🎴";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Konzultujte I-Ťing orákulum. Prozkoumejte všech 64 hexagramů a jejich spojení s bránami Human Design."
      );
    }
  }, [isEn]);

  const castOracle = () => {
    const idx = Math.floor(Math.random() * 64);
    setOracleResult(HEXAGRAMS[idx]);
    setSelectedHex(null);
  };

  const displayHex = oracleResult || selectedHex;

  // Helper: pick EN or CS field
  const hexName = (hex: typeof HEXAGRAMS[0]) => isEn ? hex.name : hex.nameCz;
  const hexMeaning = (hex: typeof HEXAGRAMS[0]) => isEn ? hex.meaning : hex.meaningCz;
  const hexJudgment = (hex: typeof HEXAGRAMS[0]) => isEn ? hex.judgment : hex.judgmentCz;
  const hexImage = (hex: typeof HEXAGRAMS[0]) => isEn ? hex.image : hex.imageCz;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              {t.iChing.title}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{t.iChing.subtitle}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.iChing.description}
            </p>
          </div>

          {/* Oracle casting */}
          <Card className="bg-card border-border/50 mb-8">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {isEn
                  ? "Focus on your question and then cast the oracle."
                  : "Soustřeďte se na svou otázku a poté hoďte orákulum."}
              </p>
              <Button size="lg" onClick={castOracle} className="bg-primary text-primary-foreground">
                <Sparkles className="w-5 h-5 mr-2" />
                {t.iChing.drawHexagram}
              </Button>
            </CardContent>
          </Card>

          {/* Display selected hexagram */}
          {displayHex && (
            <Card className="bg-card border-border/50 mb-8">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <HexagramDisplay hex={displayHex} />
                    <span className="text-4xl font-serif">{displayHex.chinese}</span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <Badge variant="outline" className="mb-2">{t.iChing.hexagram} {displayHex.number}</Badge>
                    <h2 className="font-serif text-2xl font-bold mb-2">{hexName(displayHex)}</h2>
                    <p className="text-muted-foreground mb-4">{hexMeaning(displayHex)}</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {isEn ? "Judgment" : "Výrok"}
                        </p>
                        <p className="text-sm italic">{hexJudgment(displayHex)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {isEn ? "Image" : "Obraz"}
                        </p>
                        <p className="text-sm italic">{hexImage(displayHex)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All 64 hexagrams grid */}
          <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t.iChing.allHexagrams}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {HEXAGRAMS.map(hex => (
              <button
                key={hex.number}
                onClick={() => { setSelectedHex(hex); setOracleResult(null); }}
                className={`p-2 rounded-lg border text-center transition-all hover:border-primary/50 hover:bg-primary/5 ${
                  displayHex?.number === hex.number ? "border-primary bg-primary/10" : "border-border/30 bg-card"
                }`}
              >
                <span className="text-lg font-serif block">{hex.chinese}</span>
                <span className="text-xs text-muted-foreground">{hex.number}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
