import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { useKeyboardA11y } from '../hooks/useKeyboardA11y';
import { CARD_HEADER_COLORS, PRIORITY_STYLES, PRIORITY_LABELS, formatDate } from '../utils';
import type { Card as CardType } from '../types';

interface KanbanCardProps {
  card: CardType;
}

export const KanbanCard = ({ card }: KanbanCardProps) => {
  const setSelectedCard = useStore((s) => s.setSelectedCard);
  const { isFocused, onKeyDown } = useKeyboardA11y(card.id, card.columnId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = card.dueDate !== null && card.dueDate < Date.now();

  const handleClick = () => {
    setSelectedCard(card.id);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      tabIndex={0}
      data-card-id={card.id}
      data-column-id={card.columnId}
      onKeyDown={onKeyDown}
      onClick={handleClick}
      className={`
        group relative rounded-lg border border-slate-200 bg-white shadow-sm
        hover:shadow-md hover:border-slate-300
        transition-colors duration-150 cursor-pointer select-none
        ${isDragging ? 'drag-overlay opacity-50 scale-[0.98] z-50' : ''}
        ${isFocused ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
      `}
    >
      {card.color !== 'none' && (
        <div className={`h-[3px] rounded-t-lg ${CARD_HEADER_COLORS[card.color]}`} />
      )}

      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <button
            type="button"
            className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 focus:outline-none focus:text-slate-500 shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-800 leading-snug break-words">
              {card.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2 pl-6">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none border ${PRIORITY_STYLES[card.priority]}`}
          >
            {PRIORITY_LABELS[card.priority]}
          </span>

          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
              style={{
                backgroundColor: tag.color + '20',
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pl-6">
          <div className="flex items-center gap-2">
            {card.assignee && (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white leading-none">
                    {card.assignee.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {card.dueDate !== null && (
              <div
                className={`flex items-center gap-0.5 text-[10px] ${
                  isOverdue ? 'text-red-500' : 'text-slate-400'
                }`}
              >
                <Calendar size={10} />
                <span>{formatDate(card.dueDate)}</span>
              </div>
            )}
          </div>

          {(card.comments.length > 0 || card.attachments.length > 0) && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              {card.comments.length > 0 && (
                <span>{card.comments.length} 💬</span>
              )}
              {card.attachments.length > 0 && (
                <span>{card.attachments.length} 📎</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
