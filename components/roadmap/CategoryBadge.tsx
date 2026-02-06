'use client';
const C: Record<string, { l: string; c: string }> = { feature: { l: 'Ominaisuus', c: 'text-purple-400' }, improvement: { l: 'Parannus', c: 'text-cyan-400' }, integration: { l: 'Integraatio', c: 'text-orange-400' }, ui: { l: 'Käyttöliittymä', c: 'text-pink-400' }, data: { l: 'Data', c: 'text-green-400' } };
export default function CategoryBadge({ category }: { category: string }) { const cfg = C[category] || C.feature; return <span className={`text-[11px] ${cfg.c}`}>{cfg.l}</span>; }
