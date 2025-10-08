import { auth } from "./firebase";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function waitForUser(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (auth.currentUser) return resolve(auth.currentUser);
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        unsub();
        resolve(u);
      }
    });
    setTimeout(() => {
      unsub();
      resolve(auth.currentUser);
    }, timeoutMs);
  });
}

async function getToken(force = false) {
  const u = auth.currentUser || (await waitForUser(3000));
  return u ? u.getIdToken(force) : null;
}

export async function authedFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const method = (opts.method || "GET").toUpperCase();
  let token = await getToken(false);

  const doFetch = async (bearer) => {
    const headers = new Headers(opts.headers || {});

    // Only set Content-Type when sending a body
    if (opts.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add Authorization only when we actually have a token
    if (bearer && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }

    return fetch(url, {
      ...opts,
      method,
      headers,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
  };

  let res = await doFetch(token);

  // If unauthorized once, force-refresh the token and retry a single time
  if (res.status === 401 && auth.currentUser) {
    token = await getToken(true);
    res = await doFetch(token);
  }

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (isJson) {
      try {
        const body = await res.json();
        msg = body?.error || msg;
      } catch (e) {
        console.error(e);
      }
    }
    throw new Error(msg);
  }

  return isJson ? res.json() : res.text();
}

export function formatINR(value) {
  const num = Number(value);
  if (!isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}
