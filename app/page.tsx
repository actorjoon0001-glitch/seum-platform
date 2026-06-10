import { redirect } from "next/navigation";

/**
 * 세움 플랫폼은 고객용 SaaS 소개 사이트가 아니라
 * 세움디자인하우징 내부 업무 포털이다.
 * 루트 진입 시 곧바로 통합 업무 포털로 이동한다.
 */
export default function RootPage() {
  redirect("/portal");
}
