import { useQuery } from "@tanstack/react-query";
import { getQueryFn, markAuthenticated, clearWasAuthenticated } from "@/lib/queryClient";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (user) {
      markAuthenticated();
    } else if (!isLoading) {
      clearWasAuthenticated();
    }
  }, [user, isLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
