"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
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
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);
    try {
      const res = await register({ username, email, password });
      localStorage.setItem("token", res.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-96 p-8 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold mb-1">注册账号</h1>
        <p className="text-sm text-muted-foreground mb-6">
          加入 TrendScope，开始使用一站式视频生成平台
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">用户名</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium">邮箱</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">密码</label>
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
            <label className="text-sm font-medium">确认密码</label>
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
            {loading ? "注册中…" : "注册"}
          </button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              去登录
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
