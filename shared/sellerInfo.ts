/** Seller details shared by CZ/EN legal documents. Unverified fields remain visibly blocked. */
export const SELLER_INFO = {
  name: "Petr Matěj",
  companyId: "02558220",
  vatStatus: "neplátce DPH / not VAT registered",
  address: "Mládeže 12/1477, 169 00 Praha 6, Česká republika",
  registry: "[DOPLNIT: přesné označení živnostenského rejstříku a evidujícího úřadu]",
  email: "petr.matej@protonmail.com",
  phone: "[DOPLNIT: ověřený zákaznický telefon nebo upravit stránku tak, aby telefon nevyžadovala]",
  effectiveDate: "13. 10. 2026",
  hosting: "[DOPLNIT: ověřený seznam skutečných hostingových a dalších zpracovatelů, jejich lokací a transferů]",
} as const;

export function isPlaceholder(value: string) {
  return value.startsWith("[DOPLNIT");
}
