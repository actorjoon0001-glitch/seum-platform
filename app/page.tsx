const features = [
  { title: "고객관리 (CRM)", desc: "유입 고객을 상태 파이프라인으로 관리해 전환율을 높입니다." },
  { title: "건축 모델 카탈로그", desc: "10·14·19·25평 및 맞춤설계 모델과 옵션을 데이터로 관리합니다." },
  { title: "실시간 견적", desc: "옵션 선택 즉시 가격이 반영되고 견적서를 PDF로 발송합니다." },
  { title: "3D 설계", desc: "평면도·3D 뷰에서 가구·창문·문을 배치합니다. (AI 자동설계 확장)" },
  { title: "계약 관리", desc: "계약금·중도금·잔금을 추적하고 계약서를 PDF로 관리합니다." },
  { title: "시공 관리", desc: "설계→허가→생산→운송→설치까지 단계와 현장 사진을 기록합니다." },
];

const stage = ["계약", "설계", "허가", "생산", "운송", "설치", "완료"];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="text-center">
        <span className="inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-sm text-brand">
          Building SaaS · 설계 우선
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Build<span className="text-brand">Lab</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-400">
          건축회사 · 이동식주택 · 전원주택 · 인테리어 업체를 위한
          <br className="hidden sm:block" />
          상담부터 견적, 3D 설계, 계약, 시공까지 하나로 잇는 플랫폼
        </p>
      </header>

      <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-brand/50"
          >
            <h2 className="text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
        <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          시공 단계
        </h3>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {stage.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="rounded-lg bg-neutral-800 px-3 py-1.5">{s}</span>
              {i < stage.length - 1 && <span className="text-neutral-600">→</span>}
            </span>
          ))}
        </div>
      </section>

      <footer className="mt-16 text-center text-sm text-neutral-600">
        Next.js 15 · TypeScript · TailwindCSS · Supabase · Netlify · React Three Fiber
        <div className="mt-2">설계 문서는 저장소 <code className="text-neutral-400">docs/</code> 참고</div>
      </footer>
    </main>
  );
}
