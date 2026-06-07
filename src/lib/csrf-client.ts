let csrfToken: string | null = null;
let initPromise: Promise<void> | null = null;

export async function initCsrfToken() {
  if (csrfToken) return;
  if (initPromise) return initPromise;

  initPromise = fetch("/api/csrf")
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch CSRF token");
      return r.json();
    })
    .then((data) => {
      if (data.csrfToken) csrfToken = data.csrfToken;
    })
    .catch((error) => {
      // Fail silently on unauthenticated pages, but log for debugging
      console.error("initCsrfToken error:", error);
    });

  return initPromise;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  await initCsrfToken();

  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const res = await fetch(url, { ...options, headers });

  const newToken = res.headers.get("X-CSRF-Token");
  if (newToken) {
    csrfToken = newToken;
  }

  return res;
}
