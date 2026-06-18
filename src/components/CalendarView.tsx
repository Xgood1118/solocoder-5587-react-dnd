import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import type { Card, Priority } from '../types';
import { CARD_COLORS } from '../utils';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isSameDay = (a: number, b: number): boolean => {
  return startOfDay(a) === startOfDay(b);
};

const MiniCard = ({ card, onClick }: { card: Card; onClick: () => void }) => {
  const colorClass = CARD_COLORS[card.color];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border px-2 py-1 text-xs ${colorClass} hover:shadow-sm transition-shadow truncate flex items-center gap-1.5`}
      title={card.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[card.priority]}`} />
      <span className="truncate text-slate-700">{card.title}</span>
    </button>
  );
};

export const CalendarView = () => {
  const { boards, currentBoardId, columns, cards, filters, selectedCardId, setSelectedCard } =
    useStore();

  const today = Date.now();
  const [cursor, setCursor] = useState<number>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const allCards = useMemo<Card[]>(() => {
    const board = boards[currentBoardId];
    if (!board) return [];
    const result: Card[] = [];
    board.columnIds.forEach((colId) => {
      const col = columns[colId];
      if (!col) return;
      col.cardIds.forEach((cid) => {
        const c = cards[cid];
        if (c) result.push(c);
      });
    });
    return result;
  }, [boards, currentBoardId, columns, cards]);

  const filteredCards = useMemo<Card[]>(() => {
    return allCards.filter((c) => {
      if (filters.assignees.length > 0) {
        const match = c.assignee ? filters.assignees.includes(c.assignee) : false;
        if (!match && !(c.assignee === null && filters.assignees.includes('__unassigned__')))
          return false;
      }
      if (filters.priorities.length > 0 && !filters.priorities.includes(c.priority)) return false;
      if (filters.tags.length > 0) {
        const cardTagIds = c.tags.map((t) => t.id);
        const has = filters.tags.some((tid) => cardTagIds.includes(tid));
        if (!has) return false;
      }
      if (filters.dueDateFrom !== null) {
        if (c.dueDate === null && !filters.dueDateFromOpen) return false;
        if (c.dueDate !== null && c.dueDate < filters.dueDateFrom) return false;
      }
      if (filters.dueDateTo !== null) {
        if (c.dueDate === null && !filters.dueDateToOpen) return false;
        if (c.dueDate !== null && c.dueDate > filters.dueDateTo) return false;
      }
      return true;
    });
  }, [allCards, filters]);

  const { daysGrid, monthLabel, prevMonth, nextMonth } = useMemo(() => {
    const first = new Date(cursor);
    first.setDate(1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const startWeekday = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const prev = new Date(y, m - 1, 1).getTime();
    const next = new Date(y, m + 1, 1).getTime();

    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m, d);
      dt.setHours(0, 0, 0, 0);
      days.push(dt.getTime());
    }
    while (days.length % 7 !== 0) days.push(null);

    return {
      daysGrid: days,
      monthLabel: `${y}年${m + 1}月`,
      prevMonth: prev,
      nextMonth: next,
    };
  }, [cursor]);

  const cardsByDate = useMemo(() => {
    const map: Record<number, Card[]> = {};
    const undated: Card[] = [];
    filteredCards.forEach((c) => {
      if (c.dueDate === null) {
        undated.push(c);
      } else {
        const key = startOfDay(c.dueDate);
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    return { map, undated };
  }, [filteredCards]);

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(prevMonth)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-semibold text-slate-800 min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => setCursor(nextMonth)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 shrink-0">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs font-medium py-1.5 ${
              i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto auto-rows-fr">
        {daysGrid.map((dayTs, idx) => {
          if (dayTs === null) {
            return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-md" />;
          }
          const date = new Date(dayTs);
          const dayNum = date.getDate();
          const isToday = isSameDay(dayTs, today);
          const dayCards = cardsByDate.map[dayTs] ?? [];
          return (
            <div
              key={dayTs}
              className={`min-h-[90px] rounded-md border p-1.5 flex flex-col gap-1 bg-white ${
                isToday
                  ? 'ring-2 ring-blue-500 border-blue-300'
                  : 'border-slate-200'
              }`}
            >
              <div
                className={`text-xs font-medium shrink-0 ${
                  isToday
                    ? 'text-blue-600'
                    : idx % 7 === 0 || idx % 7 === 6
                      ? 'text-slate-400'
                      : 'text-slate-500'
                }`}
              >
                {dayNum}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayCards.map((card) => (
                  <MiniCard
                    key={card.id}
                    card={card}
                    onClick={() => setSelectedCard(card.id === selectedCardId ? null : card.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {cardsByDate.undated.length > 0 && (
        <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">未设置日期</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {cardsByDate.undated.map((card) => (
              <MiniCard
                key={card.id}
                card={card}
                onClick={() => setSelectedCard(card.id === selectedCardId ? null : card.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
