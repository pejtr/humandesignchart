import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

// I Ching hexagram data (64 hexagrams)
const HEXAGRAMS: Array<{
  number: number;
  name: string;
  chinese: string;
  meaning: string;
  judgment: string;
  image: string;
  lines: [number, number, number, number, number, number]; // 0=yin, 1=yang from bottom to top
}> = [
  { number: 1, name: "The Creative", chinese: "乾", meaning: "Pure creative force, heaven, initiative", judgment: "The Creative works sublime success, furthering through perseverance.", image: "The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.", lines: [1,1,1,1,1,1] },
  { number: 2, name: "The Receptive", chinese: "坤", meaning: "Pure receptive force, earth, devotion", judgment: "The Receptive brings about sublime success, furthering through the perseverance of a mare.", image: "The earth's condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.", lines: [0,0,0,0,0,0] },
  { number: 3, name: "Difficulty at the Beginning", chinese: "屯", meaning: "Initial difficulty, sprouting, gathering support", judgment: "Difficulty at the Beginning works supreme success. It furthers one to appoint helpers.", image: "Clouds and thunder: the image of Difficulty at the Beginning.", lines: [1,0,0,0,1,0] },
  { number: 4, name: "Youthful Folly", chinese: "蒙", meaning: "Inexperience, learning, seeking guidance", judgment: "Youthful Folly has success. It is not I who seek the young fool; the young fool seeks me.", image: "A spring wells up at the foot of the mountain: youthful folly.", lines: [0,1,0,0,0,1] },
  { number: 5, name: "Waiting", chinese: "需", meaning: "Patience, nourishment, waiting for the right moment", judgment: "Waiting. If you are sincere, you have light and success.", image: "Clouds rise up to heaven: the image of Waiting.", lines: [1,1,1,0,1,0] },
  { number: 6, name: "Conflict", chinese: "讼", meaning: "Dispute, seeking resolution, inner truth", judgment: "Conflict. You are sincere and are being obstructed.", image: "Heaven and water go their opposite ways: the image of Conflict.", lines: [0,1,0,1,1,1] },
  { number: 7, name: "The Army", chinese: "师", meaning: "Discipline, leadership, organized force", judgment: "The Army. The army needs perseverance and a strong man.", image: "In the middle of the earth is water: the image of the Army.", lines: [0,1,0,0,0,0] },
  { number: 8, name: "Holding Together", chinese: "比", meaning: "Union, alliance, seeking connection", judgment: "Holding Together brings good fortune.", image: "On the earth is water: the image of Holding Together.", lines: [0,0,0,0,1,0] },
  { number: 9, name: "Small Taming", chinese: "小畜", meaning: "Gentle restraint, small accumulation", judgment: "The Taming Power of the Small has success. Dense clouds, no rain.", image: "The wind drives across heaven: Small Taming.", lines: [1,1,1,0,1,1] },
  { number: 10, name: "Treading", chinese: "履", meaning: "Conduct, careful behavior, treading on the tiger's tail", judgment: "Treading upon the tail of the tiger. It does not bite the man. Success.", image: "Heaven above, the lake below: Treading.", lines: [1,1,0,1,1,1] },
  { number: 11, name: "Peace", chinese: "泰", meaning: "Harmony, prosperity, heaven and earth in communion", judgment: "Peace. The small departs, the great approaches. Good fortune. Success.", image: "Heaven and earth unite: the image of Peace.", lines: [1,1,1,0,0,0] },
  { number: 12, name: "Standstill", chinese: "否", meaning: "Stagnation, obstruction, withdrawal", judgment: "Standstill. Evil people do not further the perseverance of the superior man.", image: "Heaven and earth do not unite: Standstill.", lines: [0,0,0,1,1,1] },
  { number: 13, name: "Fellowship", chinese: "同人", meaning: "Community, fellowship with others", judgment: "Fellowship with Men in the open. Success.", image: "Heaven together with fire: Fellowship with Men.", lines: [1,0,1,1,1,1] },
  { number: 14, name: "Great Possession", chinese: "大有", meaning: "Abundance, great wealth, supreme success", judgment: "Possession in Great Measure. Supreme success.", image: "Fire in heaven above: Great Possession.", lines: [1,1,1,1,0,1] },
  { number: 15, name: "Modesty", chinese: "谦", meaning: "Humility, moderation, inner worth", judgment: "Modesty creates success. The superior man carries things through.", image: "Within the earth, a mountain: Modesty.", lines: [0,0,1,0,0,0] },
  { number: 16, name: "Enthusiasm", chinese: "豫", meaning: "Inspiration, delight, harmonious movement", judgment: "Enthusiasm. It furthers one to install helpers and to set armies marching.", image: "Thunder comes resounding out of the earth: Enthusiasm.", lines: [0,0,0,1,0,0] },
  { number: 17, name: "Following", chinese: "随", meaning: "Adaptation, following the flow", judgment: "Following has supreme success. Perseverance furthers. No blame.", image: "Thunder in the middle of the lake: Following.", lines: [1,0,0,1,1,0] },
  { number: 18, name: "Work on the Decayed", chinese: "蛊", meaning: "Repair, renovation, correcting what has been spoiled", judgment: "Work on what has been spoiled has supreme success.", image: "The wind blows low on the mountain: Decay.", lines: [0,1,1,0,0,1] },
  { number: 19, name: "Approach", chinese: "临", meaning: "Drawing near, advance, becoming great", judgment: "Approach has supreme success. Perseverance furthers.", image: "The earth above the lake: Approach.", lines: [1,1,0,0,0,0] },
  { number: 20, name: "Contemplation", chinese: "观", meaning: "Observation, insight, viewing from above", judgment: "Contemplation. The ablution has been made, but not yet the offering.", image: "The wind blows over the earth: Contemplation.", lines: [0,0,0,0,1,1] },
  { number: 21, name: "Biting Through", chinese: "噬嗑", meaning: "Decisive action, justice, breaking through obstacles", judgment: "Biting Through has success. It is favorable to let justice be administered.", image: "Thunder and lightning: Biting Through.", lines: [1,0,0,1,0,1] },
  { number: 22, name: "Grace", chinese: "贲", meaning: "Beauty, adornment, elegance in form", judgment: "Grace has success. In small matters it is favorable to undertake something.", image: "Fire at the foot of the mountain: Grace.", lines: [1,0,0,1,0,1] },
  { number: 23, name: "Splitting Apart", chinese: "剥", meaning: "Deterioration, stripping away, letting go", judgment: "Splitting Apart. It does not further one to go anywhere.", image: "The mountain rests on the earth: Splitting Apart.", lines: [0,0,0,0,0,1] },
  { number: 24, name: "Return", chinese: "复", meaning: "Turning point, renewal, the return of light", judgment: "Return. Success. Going out and coming in without error.", image: "Thunder within the earth: Return.", lines: [1,0,0,0,0,0] },
  { number: 25, name: "Innocence", chinese: "无妄", meaning: "Unexpected, naturalness, acting without ulterior motive", judgment: "Innocence. Supreme success. Perseverance furthers.", image: "Under heaven thunder rolls: Innocence.", lines: [1,0,0,1,1,1] },
  { number: 26, name: "Great Taming", chinese: "大畜", meaning: "Great accumulation, holding firm, nourishing worth", judgment: "The Taming Power of the Great. Perseverance furthers.", image: "Heaven within the mountain: Great Taming.", lines: [1,1,1,0,0,1] },
  { number: 27, name: "Nourishment", chinese: "颐", meaning: "Providing nourishment, caring for what matters", judgment: "The Corners of the Mouth. Perseverance brings good fortune.", image: "At the foot of the mountain, thunder: Nourishment.", lines: [1,0,0,0,0,1] },
  { number: 28, name: "Great Excess", chinese: "大过", meaning: "Extraordinary times, critical mass, great preponderance", judgment: "Preponderance of the Great. The ridgepole sags to the breaking point.", image: "The lake rises above the trees: Great Excess.", lines: [0,1,1,1,1,0] },
  { number: 29, name: "The Abysmal", chinese: "坎", meaning: "Danger, water, the abyss, perseverance through difficulty", judgment: "The Abysmal repeated. If you are sincere, you have success.", image: "Water flows on and reaches the goal: the Abysmal repeated.", lines: [0,1,0,0,1,0] },
  { number: 30, name: "The Clinging", chinese: "离", meaning: "Clarity, fire, illumination, dependence", judgment: "The Clinging. Perseverance furthers. It brings success.", image: "That which is bright rises twice: the Clinging.", lines: [1,0,1,1,0,1] },
  { number: 31, name: "Influence", chinese: "咸", meaning: "Attraction, mutual influence, courtship", judgment: "Influence. Success. Perseverance furthers. To take a maiden to wife brings good fortune.", image: "A lake on the mountain: Influence.", lines: [0,0,1,1,1,0] },
  { number: 32, name: "Duration", chinese: "恒", meaning: "Endurance, perseverance, continuity", judgment: "Duration. Success. No blame. Perseverance furthers.", image: "Thunder and wind: Duration.", lines: [0,1,1,1,0,0] },
  { number: 33, name: "Retreat", chinese: "遁", meaning: "Strategic withdrawal, retreat at the right time", judgment: "Retreat. Success. In what is small, perseverance furthers.", image: "Mountain under heaven: Retreat.", lines: [0,0,1,1,1,1] },
  { number: 34, name: "Great Power", chinese: "大壮", meaning: "Great strength, power of the great", judgment: "The Power of the Great. Perseverance furthers.", image: "Thunder in heaven above: Great Power.", lines: [1,1,1,1,0,0] },
  { number: 35, name: "Progress", chinese: "晋", meaning: "Advancement, rapid progress, sunrise", judgment: "Progress. The powerful prince is honored with horses in large numbers.", image: "The sun rises over the earth: Progress.", lines: [0,0,0,1,0,1] },
  { number: 36, name: "Darkening of the Light", chinese: "明夷", meaning: "Adversity, concealing brightness, inner light", judgment: "Darkening of the Light. In adversity it furthers one to be persevering.", image: "The light has sunk into the earth: Darkening of the Light.", lines: [1,0,1,0,0,0] },
  { number: 37, name: "The Family", chinese: "家人", meaning: "Family, clan, domestic order", judgment: "The Family. The perseverance of the woman furthers.", image: "Wind comes forth from fire: The Family.", lines: [1,0,1,0,1,1] },
  { number: 38, name: "Opposition", chinese: "睽", meaning: "Polarity, contrast, opposition of forces", judgment: "Opposition. In small matters, good fortune.", image: "Above, fire; below, the lake: Opposition.", lines: [1,1,0,1,0,1] },
  { number: 39, name: "Obstruction", chinese: "蹇", meaning: "Obstacles, difficulty, seeing the way through", judgment: "Obstruction. The southwest furthers. The northeast does not further.", image: "Water on the mountain: Obstruction.", lines: [0,0,1,0,1,0] },
  { number: 40, name: "Deliverance", chinese: "解", meaning: "Release, liberation, resolution of tension", judgment: "Deliverance. The southwest furthers.", image: "Thunder and rain set in: Deliverance.", lines: [0,1,0,1,0,0] },
  { number: 41, name: "Decrease", chinese: "损", meaning: "Sacrifice, decrease, simplification", judgment: "Decrease combined with sincerity brings about supreme good fortune.", image: "At the foot of the mountain, the lake: Decrease.", lines: [1,1,0,0,0,1] },
  { number: 42, name: "Increase", chinese: "益", meaning: "Augmentation, increase, benefit", judgment: "Increase. It furthers one to undertake something.", image: "Wind and thunder: Increase.", lines: [1,0,0,0,1,1] },
  { number: 43, name: "Breakthrough", chinese: "夬", meaning: "Determination, resoluteness, breaking through", judgment: "Breakthrough. One must resolutely make the matter known at the court of the king.", image: "The lake has risen up to heaven: Breakthrough.", lines: [1,1,1,1,1,0] },
  { number: 44, name: "Coming to Meet", chinese: "姤", meaning: "Encounter, temptation, unexpected meeting", judgment: "Coming to Meet. The maiden is powerful. One should not marry such a maiden.", image: "Under heaven, wind: Coming to Meet.", lines: [0,1,1,1,1,1] },
  { number: 45, name: "Gathering Together", chinese: "萃", meaning: "Assembly, congregation, collecting", judgment: "Gathering Together. Success. The king approaches his temple.", image: "Over the earth, the lake: Gathering Together.", lines: [0,0,0,1,1,0] },
  { number: 46, name: "Pushing Upward", chinese: "升", meaning: "Ascending, growing, pushing upward", judgment: "Pushing Upward has supreme success.", image: "Within the earth, wood grows: Pushing Upward.", lines: [0,1,1,0,0,0] },
  { number: 47, name: "Oppression", chinese: "困", meaning: "Exhaustion, confinement, adversity", judgment: "Oppression. Success. Perseverance. The great man brings about good fortune.", image: "There is no water in the lake: Oppression.", lines: [0,1,0,1,1,0] },
  { number: 48, name: "The Well", chinese: "井", meaning: "Source, nourishing, the well of life", judgment: "The Well. The town may be changed, but the well cannot be changed.", image: "Water over wood: the Well.", lines: [0,1,1,0,1,0] },
  { number: 49, name: "Revolution", chinese: "革", meaning: "Transformation, radical change, molting", judgment: "Revolution. On your own day you are believed. Supreme success.", image: "Fire in the lake: Revolution.", lines: [1,0,1,1,1,0] },
  { number: 50, name: "The Cauldron", chinese: "鼎", meaning: "Transformation, nourishment, the sacred vessel", judgment: "The Cauldron. Supreme good fortune. Success.", image: "Fire over wood: the Cauldron.", lines: [0,1,1,1,0,1] },
  { number: 51, name: "The Arousing", chinese: "震", meaning: "Shock, thunder, awakening", judgment: "Shock brings success. Shock comes—oh, oh! Laughing words—ha, ha!", image: "Thunder repeated: the Arousing.", lines: [1,0,0,1,0,0] },
  { number: 52, name: "Keeping Still", chinese: "艮", meaning: "Stillness, meditation, mountain", judgment: "Keeping Still. Keeping his back still so that he no longer feels his body.", image: "Mountains standing close together: Keeping Still.", lines: [0,0,1,0,0,1] },
  { number: 53, name: "Development", chinese: "渐", meaning: "Gradual progress, step by step advancement", judgment: "Development. The maiden is given in marriage. Good fortune.", image: "On the mountain, a tree: Development.", lines: [0,0,1,0,1,1] },
  { number: 54, name: "The Marrying Maiden", chinese: "归妹", meaning: "Subordinate position, affection, propriety", judgment: "The Marrying Maiden. Undertakings bring misfortune. Nothing that would further.", image: "Thunder over the lake: the Marrying Maiden.", lines: [1,1,0,1,0,0] },
  { number: 55, name: "Abundance", chinese: "丰", meaning: "Fullness, peak, zenith of abundance", judgment: "Abundance has success. The king attains abundance. Be not sad.", image: "Both thunder and lightning come: Abundance.", lines: [1,0,1,1,0,0] },
  { number: 56, name: "The Wanderer", chinese: "旅", meaning: "Travel, transition, the stranger", judgment: "The Wanderer. Success through smallness. Perseverance brings good fortune.", image: "Fire on the mountain: the Wanderer.", lines: [0,0,1,1,0,1] },
  { number: 57, name: "The Gentle", chinese: "巽", meaning: "Penetration, wind, gentle influence", judgment: "The Gentle. Success through what is small. It furthers one to have somewhere to go.", image: "Winds following one upon the other: the Gentle.", lines: [0,1,1,0,1,1] },
  { number: 58, name: "The Joyous", chinese: "兑", meaning: "Joy, lake, pleasure, openness", judgment: "The Joyous. Success. Perseverance is favorable.", image: "Lakes resting one on the other: the Joyous.", lines: [1,1,0,1,1,0] },
  { number: 59, name: "Dispersion", chinese: "涣", meaning: "Dissolution, dispersal, overcoming egotism", judgment: "Dispersion. Success. The king approaches his temple.", image: "The wind drives over the water: Dispersion.", lines: [0,1,0,0,1,1] },
  { number: 60, name: "Limitation", chinese: "节", meaning: "Restraint, moderation, setting limits", judgment: "Limitation. Success. Galling limitation must not be persevered in.", image: "Water over lake: Limitation.", lines: [1,1,0,0,1,0] },
  { number: 61, name: "Inner Truth", chinese: "中孚", meaning: "Insight, sincerity, inner truth", judgment: "Inner Truth. Pigs and fishes. Good fortune.", image: "Wind over lake: Inner Truth.", lines: [1,1,0,0,1,1] },
  { number: 62, name: "Small Excess", chinese: "小过", meaning: "Attention to detail, small matters, the flying bird", judgment: "Preponderance of the Small. Success. Perseverance furthers.", image: "Thunder on the mountain: Small Excess.", lines: [0,0,1,1,0,0] },
  { number: 63, name: "After Completion", chinese: "既济", meaning: "Transition, order achieved, vigilance needed", judgment: "After Completion. Success in small matters. Perseverance furthers.", image: "Water over fire: After Completion.", lines: [1,0,1,0,1,0] },
  { number: 64, name: "Before Completion", chinese: "未济", meaning: "Transition, almost there, the final crossing", judgment: "Before Completion. Success. But if the little fox, after nearly completing the crossing...", image: "Fire over water: Before Completion.", lines: [0,1,0,1,0,1] },
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

  useSEO(locale === "en" ? {
    title: "☯️ I Ching Oracle — Human Design Hexagrams & Wisdom 🎴",
    description: "Consult the I Ching oracle. Explore all 64 hexagrams and their connection to Human Design gates and life themes.",
    keywords: "i ching oracle, iching hexagrams, 64 hexagrams, human design gates, i ching wisdom",
    ogType: "website",
    locale: "en_US",
  } : {
    title: "☯️ I-Ťing Orákulum — Human Design Hexagramy & Moudrost 🎴",
    description: "Konzultujte I-Ťing orákulum. Prozkoumejte všech 64 hexagramů a jejich spojení s bránami Human Design.",
    keywords: "i-ťing orákulum, i-ťing hexagramy, 64 hexagramů, brány human design, i-ťing moudrost",
    ogType: "website",
    locale: "cs_CZ",
  });

  const castOracle = () => {
    const idx = Math.floor(Math.random() * 64);
    setOracleResult(HEXAGRAMS[idx]);
    setSelectedHex(null);
  };

  const displayHex = oracleResult || selectedHex;

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
                {locale === "en"
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
                    <h2 className="font-serif text-2xl font-bold mb-2">{displayHex.name}</h2>
                    <p className="text-muted-foreground mb-4">{displayHex.meaning}</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {locale === "en" ? "Judgment" : "Výrok"}
                        </p>
                        <p className="text-sm italic">{displayHex.judgment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {locale === "en" ? "Image" : "Obraz"}
                        </p>
                        <p className="text-sm italic">{displayHex.image}</p>
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
