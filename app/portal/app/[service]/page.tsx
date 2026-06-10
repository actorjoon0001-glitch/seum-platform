import Link from "next/link";
import { findService } from "@/features/portal/config/systems";
import { Icon } from "@/features/portal/components/icons";

/**
 * 통합 서비스 진입 래퍼 (내부 iframe).
 *
 * 각 OS는 독립 웹서비스다. 포털은 iframe으로 임베드해 단일 진입점을 제공한다.
 * 서비스 URL이 아직 연결되지 않았으면(ready: false) 안내 화면을 보여준다.
 */
export default async function ServiceFrame({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const item = findService(service);

  return (
    <div className="space-y-3">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/portal" className="transition hover:text-seum-600">
          메인 포털
        </Link>
        <Icon name="chevron" size={14} className="-rotate-90 text-neutral-300" />
        <span className="font-semibold text-neutral-800">
          {item?.label ?? "알 수 없는 서비스"}
        </span>
        {item?.serviceUrl && (
          <a
            href={item.serviceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 transition hover:border-seum-300 hover:text-seum-600"
          >
            <Icon name="expand" size={13} /> 새 탭으로 열기
          </a>
        )}
      </div>

      {/* iframe 또는 연결 준비중 안내 */}
      {item?.ready && item.serviceUrl ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <iframe
            src={item.serviceUrl}
            title={item.label}
            className="h-[calc(100vh-200px)] w-full"
          />
        </div>
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-seum-50 text-seum-500">
            <Icon name={item?.icon ?? "grid"} size={32} />
          </span>
          <h1 className="mt-4 text-lg font-bold text-neutral-800">
            {item ? `${item.label} 연결 준비중` : "서비스를 찾을 수 없습니다"}
          </h1>
          <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
            {item
              ? "독립 웹서비스로 운영되며, 연결되면 이 화면에 임베드되어 표시됩니다."
              : "요청하신 서비스가 메뉴에 등록되어 있지 않습니다."}
          </p>
          {item?.serviceUrl && (
            <code className="mt-3 rounded-md bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
              {item.serviceUrl}
            </code>
          )}
          <Link
            href="/portal"
            className="mt-5 rounded-lg bg-seum-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-seum-600"
          >
            메인 포털로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );
}
