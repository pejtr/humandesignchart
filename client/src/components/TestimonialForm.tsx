import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export function TestimonialForm({ hdType }: { hdType?: string }) {
  const { locale } = useLanguage();
  const isCs = locale === "cs";
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.testimonials.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(isCs ? "Děkujeme za vaši zpětnou vazbu!" : "Thank you for your feedback!");
    },
    onError: () => {
      toast.error(isCs ? "Chyba při odesílání" : "Submission error");
    },
  });

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-semibold text-foreground">
          {isCs ? "Děkujeme!" : "Thank you!"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isCs
            ? "Vaše zpětná vazba byla odeslána ke schválení."
            : "Your feedback has been submitted for review."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          {isCs ? "Vaše jméno" : "Your name"}
        </label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isCs ? "Jan N." : "Jane D."}
          maxLength={100}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          {isCs ? "Vaše zkušenost" : "Your experience"}
        </label>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={
            isCs
              ? "Jak vám Human Design pomohl? Co jste objevili?"
              : "How has Human Design helped you? What did you discover?"
          }
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">{text.length}/500</p>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          {isCs ? "Hodnocení" : "Rating"}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              className="p-0.5"
            >
              <Star
                className={`w-6 h-6 ${
                  v <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={() => {
          if (!name.trim() || !text.trim()) {
            toast.error(isCs ? "Vyplňte jméno a text" : "Fill in name and text");
            return;
          }
          submitMutation.mutate({
            name: name.trim(),
            text: text.trim(),
            rating,
            hdType: hdType ?? undefined,
            locale: locale as "cs" | "en",
          });
        }}
        disabled={submitMutation.isPending}
        className="bg-violet-700 text-white hover:bg-violet-800"
      >
        <Send className="w-4 h-4 mr-2" />
        {submitMutation.isPending
          ? isCs ? "Odesílání..." : "Sending..."
          : isCs ? "Odeslat" : "Submit"}
      </Button>
    </div>
  );
}
