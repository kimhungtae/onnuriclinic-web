// Supabase Edge Function: chat
// 온누리한의원 사이트의 챗봇 백엔드.
// Anthropic API 키를 안전하게 서버 사이드에서 사용합니다.
//
// 배포 방법:
//   1) Supabase 대시보드 → Project Settings → Edge Functions → 환경변수에 ANTHROPIC_API_KEY 추가
//   2) Edge Functions 페이지에서 "Deploy a new function" 클릭, 이름은 "chat"
//   3) 이 파일 내용을 복사해서 붙여넣고 Deploy
//
// 또는 CLI 사용 시:
//   supabase functions deploy chat --no-verify-jwt
//
// 보안: --no-verify-jwt 옵션을 사용하면 누구나 호출 가능하므로,
//       프로덕션에서는 도메인 화이트리스트(아래 ALLOWED_ORIGINS) 또는
//       Rate Limit을 반드시 적용하세요.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 1000;

// 허용 도메인 (배포 후 본인 도메인으로 수정하세요)
const ALLOWED_ORIGINS = [
  "https://onnuriclinic.com",
  "https://www.onnuriclinic.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const { system, messages } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 길이 제한 (악용 방지)
    if (messages.length > 30) {
      return new Response(JSON.stringify({ error: "too many messages" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: typeof system === "string" ? system : undefined,
        messages,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Anthropic API error:", upstream.status, errText);
      return new Response(
        JSON.stringify({ error: "upstream_error", status: upstream.status }),
        {
          status: 502,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        },
      );
    }

    const data = await upstream.json();
    const reply = data?.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ reply, raw: data }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat function error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
