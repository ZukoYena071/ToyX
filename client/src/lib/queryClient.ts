import { QueryClient, QueryFunction } from "@tanstack/react-query";

let wasAuthenticated = !!sessionStorage.getItem("toyx_was_authenticated");

export function markAuthenticated() {
  wasAuthenticated = true;
  sessionStorage.setItem("toyx_was_authenticated", "1");
}

export function clearWasAuthenticated() {
  wasAuthenticated = false;
  sessionStorage.removeItem("toyx_was_authenticated");
}

function handle401() {
  if (!wasAuthenticated) return;
  if (window.location.pathname === "/login") return;
  const currentPath = window.location.pathname + window.location.search;
  sessionStorage.setItem("toyx_session_expired", "1");
  window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
}

async function throwIfResNotOk(res: Response) {
  if (res.status === 401) {
    handle401();
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';
  const res = await fetch(url, {
    method,
    headers: (!isGetOrHead && data) ? { "Content-Type": "application/json" } : {},
    body: (!isGetOrHead && data) ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });
    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      handle401();
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
