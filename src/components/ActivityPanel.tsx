import { useState, useMemo } from 'react';
import { X, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { formatDateTime, formatRelative } from '../utils';

type ActivityScope = 'all' | 'current';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

const hashColor = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const ActivityPanel = () => {
  const {
    boards,
    columns,
    cards,
    activities,
    currentBoardId,
    activityFilterCardId,
    showActivityPanel,
    setShowActivityPanel,
    clearActivityFilter,
  } = useStore();

  const [scope, setScope] = useState<ActivityScope>('current');

  const currentBoardTitle = boards[currentBoardId]?.title ?? '';
  const filterCardTitle = activityFilterCardId
    ? cards[activityFilterCardId]?.title ?? null
    : null;

  const filteredActivities = useMemo(() => {
    let list = [...activities].sort((a, b) => b.createdAt - a.createdAt);

    if (scope === 'current') {
      list = list.filter((a) => a.boardId === currentBoardId);
    }

    if (activityFilterCardId !== null) {
      list = list.filter((a) => a.cardId === activityFilterCardId);
    }

    return list;
  }, [activities, scope, currentBoardId, activityFilterCardId]);

  if (!showActivityPanel) return null;

  return (
    <motion.div
      initial={{ right: -360 }}
      animate={{ right: 0 }}
      exit={{ right: -360 }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
      className="fixed top-0 h-full w-[360px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
    >
      <div className="shrink-0 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">活动记录</h2>
        <button
          onClick={() => setShowActivityPanel(false)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 space-y-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setScope('current');
              clearActivityFilter();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              scope === 'current' && activityFilterCardId === null
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            当前看板
          </button>
          <button
            onClick={() => {
              setScope('all');
              clearActivityFilter();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              scope === 'all' && activityFilterCardId === null
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部看板
          </button>
        </div>

        {activityFilterCardId !== null && filterCardTitle && (
          <button
            onClick={clearActivityFilter}
            className="w-full text-left px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
          >
            ← 返回全部 · 卡片: <span className="font-semibold">{filterCardTitle}</span>
          </button>
        )}

        {activityFilterCardId === null && scope === 'current' && (
          <div className="text-xs text-slate-400">看板: {currentBoardTitle}</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2 px-6 text-center">
            <div>暂无活动记录</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredActivities.map((a) => {
              const color = hashColor(a.user);
              const initial = a.user ? a.user.charAt(0).toUpperCase() : 'U';
              return (
                <li key={a.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold ${color}`}
                    >
                      {/^[\u4e00-\u9fa5]/.test(initial) ? (
                        <User size={14} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700 leading-relaxed break-words">
                        <span className="font-medium text-slate-800 mr-1">{a.user}</span>
                        {a.details}
                      </div>
                      <div
                        className="text-xs text-slate-400 mt-1"
                        title={formatDateTime(a.createdAt)}
                      >
                        {formatRelative(a.createdAt)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
};
