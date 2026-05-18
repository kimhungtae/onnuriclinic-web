/**
 * sasang-platform — Next.js 보안 헤더 설정 예시
 *
 * 사용처: 새 프로젝트의 `next.config.mjs` 로 사용 (또는 부분 병합)
 *
 * CSP 주의: 외부 폰트/스크립트 추가 시 directives 업데이트 필요.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // 이미지 도메인 허용 (필요 시 추가)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.onnuriclinic.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },

  // 보안 헤더 (vercel.json과 중복돼도 무방, 하나만 사용 가능)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.turso.io https://api.resend.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // 외부 공개 모드일 때만 sitemap 노출
  async rewrites() {
    if (process.env.SITE_MODE === "public") {
      return [
        { source: "/sitemap.xml", destination: "/api/sitemap" },
      ];
    }
    return [];
  },
};

export default nextConfig;
