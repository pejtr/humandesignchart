import { GATE_DESCRIPTIONS } from "../data/hdContent";

export function getSystemPrompt(isEn: boolean): string {
    if (isEn) {
        return `You are an expert in the Human Design system with deep knowledge of Ra Uru Hu's teachings. Provide deep, specific, and practical interpretations. Use a warm yet professional tone. Structure responses clearly using markdown formatting. Be specific to the given chart — avoid generic advice. IMPORTANT: Always respond in English. Use correct Human Design terminology. NEVER start with a greeting like "Hello!" or "Hi there" — begin directly with the interpretation or section heading.`;
    }
    return `Jsi expert na systém Human Design s hlubokými znalostmi Ra Uru Hu a jeho učení. Poskytuj hluboké, specifické a praktické výklady. Používej vřelý, ale profesionální tón. Strukturuj odpovědi přehledně pomocí markdown formátování. Buď specifický k danému chartu — vyhýbej se obecným radám. DŮLEŽITÉ: Vždy odpovídej v češtině. Používej správnou českou HD terminologii. NIKDY nezačínej oslovením jako "Ahoj!", "Dobrý den," nebo podobnými pozdravy — začni rovnou výkladem nebo nadpisem sekce.`;
}

export function getReadingPrompt(chart: any, readingType: string, isEn: boolean): string {
    const prompts: Record<string, string> = {
        overview: `Provide a comprehensive overview of this Human Design chart. Type: ${chart.type}, Profile: ${chart.profile} ${chart.profileName}, Authority: ${chart.authority}, Definition: ${chart.definition}, Strategy: ${chart.strategy}. Defined Centers: ${(chart.centers as any[])?.filter((c: any) => c.defined).map((c: any) => c.name).join(", ")}. Channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}. Incarnation Cross: ${(chart.incarnationCross as any)?.name}. Give deep insights about their life purpose, strengths, and how to live correctly.`,

        type_strategy: `Provide a deep analysis of being a ${chart.type} with the strategy "${chart.strategy}". Explain the signature theme "${chart.signature}" and the not-self theme "${chart.notSelf}". Describe the aura type "${chart.aura}" and how it affects interactions. Give practical advice for living as this type.`,

        profile: `Analyze the profile ${chart.profile} (${chart.profileName}) in depth. Explain the conscious line ${(chart.profile as string)?.split("/")[0]} and unconscious line ${(chart.profile as string)?.split("/")[1]}. Describe how these lines interact, the life themes, and practical implications for relationships, career, and personal growth.`,

        authority: `Explain the ${chart.authority} authority in detail. How should this person make decisions? What does it feel like when they follow their authority correctly vs. when they don't? Give practical exercises and tips for developing trust in this authority.`,

        incarnation_cross: (() => {
            const crossName = (chart.incarnationCross as any)?.name || '';
            const crossType = (chart.incarnationCross as any)?.type || '';
            const gates: number[] = (chart.incarnationCross as any)?.gates || [];
            const gateDetails = gates.map((g: number) => {
                const d = GATE_DESCRIPTIONS[g as keyof typeof GATE_DESCRIPTIONS];
                if (!d) return `Gate ${g}`;
                const name = isEn ? d.nameEn : d.name;
                const theme = isEn ? d.themeEn : d.theme;
                const gift = isEn ? d.giftKeywordEn : d.giftKeyword;
                const shadow = isEn ? d.shadowKeyword : d.shadowKeyword;
                const desc = isEn ? d.descriptionEn : d.description;
                return `Gate ${g} (${name}, ${d.iChing} ${d.hexagram}, Center: ${d.center}, Circuit: ${d.circuit}): Theme — ${theme}. Gift: ${gift}, Shadow: ${shadow}. ${desc}`;
            }).join('\n\n');
            return isEn
                ? `Analyze the Incarnation Cross: "${crossName}" (${crossType}). The four gates are:\n\n${gateDetails}\n\nProvide a deep, structured analysis with these sections:\n1. **Life Theme & Purpose** — What is the core life mission of this cross? How do all 4 gates work together?\n2. **Conscious Gates (Personality Sun & Earth)** — Analyze gates ${gates[0]} and ${gates[1]}: their gifts, themes, and how they shape conscious identity\n3. **Unconscious Gates (Design Sun & Earth)** — Analyze gates ${gates[2]} and ${gates[3]}: their deeper unconscious gifts and how others see this person\n4. **How to Live This Cross** — Practical, specific guidance: daily practices, environments, relationships, and situations that support this cross\n5. **Challenges & Shadow Work** — What are the shadow aspects to be aware of? How to transform them?\n6. **Affirmation** — A powerful, personalized affirmation for this cross`
                : `Analyzuj Inkarnační kříž: "${crossName}" (${crossType}). Čtyři brány jsou:\n\n${gateDetails}\n\nPoskytni hlubokou, strukturovanou analýzu s těmito sekcemi:\n1. **Životní téma a poslání** — Jaké je základní životní poslání tohoto kříže? Jak všechny 4 brány spolupracují?\n2. **Vědomé brány (Osobnost — Slunce a Země)** — Analyzuj brány ${gates[0]} a ${gates[1]}: jejich dary, témata a jak formují vědomou identitu\n3. **Nevědomé brány (Design — Slunce a Země)** — Analyzuj brány ${gates[2]} a ${gates[3]}: jejich hlubší nevědomé dary a jak tě ostatní vnímají\n4. **Jak žít svůj kříž** — Praktické, konkrétní vedení: každodenní praxe, prostředí, vztahy a situace, které podporují tento kříž\n5. **Výzvy a práce se stínem** — Jaké jsou stínové aspekty, na které si dát pozor? Jak je transformovat?\n6. **Afirmace** — Silná, personalizovaná afirmace pro tento kříž`;
        })(),

        channels: `Analyze the defined channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2} (${c.centerA} to ${c.centerB})`).join("; ")}. For each channel, explain its energy, gifts, and challenges. Describe how these channels work together as a whole.`,

        gates: `Analyze the key gate activations. Personality gates: ${(chart.personalityActivations as any[])?.map((a: any) => `Gate ${a.gate}.${a.line} (${a.planet})`).join(", ")}. Design gates: ${(chart.designActivations as any[])?.map((a: any) => `Gate ${a.gate}.${a.line} (${a.planet})`).join(", ")}. Focus on the most significant activations and their meanings.`,

        variables: `Analyze the variables: Digestion: ${chart.variables?.digestion?.type} (${chart.variables?.digestion?.arrow}), Environment: ${chart.variables?.environment?.type} (${chart.variables?.environment?.arrow}), Perspective: ${chart.variables?.perspective?.type} (${chart.variables?.perspective?.arrow}), Awareness: ${chart.variables?.awareness?.type} (${chart.variables?.awareness?.arrow}). Explain what each variable means for daily life, optimal eating, living environment, and cognitive style.`,

        relationships: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Definition: ${chart.definition}), provide relationship guidance. What type of partners are most compatible? How does their definition affect partnerships? What electromagnetic connections should they look for?`,

        career: `Based on this chart (Type: ${chart.type}, Profile: ${chart.profile}, Authority: ${chart.authority}, Defined channels: ${(chart.channels as any[])?.map((c: any) => `${c.gate1}-${c.gate2}`).join(", ")}), provide career guidance. What types of work environments suit them? What roles align with their design? How should they approach career decisions using their authority?`,
    };

    return prompts[readingType] || prompts.overview;
}
