import React, { useState, useRef, useEffect } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle, Settings2, GripVertical, Check, X } from 'lucide-react';
import { useStore, useFilteredCardIds } from '../store';
import { KanbanCard } from './KanbanCard';
import { VirtualList } from './VirtualList';
import { EmptyState } from './EmptyState';
import type { Column } from '../types';

interface KanbanColumnProps {
  column: Column;
}

export const KanbanColumn = ({ column }: KanbanColumnProps) => {
  const cards = useStore((s) => s.cards);
  const createCard = useStore((s) => s.createCard);
  const renameColumn = useStore((s) => s.renameColumn);
  const setColumnWipLimit = useStore((s) => s.setColumnWipLimit);
  const deleteColumn = useStore((s) => s.deleteColumn);

  const filteredCardIds = useFilteredCardIds(column.id);
  const cardCount = filteredCardIds.length;
  const isWipExceeded = column.wipLimit !== null && cardCount > column.wipLimit;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [showSettings, setShowSettings] = useState(false);
  const [showWipInput, setShowWipInput] = useState(false);
  const [wipDraft, setWipDraft] = useState(column.wipLimit?.toString() ?? '');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const addCardInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isAddingCard && addCardInputRef.current) {
      addCardInputRef.current.focus();
    }
  }, [isAddingCard]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
        setShowWipInput(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const handleSaveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== column.title) {
      renameColumn(column.id, trimmed);
    } else {
      setTitleDraft(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleDraft(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleSaveWip = () => {
    const val = wipDraft.trim();
    if (val === '') {
      setColumnWipLimit(column.id, null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        setColumnWipLimit(column.id, num);
      }
    }
    setShowWipInput(false);
  };

  const handleWipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveWip();
    } else if (e.key === 'Escape') {
      setWipDraft(column.wipLimit?.toString() ?? '');
      setShowWipInput(false);
    }
  };

  const handleAddCard = () => {
    const trimmed = newCardTitle.trim();
    if (trimmed) {
      createCard(column.id, trimmed);
      setNewCardTitle('');
    }
    setIsAddingCard(false);
  };

  const handleAddCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleStartRename = () => {
    setTitleDraft(column.title);
    setIsEditingTitle(true);
    setShowSettings(false);
  };

  const handleStartWipEdit = () => {
    setWipDraft(column.wipLimit?.toString() ?? '');
    setShowWipInput(true);
  };

  const handleDeleteColumn = () => {
    deleteColumn(column.id);
    setShowSettings(false);
  };

  const renderCard = (cardId: string) => {
    const card = cards[cardId];
    if (!card) return null;
    return <KanbanCard key={cardId} card={card} />;
  };

  const useVirtual = cardCount > 50;

  const cardListContent = cardCount === 0 ? (
    <EmptyState />
  ) : useVirtual ? (
    <SortableContext items={filteredCardIds} strategy={verticalListSortingStrategy}>
      <VirtualList
        items={filteredCardIds}
        estimatedItemHeight={120}
        overscan={5}
        renderItem={(id, _index, itemStyle) => (
          <div key={id} style={itemStyle}>
            {renderCard(id)}
          </div>
        )}
        className="flex-1 overflow-y-auto"
        style={{ height: '100%' }}
      />
    </SortableContext>
  ) : (
    <SortableContext items={filteredCardIds} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-2">
        {filteredCardIds.map((cardId) => renderCard(cardId))}
      </div>
    </SortableContext>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-100 rounded-xl w-[300px] min-w-[300px] max-w-[300px] flex flex-col max-h-[calc(100vh-5rem)]"
    >
      <div
        className={`px-3 py-2.5 flex items-center justify-between rounded-t-xl transition-colors ${
          isWipExceeded ? 'bg-amber-50 border-b-2 border-amber-300' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <input
                ref={titleInputRef}
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleSaveTitle}
                className="text-sm font-semibold bg-white border border-slate-300 rounded px-1.5 py-0.5 w-full outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="text-green-600 hover:text-green-700 shrink-0"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(column.title);
                  setIsEditingTitle(false);
                }}
                className="text-slate-400 hover:text-slate-600 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <h3
              className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-indigo-600"
              onClick={() => {
                setTitleDraft(column.title);
                setIsEditingTitle(true);
              }}
            >
              {column.title}
            </h3>
          )}

          <span className="bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 text-xs font-medium shrink-0">
            {isWipExceeded ? `${cardCount}/${column.wipLimit}` : cardCount}
          </span>

          {isWipExceeded && (
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          )}
        </div>

        <div ref={settingsRef} className="relative shrink-0 ml-1">
          <button
            type="button"
            onClick={() => {
              setShowSettings((prev) => !prev);
              setShowWipInput(false);
            }}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <MoreHorizontal size={16} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 w-48">
              <button
                type="button"
                onClick={handleStartRename}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={14} />
                <span>重命名</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <div className="px-3 py-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                  <Settings2 size={14} />
                  <span>WIP 限制</span>
                </div>
                {showWipInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={wipDraft}
                      onChange={(e) => setWipDraft(e.target.value)}
                      onKeyDown={handleWipKeyDown}
                      className="w-16 text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:border-indigo-400"
                      placeholder="限制"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWip}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWipDraft(column.wipLimit?.toString() ?? '');
                        setShowWipInput(false);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartWipEdit}
                    className="text-xs text-slate-500 hover:text-indigo-600"
                  >
                    {column.wipLimit !== null ? `当前: ${column.wipLimit}` : '未设置'}
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={handleDeleteColumn}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                <span>删除列</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-2 py-1"
        data-column-focusable
        tabIndex={0}
      >
        {cardListContent}
      </div>

      <div className="px-2 py-2 border-t border-slate-200/60">
        {isAddingCard ? (
          <div className="flex items-center gap-1">
            <input
              ref={addCardInputRef}
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleAddCardKeyDown}
              onBlur={handleAddCard}
              placeholder="卡片标题"
              className="flex-1 text-sm bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleAddCard}
              className="text-green-600 hover:text-green-700 shrink-0"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setNewCardTitle('');
                setIsAddingCard(false);
              }}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded px-2 py-1 transition-colors"
          >
            <Plus size={14} />
            <span>添加卡片</span>
          </button>
        )}
      </div>
    </div>
  );
};
