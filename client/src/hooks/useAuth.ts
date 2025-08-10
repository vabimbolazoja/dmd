// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const token = sessionStorage.getItem("token-adt"); // Retrieve stored token

      const res = await fetch("https://4mserve.vercel.app/api/auth/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }), // Add header only if token exists
        },
        credentials: "include", // optional if you still want cookies sent
      });

      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
