// Ad attribution: Meta fills these URL parameters on every click
// (utm_campaign={{campaign.id}}, utm_term={{adset.id}}, utm_content={{ad.id}}).
// We read them from the page URL the browser sends and pass them to the sheet.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = Record<(typeof UTM_KEYS)[number], string>;

export function getAttribution(pageUrl?: string): Attribution {
  const out = Object.fromEntries(UTM_KEYS.map((k) => [k, ""])) as Attribution;
  if (!pageUrl) return out;
  try {
    const params = new URL(pageUrl).searchParams;
    for (const key of UTM_KEYS) {
      // Keep only short, plain values so nothing odd lands in the sheet.
      out[key] = (params.get(key) || "").trim().slice(0, 100);
    }
  } catch {
    // Bad URL: leave the fields empty, the lead itself is still saved.
  }
  return out;
}
