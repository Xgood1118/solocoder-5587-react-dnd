import React, { useState, useMemo } from 'react';
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

  const board = boards[currentBoardId];

  const boardColumnIds = useMemo(
    () => (board ? board.columnIds : []),
    [board]
  );

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

    const fromCol = columns[fromColumnId];
    const fromIndex = fromCol.cardIds.indexOf(activeCardId);
    if (fromIndex === -1) return;

    const overData = over.data.current;
    let toColumnId: string;
    let toIndex: number;

    if (overData && overData.type === 'column') {
      toColumnId = over.id as string;
      const toCol = columns[toColumnId];
      toIndex = toCol.cardIds.length;
    } else if (overData && overData.type === 'card') {
      const overCardId = over.id as string;
      const overColId = findColumnForCard(overCardId);
      if (!overColId) return;
      toColumnId = overColId;
      const toCol = columns[toColumnId];
      const overCardIndex = toCol.cardIds.indexOf(overCardId);
      toIndex = overCardIndex;
    } else {
      return;
    }

    if (fromColumnId === toColumnId && fromIndex === toIndex) return;

    const adjustedToIndex =
      fromColumnId === toColumnId && toIndex > fromIndex
        ? toIndex
        : toIndex;

    moveCard(fromColumnId, toColumnId, fromIndex, adjustedToIndex);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

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
      const fromColumnId = findColumnForCard(activeCardId);
      if (!fromColumnId) return;

      const fromCol = columns[fromColumnId];
      const fromIndex = fromCol.cardIds.indexOf(activeCardId);
      if (fromIndex === -1) return;

      const overData = over.data.current;
      let toColumnId: string;
      let toIndex: number;

      if (overData && overData.type === 'column') {
        toColumnId = over.id as string;
        const toCol = columns[toColumnId];
        toIndex = toCol.cardIds.indexOf(activeCardId);
        if (toIndex === -1) {
          toIndex = toCol.cardIds.length;
        }
      } else if (overData && overData.type === 'card') {
        const overCardId = over.id as string;
        const overColId = findColumnForCard(overCardId);
        if (!overColId) return;
        toColumnId = overColId;
        const toCol = columns[toColumnId];
        const overCardIndex = toCol.cardIds.indexOf(overCardId);
        const currentCardIndex = toCol.cardIds.indexOf(activeCardId);

        if (fromColumnId === toColumnId) {
          if (currentCardIndex !== -1 && currentCardIndex !== overCardIndex) {
            const ids = arrayMove(toCol.cardIds, currentCardIndex, overCardIndex);
            const newFrom = ids.indexOf(activeCardId);
            moveCard(fromColumnId, toColumnId, fromIndex, newFrom);
          }
          return;
        }

        toIndex = overCardIndex;
      } else {
        return;
      }

      if (fromColumnId === toColumnId && fromIndex === toIndex) return;
      moveCard(fromColumnId, toColumnId, fromIndex, toIndex);
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
