import { NoticeBoard } from "@/features/portal/components/NoticeBoard";
import { TodaySchedule } from "@/features/portal/components/TodaySchedule";
import { RecentUpdates } from "@/features/portal/components/RecentUpdates";
import { MyInfoCard } from "@/features/portal/components/MyInfoCard";
import { CompanyNews } from "@/features/portal/components/CompanyNews";

/** 세움 플랫폼 메인 — 회사 포털 허브 (공지·소식·일정·업데이트·내 정보) */
export default function PortalHome() {
  return (
    <div className="space-y-5">
      {/* 메인 상단: 타이틀 */}
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-600 to-seum-500 px-6 py-7 text-white shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          세움디자인하우징 통합 업무 포털
        </h1>
        <p className="mt-1.5 text-sm text-seum-50/90">
          영업 · 설계 · 시공 · 정산 업무를 하나로 연결합니다.
        </p>
      </section>

      {/* 1행: 공지사항(2) + 내 정보(1) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div id="notices" className="scroll-mt-32 lg:col-span-2">
          <NoticeBoard />
        </div>
        <MyInfoCard />
      </div>

      {/* 2행: 세움 소식 + 최근 업데이트 + 오늘 일정 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <CompanyNews />
        <div id="updates" className="scroll-mt-32">
          <RecentUpdates />
        </div>
        <div id="schedule" className="scroll-mt-32">
          <TodaySchedule />
        </div>
      </div>
    </div>
  );
}
