/**
 * sasang-platform — 사이트 비밀번호 게이트 페이지
 *
 * 사용처: `app/_gate/page.tsx` 로 저장
 * 짝이 되는 API: `app/api/gate/route.ts`
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GatePage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      startTransition(() => router.push(from));
    } else {
      setError("비밀번호가 일치하지 않습니다.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs tracking-widest text-stone-400">사상온누리</p>
          <h1 className="mt-1 font-serif text-xl text-stone-800">
            사상의학 플랫폼
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            승인된 사용자만 이용 가능합니다.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-600">
              접근 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
              autoFocus
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {pending ? "확인 중..." : "입장"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-stone-400">
          비밀번호가 필요하시면 운영자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
