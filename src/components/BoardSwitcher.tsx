import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Layout, ClipboardList, Inbox } from 'lucide-react';
import { useStore, TemplateName } from '../store';

export const BoardSwitcher = () => {
  const {
    boards,
    currentBoardId,
    setCurrentBoard,
    createBoard,
    deleteBoard,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const boardList = Object.values(boards);
  const currentBoard = boards[currentBoardId];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCreate = (template: TemplateName) => {
    createBoard(template);
    setShowCreateMenu(false);
    setOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (boardList.length <= 1) return;
    deleteBoard(id);
  };

  const templateIcons: Record<TemplateName, React.ReactNode> = {
    blank: <Layout size={16} />,
    agile: <ClipboardList size={16} />,
    gtd: <Inbox size={16} />,
  };

  const templateLabels: Record<TemplateName, string> = {
    blank: '空白模板',
    agile: '敏捷开发',
    gtd: 'GTD 时间管理',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
          <Layout size={16} />
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            我的看板
          </div>
          <div className="max-h-64 overflow-y-auto">
            {boardList.map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  setCurrentBoard(board.id);
                  setOpen(false);
                }}
                onMouseEnter={() => setHoveredBoard(board.id)}
                onMouseLeave={() => setHoveredBoard(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                  board.id === currentBoardId
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      board.id === currentBoardId
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Layout size={14} />
                  </div>
                  <span className="truncate max-w-[170px]">{board.title}</span>
                </div>
                {hoveredBoard === board.id && boardList.length > 1 && (
                  <button
                    onClick={(e) => handleDelete(board.id, e)}
                    className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                    title="删除看板"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-2 pt-2">
            {!showCreateMenu ? (
              <button
                onClick={() => setShowCreateMenu(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <span>创建新看板</span>
              </button>
            ) : (
              <div className="px-2">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  选择模板
                </div>
                {(['blank', 'agile', 'gtd'] as TemplateName[]).map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => handleCreate(tpl)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                      {templateIcons[tpl]}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{templateLabels[tpl]}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
