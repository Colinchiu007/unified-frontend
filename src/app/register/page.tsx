"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { useTranslations } from "@/i18n/TranslationsProvider";

export default function RegisterPage() {
  const { t } = useTranslations();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("register.password_mismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("register.password_too_short"));
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        username,
        email: email || undefined,
        password,
      });
      localStorage.setItem("token", res.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? t("register.register_failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-4 p-6 sm:p-8 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold mb-1">{t("register.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("register.subtitle")}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("register.username_label")}</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t("register.email_label")} <span className="text-muted-foreground font-normal">{t("register.email_optional")}</span>
            </label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("register.password_label")}</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("register.confirm_label")}</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50"
          >
            {loading ? t("register.submitting") : t("register.submit")}
          </button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            {t("register.has_account")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("register.login_link")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
