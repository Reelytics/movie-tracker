import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let headers: HeadersInit = {
    "Content-Type": "application/json",
    // Add a cache-busting header to prevent browsers from caching responses
    "X-Requested-With": "XMLHttpRequest",
  };
  
  // Add authentication headers from localStorage if available
  try {
    const savedUser = localStorage.getItem('reelytics_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData && userData.id) {
        headers["X-User-Id"] = userData.id.toString();
        headers["X-User-Auth"] = "true";
      }
    }
  } catch (e) {
    console.error("Error reading from localStorage:", e);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important: always include credentials
  });

  // Special handling for authentication errors
  if (res.status === 401) {
    console.error("Authentication error:", url);
    throw new Error("You must be logged in to perform this action");
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
    
    // Add authentication headers from localStorage if available
    try {
      const savedUser = localStorage.getItem('reelytics_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData && userData.id) {
          headers["X-User-Id"] = userData.id.toString();
          headers["X-User-Auth"] = "true";
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
