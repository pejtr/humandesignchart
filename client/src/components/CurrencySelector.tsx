import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import { Globe } from "lucide-react";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="inline-flex items-center gap-1 bg-muted/40 border border-border/40 p-1 rounded-lg text-xs">
      <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1" />
      {(["CZK", "EUR", "USD"] as Currency[]).map(c => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all ${
            currency === c
              ? "bg-purple-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {c === "CZK" ? "Kč" : c === "EUR" ? "€" : "$"}
        </button>
      ))}
    </div>
  );
}
