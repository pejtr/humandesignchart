/**
 * The preset prompt is embedded in shareable ?q= links. When users change locale,
 * translate only our known preset copy; never rewrite a visitor's own question.
 */
const presetQuestions = [
  { cs: "Jaký je můj typ?", en: "What is my type?" },
  { cs: "Co znamená Sakrál?", en: "What is Sacral?" },
  { cs: "Jak fungují tranzity?", en: "How do transits work?" },
] as const;

export function localizeOraculumPresetQuestion(question: string, locale: string): string {
  const preset = presetQuestions.find(({ cs, en }) => question === cs || question === en);
  if (!preset) return question;
  return locale === "cs" ? preset.cs : locale === "en" ? preset.en : question;
}
