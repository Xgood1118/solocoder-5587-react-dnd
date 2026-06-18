import React, { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { Card, Column } from '../types';

type ActiveItem =
  | { type: 'card'; card: Card }
  | { type: 'column'; column: Column }
  | null;

export const KanbanBoard = () => {
  const boards = useStore((s) => s.boards);
  const columns = useStore((s) => s.columns);
  const cards = useStore((s) => s.cards);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const moveCard = useStore((s) => s.moveCard);
  const moveColumn = useStore((s) => s.moveColumn);
  const createColumn = useStore((s) => s.createColumn);

  const [activeItem, setActiveItem] = useState<ActiveItem>(null);

  const initialCardPos = useRef<{ columnId: string; index: number } | null>(null);

  const board = boards[currentBoardId];
  const boardColumnIds = board ? board.columnIds : [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnForCard = (cardId: string): string | null => {
    for (const colId of boardColumnIds) {
      const col = columns[colId];
      if (col && col.cardIds.includes(cardId)) {
        return colId;
      }
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    if (!activeData) return;

    if (activeData.type === 'card') {
      const card = cards[active.id as string];
      if (card) {
        setActiveItem({ type: 'card', card });
        const fromColumnId = findColumnForCard(card.id);
        if (fromColumnId) {
          const fromCol = columns[fromColumnId];
          const fromIndex = fromCol.cardIds.indexOf(card.id);
          initialCardPos.current = { columnId: fromColumnId, index: fromIndex };
        }
      }
    } else if (activeData.type === 'column') {
      const column = columns[active.id as string];
      if (column) {
        setActiveItem({ type: 'column', column });
      }
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    if (!activeData || activeData.type !== 'card') return;

    const activeCardId = active.id as string;
    const fromColumnId = findColumnForCard(activeCardId);
    if (!fromColumnId) return;

    const overData = over.data.current;
    let toColumnId: string | null = null;

    if (overData && overData.type === 'column') {
      toColumnId = over.id as string;
    } else if (overData && overData.type === 'card') {
      const overCardId = over.id as string;
      toColumnId = findColumnForCard(overCardId);
    } else {
      return;
    }

    if (!toColumnId) return;

    if (fromColumnId === toColumnId) return;

    const fromCol = columns[fromColumnId];
    const fromIndex = fromCol.cardIds.indexOf(activeCardId);
    if (fromIndex === -1) return;

    let toIndex: number;
    const toCol = columns[toColumnId];

    if (overData.type === 'column') {
      toIndex = toCol.cardIds.length;
    } else {
      const overCardId = over.id as string;
      toIndex = toCol.cardIds.indexOf(overCardId);
      if (toIndex === -1) toIndex = toCol.cardIds.length;
    }

    moveCard(fromColumnId, toColumnId, fromIndex, toIndex);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    const initial = initialCardPos.current;
    initialCardPos.current = null;

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    if (!activeData) return;

    if (activeData.type === 'column') {
      const activeColumnId = active.id as string;
      const overColumnId = over.id as string;

      const fromIndex = boardColumnIds.indexOf(activeColumnId);
      const toIndex = boardColumnIds.indexOf(overColumnId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        moveColumn(currentBoardId, fromIndex, toIndex);
      }
      return;
    }

    if (activeData.type === 'card') {
      const activeCardId = active.id as string;
      const currentColumnId = findColumnForCard(activeCardId);
      if (!currentColumnId) return;

      const currentCol = columns[currentColumnId];
      const currentCardIndex = currentCol.cardIds.indexOf(activeCardId);
      if (currentCardIndex === -1) return;

      const overData = over.data.current;

      if (!initial) return;

      if (initial.columnId === currentColumnId) {
        let targetIndex: number | null = null;

        if (overData?.type === 'card') {
          const overCardId = over.id as string;
          const overColId = findColumnForCard(overCardId);
          if (overColId !== currentColumnId) return;
          const overCardIndex = currentCol.cardIds.indexOf(overCardId);
          if (overCardIndex === -1 || overCardIndex === currentCardIndex) return;
          targetIndex = overCardIndex;
        } else if (overData?.type === 'column') {
          if (over.id !== currentColumnId) return;
          targetIndex = currentCol.cardIds.length - 1;
        } else {
          return;
        }

        if (targetIndex === null || targetIndex === currentCardIndex) return;

        const movedIds = arrayMove(currentCol.cardIds, currentCardIndex, targetIndex);
        const finalIndex = movedIds.indexOf(activeCardId);
        moveCard(currentColumnId, currentColumnId, currentCardIndex, finalIndex);
      } else {
        let finalIndex: number | null = null;
        if (overData?.type === 'card') {
          const overCardId = over.id as string;
          if (over.id === active.id) return;
          const overColId = findColumnForCard(overCardId);
          if (overColId !== currentColumnId) return;
          finalIndex = currentCol.cardIds.indexOf(overCardId);
          if (finalIndex === -1) finalIndex = currentCol.cardIds.length;
        } else if (overData?.type === 'column') {
          if (over.id !== currentColumnId) return;
          finalIndex = currentCol.cardIds.length;
        }

        if (finalIndex !== null && finalIndex !== currentCardIndex) {
          moveCard(currentColumnId, currentColumnId, currentCardIndex, finalIndex);
        }
      }
    }
  };

  const handleAddColumn = () => {
    const title = `列 ${boardColumnIds.length + 1}`;
    createColumn(currentBoardId, title);
  };

  if (!board) return null;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={boardColumnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-5 h-full items-start">
            {boardColumnIds.map((colId) => {
              const col = columns[colId];
              if (!col) return null;
              return <KanbanColumn key={colId} column={col} />;
            })}

            <button
              type="button"
              onClick={handleAddColumn}
              className="w-[300px] min-w-[300px] h-16 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors cursor-pointer"
            >
              <Plus size={20} />
            </button>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem?.type === 'card' && (
            <KanbanCard card={activeItem.card} />
          )}
          {activeItem?.type === 'column' && (
            <div className="bg-slate-100/80 rounded-xl w-[300px] min-w-[300px] max-w-[300px] p-3 opacity-80 shadow-xl border border-slate-200">
              <div className="text-sm font-semibold text-slate-700 mb-1">
                {activeItem.column.title}
              </div>
              <div className="text-xs text-slate-500">
                {activeItem.column.cardIds.length} 张卡片
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
