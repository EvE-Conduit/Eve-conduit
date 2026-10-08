/** Small fetch wrapper for the EvE Conduit API: JSON in/out, CSRF header, readable errors. */

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }

  /** The site is in maintenance mode (503 with {maintenance: true}). */
  get maintenance(): boolean {
    return this.status === 503 && !!this.body && typeof this.body === "object" && (this.body as { maintenance?: boolean }).maintenance === true;
  }
}

/** Fired on window when any API call finds the site in maintenance mode; the shell then shows the maintenance screen. */
export const MAINTENANCE_EVENT = "conduit:maintenance";

function csrfToken() {
  return document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] ?? "";
}

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // Validation errors: [{loc: [...], msg: "..."}]
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.at(-1) ?? "value"}: ${d.msg.replace(/^Value error, /, "")}`).join("; ");
    }
  }
  if (status === 403) return "You don't have permission to do that";
  if (status === 502 || status === 504) return "The server isn't responding. Try again in a moment.";
  return `Request failed (${status})`;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path.startsWith("/") ? path : `/api/${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      // A FormData body (a file upload) sets its own multipart Content-Type.
      ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRFToken": csrfToken() } : {}),
    },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // A proxy error page or similar; report the status instead of a JSON parse error.
    if (res.ok) throw new ApiError(res.status, "The server sent an unreadable response");
  }
  if (!res.ok) {
    const err = new ApiError(res.status, messageFrom(data, res.status), data);
    if (err.maintenance) window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT, { detail: err.message }));
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  /** POST a file as multipart form data, under the field name `file`. */
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<T>("POST", path, form);
  },
};
