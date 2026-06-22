import { NoticeBoard } from "@/features/portal/components/NoticeBoard";
import { TodaySchedule } from "@/features/portal/components/TodaySchedule";
import { RecentUpdates } from "@/features/portal/components/RecentUpdates";
import { MyInfoCard } from "@/features/portal/components/MyInfoCard";

/** 세움 플랫폼 메인 — 회사 포털 + 업무 시스템 런처 허브 */
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

      {/* 시스템 진입은 상단 바 "시스템" 드롭다운에서 (메인 큰 런처는 제거) */}

      {/* 공지 · 일정 · 업데이트 · 내 정보 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 좌측 2/3: 공지사항 + 최근 업데이트 */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div id="notices" className="scroll-mt-32">
            <NoticeBoard />
          </div>
          <div id="updates" className="scroll-mt-32">
            <RecentUpdates />
          </div>
        </div>

        {/* 우측 1/3: 내 정보 + 오늘 일정 */}
        <div className="flex flex-col gap-5">
          <MyInfoCard />
          <div id="schedule" className="scroll-mt-32">
            <TodaySchedule />
          </div>
        </div>
      </div>
    </div>
  );
}
