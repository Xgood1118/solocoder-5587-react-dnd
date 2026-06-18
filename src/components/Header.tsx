import { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  CalendarDays,
  Filter,
  History,
  Undo2,
  Redo2,
  Download,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import { exportJson as exportToJSON, exportMarkdown as exportToMarkdown } from '../utils/export';
import { BoardSwitcher } from './BoardSwitcher';

interface HeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const Header = ({ showFilters, onToggleFilters }: HeaderProps) => {
  const {
    setViewMode,
    viewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    currentBoardId,
    renameBoard,
    setShowActivityPanel,
    boards,
  } = useStore();

  const [showExport, setShowExport] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentBoard = boards[currentBoardId];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditTitle(currentBoard?.title ?? '');
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    if (editTitle.trim() && currentBoard) {
      renameBoard(currentBoard.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const store = useStore();

  const handleExportJSON = () => {
    exportToJSON(store, currentBoardId);
    setShowExport(false);
  };

  const handleExportMarkdown = () => {
    exportToMarkdown(store, currentBoardId);
    setShowExport(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <BoardSwitcher />
          <div className="h-6 w-px bg-slate-200" />
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-3 py-1.5 text-lg font-semibold border border-indigo-400 rounded-md outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              />
              <button
                onClick={handleConfirmEdit}
                className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
              >
                <Check size={18} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="group flex items-center gap-2 text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
            >
              <span className="truncate max-w-[280px]">{currentBoard?.title ?? '看板'}</span>
              <Pencil
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"
              />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="看板视图"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="日历视图"
            >
              <CalendarDays size={18} />
            </button>
          </div>

          <button
            onClick={onToggleFilters}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="筛选"
          >
            <Filter size={18} />
          </button>

          <button
            onClick={() => setShowActivityPanel(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="活动流"
          >
            <History size={18} />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="撤销"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="重做"
          >
            <Redo2 size={18} />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport(!showExport)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="导出"
            >
              <Download size={18} />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  导出 JSON
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  导出 Markdown
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
