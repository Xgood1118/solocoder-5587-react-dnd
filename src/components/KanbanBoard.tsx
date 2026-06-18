import React, { useState, useRef, useMemo } from 'react';
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

interface DragOverInfo {
  activeCardId: string;
  toColumnId: string;
  toIndex: number;
}

export const KanbanBoard = () => {
  const boards = useStore((s) => s.boards);
  const columns = useStore((s) => s.columns);
  const cards = useStore((s) => s.cards);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const moveCard = useStore((s) => s.moveCard);
  const moveColumn = useStore((s) => s.moveColumn);
  const createColumn = useStore((s) => s.createColumn);

  const [activeItem, setActiveItem] = useState<ActiveItem>(null);
  const [dragOverInfo, setDragOverInfo] = useState<DragOverInfo | null>(null);

  const initialCardPos = useRef<{
    cardId: string;
    columnId: string;
    index: number;
  } | null>(null);

  const board = boards[currentBoardId];
  const boardColumnIds = board ? board.columnIds : [];

  const columnCardIdsMap = useMemo(() => {
    const m: Record<string, readonly string[]> = {};
    for (const cid of boardColumnIds) {
      const col = columns[cid];
      if (col) m[cid] = col.cardIds;
    }
    return m;
  }, [boardColumnIds, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnForCard = (
    cardId: string,
    map: Record<string, readonly string[]>
  ): string | null => {
    for (const colId of boardColumnIds) {
      const ids = map[colId];
      if (ids && ids.includes(cardId)) return colId;
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
        const fromColumnId = findColumnForCard(card.id, columnCardIdsMap);
        if (fromColumnId) {
          const ids = columnCardIdsMap[fromColumnId];
          const fromIndex = ids.indexOf(card.id);
          if (fromIndex !== -1) {
            initialCardPos.current = {
              cardId: card.id,
              columnId: fromColumnId,
              index: fromIndex,
            };
          }
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
    if (activeItem?.type === 'card') {
      if (!over || active.id === over.id) {
        setDragOverInfo(null);
        return;
      }
      const activeData = active.data.current;
      if (!activeData || activeData.type !== 'card') {
        setDragOverInfo(null);
        return;
      }
      const activeCardId = active.id as string;
      const overData = over.data.current;
      let toColumnId: string | null = null;
      let toIndex: number = 0;

      if (overData?.type === 'column') {
        toColumnId = over.id as string;
        const ids = columnCardIdsMap[toColumnId];
        toIndex = ids ? ids.length : 0;
      } else if (overData?.type === 'card') {
        const overCardId = over.id as string;
        const overColId = findColumnForCard(overCardId, columnCardIdsMap);
        if (!overColId) {
          setDragOverInfo(null);
          return;
        }
        toColumnId = overColId;
        const ids = columnCardIdsMap[overColId];
        const overCardIndex = ids.indexOf(overCardId);
        toIndex = overCardIndex === -1 ? ids.length : overCardIndex;
      } else {
        setDragOverInfo(null);
        return;
      }
      if (!toColumnId) {
        setDragOverInfo(null);
        return;
      }
      setDragOverInfo({ activeCardId, toColumnId, toIndex });
      return;
    }
    setDragOverInfo(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const initial = initialCardPos.current;
    initialCardPos.current = null;
    setActiveItem(null);
    setDragOverInfo(null);

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
      if (!initial) return;
      const store = useStore.getState();
      const storeColumns = store.columns;
      const storeBoards = store.boards;
      const storeBoard = storeBoards[currentBoardId];
      if (!storeBoard) return;
      const findCol = (cid: string): string | null => {
        for (const colId of storeBoard.columnIds) {
          const col = storeColumns[colId];
          if (col && col.cardIds.includes(cid)) return colId;
        }
        return null;
      };

      let finalToColumnId: string;
      let finalToIndex: number;
      const overData = over.data.current;

      if (overData?.type === 'column') {
        finalToColumnId = over.id as string;
        const toCol = storeColumns[finalToColumnId];
        if (!toCol) return;
        finalToIndex = toCol.cardIds.length;
      } else if (overData?.type === 'card') {
        const overCardId = over.id as string;
        const overColId = findCol(overCardId);
        if (!overColId) return;
        finalToColumnId = overColId;
        const toCol = storeColumns[finalToColumnId];
        const idx = toCol.cardIds.indexOf(overCardId);
        finalToIndex = idx === -1 ? toCol.cardIds.length : idx;
      } else {
        return;
      }

      const fromColNow = storeColumns[initial.columnId];
      if (!fromColNow) return;
      const currentFromIndex = fromColNow.cardIds.indexOf(initial.cardId);
      const fromIndexFinal =
        currentFromIndex === -1 ? initial.index : currentFromIndex;

      if (initial.columnId === finalToColumnId) {
        const ids = Array.from(fromColNow.cardIds);
        const idx = ids.indexOf(initial.cardId);
        if (idx === -1) return;
        if (idx === finalToIndex) return;
        const moved = arrayMove(ids, idx, finalToIndex);
        const realTo = moved.indexOf(initial.cardId);
        moveCard(initial.columnId, finalToColumnId, idx, realTo);
      } else {
        const targetCol = storeColumns[finalToColumnId];
        if (!targetCol) return;
        let target = finalToIndex;
        if (target < 0) target = 0;
        if (target > targetCol.cardIds.length) target = targetCol.cardIds.length;
        moveCard(initial.columnId, finalToColumnId, fromIndexFinal, target);
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
              const colDragOver =
                dragOverInfo && dragOverInfo.toColumnId === colId
                  ? {
                      activeCardId: dragOverInfo.activeCardId,
                      index: dragOverInfo.toIndex,
                    }
                  : null;
              return (
                <KanbanColumn
                  key={colId}
                  column={col}
                  dragOverInfo={colDragOver}
                />
              );
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

        <DragOverlay dropAnimation={null}>
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
