/**
 * sasang-platform — 사이트 비밀번호 미들웨어
 *
 * 사용처: 새 프로젝트 폴더의 루트에 `middleware.ts`로 복사
 *
 * 동작:
 *  - SITE_MODE=internal 일 때 모든 페이지를 비밀번호 게이트로 보호
 *  - SITE_MODE=public 일 때 게이트 해제 (일반 RBAC만 동작)
 *  - 정적 파일·_next·API auth 라우트는 통과
 *  - 통과 후 쿠키(sasang-gate)로 SITE_GATE_DAYS 동안 재인증 면제
 *
 * 무료 대안: Vercel Pro의 Password Protection($20/월)과 사실상 동일 UX
 */

import { NextRequest, NextResponse } from "next/server";

const GATE_COOKIE = "sasang-gate";
const GATE_PATH = "/_gate";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. SITE_MODE=public 이면 미들웨어 통과
  if (process.env.SITE_MODE === "public") {
    return NextResponse.next();
  }

  // 2. 게이트 페이지 자체, 정적 자산, Auth API는 통과
  if (
    pathname.startsWith(GATE_PATH) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // 3. 게이트 쿠키 검증
  const cookie = req.cookies.get(GATE_COOKIE)?.value;
  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    // 환경변수 미설정 시 안전한 기본 동작: 차단
    return new NextResponse(
      "Site not configured. SITE_PASSWORD missing.",
      { status: 503 }
    );
  }

  // 쿠키가 SITE_PASSWORD와 일치하면 통과
  // (실제 운영에선 별도 토큰을 발급하여 비교하는 게 더 안전 — v2에서 개선)
  if (cookie === expected) {
    return NextResponse.next();
  }

  // 4. 게이트 페이지로 리다이렉트 (원래 가려던 URL을 query로 보존)
  const url = req.nextUrl.clone();
  url.pathname = GATE_PATH;
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

// 정적 파일 패턴 제외
export const config = {
  matcher: [
    /*
     * 모든 경로를 매칭하되 다음은 제외:
     * - api/auth (NextAuth.js)
     * - _next/static (정적 빌드 산출물)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
