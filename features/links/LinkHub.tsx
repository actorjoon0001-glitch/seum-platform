import { appLinks } from "./links";

/**
 * 외부 시스템 바로가기 허브. 메인 화면에 표시된다.
 * 링크가 없으면 안내용 빈 상태를 보여준다.
 */
export function LinkHub() {
  return (
    <section className="mt-16">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          바로가기
        </h3>
        <span className="text-xs text-neutral-600">{appLinks.length}개</span>
      </div>

      {appLinks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 text-center text-sm text-neutral-500">
          아직 등록된 바로가기가 없습니다.
          <br />
          연결할 시스템 링크를 추가하면 여기에 카드로 나타납니다.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-brand/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{link.title}</span>
                <span className="text-neutral-600 transition group-hover:text-brand">
                  ↗
                </span>
              </div>
              {link.description && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {link.description}
                </p>
              )}
              {link.category && (
                <span className="mt-3 inline-block w-fit rounded-full border border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-400">
                  {link.category}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
