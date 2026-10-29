import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      const isCloudflareDomain =
        /^(?:www\\.)?(?:humandesignchart\\.app|humandesignmapa\\.cz)$/.test(host);
      if (isCloudflareDomain) {
        // Use the Pages-native logout endpoint: it revokes the hashed session
        // in D1 AND clears the HttpOnly __Host-hd_session cookie. A successful
        // tRPC response alone cannot clear that cookie.
        const response = await fetch("/api/oauth/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
        });
        if (!response.ok) throw new Error("Google session logout failed");
      } else {
        // Legacy Express development environment retains its own cookie/session.
        await logoutMutation.mutateAsync();
      }
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
        return;
      }
      // Never pretend logout succeeded when session revocation failed.
      throw error;
    }
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [logoutMutation, utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Persist user info to localStorage in useEffect (not useMemo)
  useEffect(() => {
    if (meQuery.data !== undefined) {
      localStorage.setItem("hdm-user-info", JSON.stringify(meQuery.data));
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
