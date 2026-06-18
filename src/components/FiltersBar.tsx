import { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  XCircle,
  Tag,
  User,
  AlertCircle,
  Calendar,
  RotateCcw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useStore, useFilteredCardIds } from '../store';
import type { Priority, Tag as TagType } from '../types';
import { formatDate } from '../utils';

interface FiltersBarProps {
  visible: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; style: string; activeStyle: string }[] = [
  {
    value: 'high',
    label: '高',
    style: 'border-red-300 text-red-600 hover:bg-red-50',
    activeStyle: 'bg-red-500 border-red-500 text-white hover:bg-red-600',
  },
  {
    value: 'medium',
    label: '中',
    style: 'border-amber-300 text-amber-600 hover:bg-amber-50',
    activeStyle: 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600',
  },
  {
    value: 'low',
    label: '低',
    style: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
    activeStyle: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600',
  },
];

export const FiltersBar = ({ visible, onClose }: FiltersBarProps) => {
  const { filters, setFilters, resetFilters, cards, columns, currentBoardId, boards } = useStore();

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  const currentBoard = boards[currentBoardId];

  const allCardIds = useMemo(() => {
    if (!currentBoard) return [] as string[];
    const ids: string[] = [];
    currentBoard.columnIds.forEach((cid) => {
      const col = columns[cid];
      if (col) ids.push(...col.cardIds);
    });
    return ids;
  }, [currentBoard, columns]);

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    allCardIds.forEach((cid) => {
      const card = cards[cid];
      if (card && card.assignee) set.add(card.assignee);
    });
    return Array.from(set);
  }, [allCardIds, cards]);

  const allTags = useMemo(() => {
    const map = new Map<string, TagType>();
    allCardIds.forEach((cid) => {
      const card = cards[cid];
      if (card) {
        card.tags.forEach((t) => map.set(t.id, t));
      }
    });
    return Array.from(map.values());
  }, [allCardIds, cards]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleAssignee = (value: string) => {
    const next = filters.assignees.includes(value)
      ? filters.assignees.filter((a) => a !== value)
      : [...filters.assignees, value];
    setFilters({ assignees: next });
  };

  const togglePriority = (value: Priority) => {
    const next = filters.priorities.includes(value)
      ? filters.priorities.filter((p) => p !== value)
      : [...filters.priorities, value];
    setFilters({ priorities: next });
  };

  const toggleTag = (tagId: string) => {
    const next = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    setFilters({ tags: next });
  };

  const handleDueDateFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters({ dueDateFrom: val ? new Date(val).getTime() : null });
  };

  const handleDueDateTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters({ dueDateTo: val ? new Date(val).getTime() + 86399999 : null });
  };

  const activeFilterCount =
    filters.assignees.length +
    filters.priorities.length +
    filters.tags.length +
    (filters.dueDateFrom !== null ? 1 : 0) +
    (filters.dueDateTo !== null ? 1 : 0);

  if (!visible) return null;

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-6">
          <div className="relative" ref={assigneeRef}>
            <button
              onClick={() => setAssigneeOpen(!assigneeOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors text-sm"
            >
              <User size={15} className="text-slate-400" />
              <span className="text-slate-600">负责人</span>
              {filters.assignees.length > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium min-w-[20px] text-center">
                  {filters.assignees.length}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${assigneeOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {assigneeOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 max-h-64 overflow-y-auto">
                <button
                  onClick={() => toggleAssignee('__unassigned__')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
                      ?
                    </span>
                    未分配
                  </span>
                  {filters.assignees.includes('__unassigned__') && (
                    <Check size={14} className="text-indigo-500" />
                  )}
                </button>
                {allAssignees.length > 0 && <div className="border-t border-slate-100 my-1" />}
                {allAssignees.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAssignee(a)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium"
                      >
                        {a.slice(0, 1)}
                      </span>
                      {a}
                    </span>
                    {filters.assignees.includes(a) && (
                      <Check size={14} className="text-indigo-500" />
                    )}
                  </button>
                ))}
                {allAssignees.length === 0 && (
                  <div className="px-3 py-3 text-xs text-slate-400 text-center">
                    暂无负责人
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-slate-400" />
            <span className="text-sm text-slate-600">优先级</span>
            <div className="flex items-center gap-1.5 ml-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => togglePriority(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    filters.priorities.includes(opt.value) ? opt.activeStyle : opt.style
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={15} className="text-slate-400" />
            <span className="text-sm text-slate-600">标签</span>
            {allTags.length === 0 ? (
              <span className="text-xs text-slate-400 ml-1">暂无标签</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap ml-1">
                {allTags.map((tag) => {
                  const active = filters.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? 'border-transparent text-white shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                      style={active ? { backgroundColor: tag.color } : {}}
                    >
                      <span
                        className={active ? '' : ''}
                        style={!active ? { color: tag.color } : {}}
                      >
                        {active && <Check size={10} className="inline mr-0.5 -mt-0.5" />}
                        {tag.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={15} className="text-slate-400" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dueDateFrom ? formatDate(filters.dueDateFrom) : ''}
                onChange={handleDueDateFrom}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="开始日期"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.dueDateFromOpen}
                  onChange={(e) => setFilters({ dueDateFromOpen: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                />
                包含未设置
              </label>
              <span className="text-slate-300">—</span>
              <input
                type="date"
                value={filters.dueDateTo ? formatDate(filters.dueDateTo) : ''}
                onChange={handleDueDateTo}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="结束日期"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.dueDateToOpen}
                  onChange={(e) => setFilters({ dueDateToOpen: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                />
                包含未设置
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              重置 ({activeFilterCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
