"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
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
      setError(err.message ?? "登录失败");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-96 p-8 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold mb-6">TrendScope</h1>
        <p className="text-sm text-muted-foreground mb-6">
          一站式视频生成平台
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">用户名 / 邮箱</label>
            <input
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium"
          >
            登录
          </button>
        </div>
      </form>
    </div>
  );
}