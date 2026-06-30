"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useTranslations } from "@/i18n/TranslationsProvider";

export default function LoginPage() {
  const { t } = useTranslations();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? t("login.login_failed"));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-4 p-6 sm:p-8 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold mb-6">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("login.subtitle")}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("login.username_label")}</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("login.password_label")}</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium"
          >
            {t("login.submit")}
          </button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            {t("login.no_account")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t("login.register_link")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
