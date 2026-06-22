import { Card } from "./Card";
import { companyNews } from "../data/mock";
import type { NewsCategory } from "../data/mock";

const CATEGORY_STYLE: Record<NewsCategory, string> = {
  소식: "bg-seum-100 text-seum-700",
  보도: "bg-indigo-100 text-indigo-700",
  이야기: "bg-amber-100 text-amber-700",
};

/** 세움 소식 — 회사 소식·보도·이야기 */
export function CompanyNews() {
  return (
    <Card title="세움 소식" icon="notice">
      <ul className="divide-y divide-neutral-100">
        {companyNews.map((n) => (
          <li key={n.id}>
            <a href="#" className="group flex items-center gap-2 py-2.5 text-sm">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${CATEGORY_STYLE[n.category]}`}
              >
                {n.category}
              </span>
              <span className="min-w-0 flex-1 truncate text-neutral-700 transition group-hover:text-seum-600">
                {n.title}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                {n.date}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
