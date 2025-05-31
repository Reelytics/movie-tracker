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
  options?: RequestInit
): Promise<any> {
  let headers: HeadersInit = {
    "Content-Type": "application/json",
    // Add a cache-busting header to prevent browsers from caching responses
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
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

  // Add a cache-busting query parameter
  const cacheBustUrl = url.includes('?') 
    ? `${url}&_cb=${Date.now()}` 
    : `${url}?_cb=${Date.now()}`;

  // Merge custom options with defaults
  const fetchOptions: RequestInit = {
    method,
    headers: { ...headers, ...(options?.headers || {}) },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important: always include credentials
    signal: options?.signal,
  };

  try {
    console.log(`API Request: ${method} ${cacheBustUrl}`);
    const res = await fetch(cacheBustUrl, fetchOptions);

    // Check if response is JSON before trying to parse it
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      // Special handling for authentication errors
      if (res.status === 401) {
        console.error("Authentication error:", url);
        throw new Error("You must be logged in to perform this action");
      }

      if (!res.ok) {
        console.error(`API error: ${res.status} ${res.statusText} for ${url}`);
        const errorData = await res.json().catch(() => ({
          error: res.statusText
        }));
        throw new Error(errorData.error || `${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } else {
      // Non-JSON response
      if (!res.ok) {
        const text = await res.text();
        console.error(`Non-JSON error response: ${res.status} ${res.statusText} for ${url}`);
        console.error(`Response body: ${text.substring(0, 200)}...`);
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      console.warn(`Received non-JSON response from ${url}`);
      return { success: true };
    }
  } catch (error) {
    console.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
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
