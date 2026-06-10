import { KpiCards } from "@/features/portal/components/KpiCards";
import { QuickLaunch } from "@/features/portal/components/QuickLaunch";
import { TodaySchedule } from "@/features/portal/components/TodaySchedule";
import { NoticeBoard } from "@/features/portal/components/NoticeBoard";
import { ContractStatus } from "@/features/portal/components/ContractStatus";
import { MyTasks } from "@/features/portal/components/MyTasks";
import { ProfileCard } from "@/features/portal/components/ProfileCard";
import { RealtimeAlerts } from "@/features/portal/components/RealtimeAlerts";

/** 세움 플랫폼 통합 메인 대시보드 */
export default function PortalDashboard() {
  return (
    <div className="space-y-4">
      {/* 상단 KPI 카드 */}
      <KpiCards />

      {/* 빠른 실행 메뉴 */}
      <QuickLaunch />

      {/* 4열 대시보드 그리드 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <TodaySchedule />
        <NoticeBoard />
        <div className="flex flex-col gap-4">
          <ContractStatus />
          <MyTasks />
        </div>
        <div className="flex flex-col gap-4">
          <ProfileCard />
          <RealtimeAlerts />
        </div>
      </div>
    </div>
  );
}
