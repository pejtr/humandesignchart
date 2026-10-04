/**
 * Seller identification used by the legal pages (Terms, Privacy, Withdrawal).
 *
 * Every value starting with "[DOPLNIT" is a placeholder: the pages render it
 * highlighted so an unfinished page is obvious. Replace each one with the real
 * details of the operator before the pages go live, and have the texts
 * reviewed by a lawyer.
 */
export const SELLER_INFO = {
  name: "[DOPLNIT: obchodní firma / jméno a příjmení podnikatele]",
  companyId: "[DOPLNIT: IČO]",
  vatStatus: "[DOPLNIT: DIČ, nebo „neplátce DPH“]",
  address: "[DOPLNIT: sídlo / místo podnikání]",
  registry: "[DOPLNIT: zápis v obchodním / živnostenském rejstříku]",
  email: "[DOPLNIT: kontaktní e-mail]",
  phone: "[DOPLNIT: telefon (nepovinné)]",
  effectiveDate: "[DOPLNIT: datum účinnosti]",
  hosting: "[DOPLNIT: poskytovatel hostingu a umístění serverů]",
} as const;

export function isPlaceholder(value: string) {
  return value.startsWith("[DOPLNIT");
}
