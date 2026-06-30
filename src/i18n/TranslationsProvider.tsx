"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  loadMessages,
  t as translate,
  type Locale,
} from "./useTranslations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  messages: Record<string, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  const stored = localStorage.getItem("locale");
  if (stored === "zh-CN" || stored === "en-US") return stored;
  const navLang = navigator.language || "";
  if (navLang.startsWith("en")) return "en-US";
  return "zh-CN";
}

export function TranslationsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    loadMessages(initial).then((msgs) => {
      setMessages(msgs);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    loadMessages(l).then((msgs) => setMessages(msgs));
  }, []);

  const translateFn = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(messages, key, params);
    },
    [messages]
  );

  return (
    <I18nContext.Provider
      value={{ locale, setLocale, t: translateFn, messages }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within TranslationsProvider");
  return ctx;
}
