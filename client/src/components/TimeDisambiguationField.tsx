import { Label } from "@/components/ui/label";
import { useId } from "react";

export type TimeDisambiguation = "" | "earlier" | "later";

export function TimeDisambiguationField({
  value,
  onChange,
  isEnglish = false,
}: {
  value: TimeDisambiguation;
  onChange: (value: TimeDisambiguation) => void;
  isEnglish?: boolean;
}) {
  const selectId = useId();
  return (
    <details className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
      <summary className="cursor-pointer text-muted-foreground">
        {isEnglish
          ? "Was this time during the autumn clock change?"
          : "Nastal tento čas při podzimní změně hodin?"}
      </summary>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor={selectId}>
          {isEnglish ? "Which occurrence?" : "Který výskyt času platí?"}
        </Label>
        <select
          id={selectId}
          className="h-10 w-full rounded-md border border-input bg-background px-3"
          value={value}
          onChange={(event) => onChange(event.target.value as TimeDisambiguation)}
        >
          <option value="">{isEnglish ? "Not applicable / unknown" : "Netýká se / nevím"}</option>
          <option value="earlier">{isEnglish ? "Earlier occurrence" : "Dřívější výskyt"}</option>
          <option value="later">{isEnglish ? "Later occurrence" : "Pozdější výskyt"}</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {isEnglish
            ? "Only needed when the same local time occurred twice."
            : "Vyplňte jen tehdy, když stejný místní čas nastal dvakrát."}
        </p>
      </div>
    </details>
  );
}
