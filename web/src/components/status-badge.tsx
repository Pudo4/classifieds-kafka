import type { ListingStatus } from '../lib/types.js';

const STYLES: Record<ListingStatus, string> = {
  draft: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  archived: 'bg-slate-200 text-slate-500',
};

const LABELS: Record<ListingStatus, string> = {
  draft: 'черновик',
  pending: 'на модерации',
  active: 'активно',
  rejected: 'отклонено',
  archived: 'в архиве',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>;
}
