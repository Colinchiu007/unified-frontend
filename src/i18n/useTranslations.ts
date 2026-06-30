export type Locale = "zh-CN" | "en-US";

type Messages = Record<string, Record<string, string | Record<string, string>>>;

function flattenKeys(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[k] = value;
    } else if (value && typeof value === "object") {
      Object.assign(result, flattenKeys(value, k));
    }
  }
  return result;
}

const messagesCache = new Map<string, Record<string, string>>();

async function loadMessages(locale: Locale): Promise<Record<string, string>> {
  if (messagesCache.has(locale)) return messagesCache.get(locale)!;
  const data: Messages = await import(`./messages/${locale}.json`);
  const flat = flattenKeys(data);
  messagesCache.set(locale, flat);
  return flat;
}

export function t(
  messages: Record<string, string>,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = messages[key];
  if (!text) {
    console.warn(`[i18n] Missing translation key: ${key}`);
    text = key;
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export async function getMessages(locale: Locale) {
  return loadMessages(locale);
}

export { loadMessages };
