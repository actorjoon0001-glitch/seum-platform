// Supabase 연동 health check (일회성). `node scripts/health-check.mjs`
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// .env.local 간단 파싱
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("URL:", url);
console.log("KEY:", key ? key.slice(0, 12) + "…(len " + key.length + ")" : "(없음)");

const supabase = createClient(url, key);

// RLS 가 걸린 organizations: 미인증 anon 은 0행이 정상(연결+키 유효 증명)
const { data, error, status } = await supabase
  .from("organizations")
  .select("id")
  .limit(1);

if (error) {
  console.error("\n❌ 연결/쿼리 실패:", status, error.message);
  process.exit(1);
}
console.log("\n✅ 연결 성공! HTTP", status, "· organizations 조회 행수:", data.length, "(RLS 로 0행이 정상)");
