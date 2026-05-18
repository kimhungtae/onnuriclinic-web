/**
 * sasang-platform — 사이트 비밀번호 검증 API
 *
 * 사용처: `app/api/gate/route.ts` 로 저장
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Not configured" },
      { status: 503 }
    );
  }

  if (password !== expected) {
    // 타이밍 공격 방지를 위한 짧은 지연
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // 인증 성공 — 쿠키 발급
  const days = parseInt(process.env.SITE_GATE_DAYS || "30", 10);
  const maxAge = days * 24 * 60 * 60;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sasang-gate", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  return res;
}
