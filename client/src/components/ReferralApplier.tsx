/**
 * ReferralApplier — invisible component mounted in App.tsx
 * When a logged-in user has a pending referral code in localStorage,
 * it calls applyReferral and shows a toast with the result.
 */
import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function ReferralApplier() {
  const { user, isAuthenticated, loading } = useAuth();
  const applied = useRef(false);

  const applyMutation = trpc.referral.applyReferral.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("🎁 Získali jste 1 bezplatný AI výklad za registraci přes referral odkaz!", {
          duration: 6000,
        });
      }
      localStorage.removeItem("pendingReferralCode");
    },
    onError: () => {
      // Silently remove the code on error (invalid/already used)
      localStorage.removeItem("pendingReferralCode");
    },
  });

  useEffect(() => {
    if (loading || !isAuthenticated || !user || applied.current) return;

    const pendingCode = localStorage.getItem("pendingReferralCode");
    if (!pendingCode) return;

    applied.current = true;
    applyMutation.mutate({ referralCode: pendingCode });
  }, [isAuthenticated, loading, user]);

  return null;
}
