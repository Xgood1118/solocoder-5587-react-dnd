import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Activity,
  ActivityAction,
  AppState,
  Attachment,
  Board,
  Card,
  CardColor,
  Column,
  Comment,
  Filters,
  Priority,
  Tag,
  ViewMode,
} from '../types';
import { createAgileTemplate, createBlankTemplate, createGtdTemplate } from '../data/templates';
import { DEFAULT_USER, STORAGE_KEY, uid } from '../utils';

const MAX_HISTORY = 50;

export type TemplateName = 'blank' | 'agile' | 'gtd';

interface PersistState extends AppState {
  _past: AppState[];
  _future: AppState[];
}

interface Store extends PersistState {
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  setCurrentBoard: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCard: (id: string | null) => void;
  setShowActivityPanel: (show: boolean) => void;
  setActivityFilterCard: (cardId: string | null) => void;
  setCurrentUser: (user: string) => void;

  createBoard: (template?: TemplateName, title?: string) => string;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, title: string) => void;

  createColumn: (boardId: string, title: string, index?: number) => string;
  renameColumn: (columnId: string, title: string) => void;
  setColumnWipLimit: (columnId: string, limit: number | null) => void;
  deleteColumn: (columnId: string) => void;
  moveColumn: (boardId: string, fromIndex: number, toIndex: number) => void;

  createCard: (columnId: string, title: string, index?: number) => string;
  updateCard: (cardId: string, patch: Partial<Omit<Card, 'id' | 'createdAt'>>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (
    fromColumnId: string,
    toColumnId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  addCardComment: (cardId: string, content: string) => void;
  addCardAttachment: (cardId: string, file: File) => Promise<void>;
  removeCardAttachment: (cardId: string, attachmentId: string) => void;

  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  clearActivityFilter: () => void;

  _recordActivity: (params: {
    action: ActivityAction;
    boardId: string;
    cardId?: string | null;
    columnId?: string | null;
    details: string;
  }) => void;
}

const createInitialState = (): AppState => {
  const now = Date.now();
  const agile = createAgileTemplate(now);

  const boards: Record<string, Board> = { [agile.board.id]: agile.board };
  const columns: Record<string, Column> = {};
  const cards: Record<string, Card> = {};

  agile.columns.forEach((c) => {
    columns[c.id] = c;
  });
  agile.cards.forEach((c) => {
    cards[c.id] = c;
  });

  return {
    boards,
    columns,
    cards,
    activities: [],
    currentBoardId: agile.board.id,
    viewMode: 'kanban',
    filters: {
      assignees: [],
      priorities: [],
      tags: [],
      dueDateFrom: null,
      dueDateTo: null,
      dueDateFromOpen: false,
      dueDateToOpen: false,
    },
    selectedCardId: null,
    activityFilterCardId: null,
    showActivityPanel: false,
    currentUser: DEFAULT_USER,
  };
};

const pickHistoryState = (s: PersistState): AppState => ({
  boards: JSON.parse(JSON.stringify(s.boards)),
  columns: JSON.parse(JSON.stringify(s.columns)),
  cards: JSON.parse(JSON.stringify(s.cards)),
  activities: JSON.parse(JSON.stringify(s.activities)),
  currentBoardId: s.currentBoardId,
  viewMode: s.viewMode,
  filters: JSON.parse(JSON.stringify(s.filters)),
  selectedCardId: s.selectedCardId,
  activityFilterCardId: s.activityFilterCardId,
  showActivityPanel: s.showActivityPanel,
  currentUser: s.currentUser,
});

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      _past: [],
      _future: [],
      canUndo: false,
      canRedo: false,

      _pushHistory: () => {
        const s = get();
        const snapshot = pickHistoryState(s);
        set({
          _past: [...s._past.slice(-MAX_HISTORY + 1), snapshot],
          _future: [],
          canUndo: true,
          canRedo: false,
        });
      },

      undo: () => {
        const s = get();
        if (s._past.length === 0) return;
        const prev = s._past[s._past.length - 1];
        const current = pickHistoryState(s);
        set({
          ...prev,
          _past: s._past.slice(0, -1),
          _future: [...s._future, current],
          canUndo: s._past.length - 1 > 0,
          canRedo: true,
        });
      },

      redo: () => {
        const s = get();
        if (s._future.length === 0) return;
        const next = s._future[s._future.length - 1];
        const current = pickHistoryState(s);
        set({
          ...next,
          _past: [...s._past, current],
          _future: s._future.slice(0, -1),
          canUndo: true,
          canRedo: s._future.length - 1 > 0,
        });
      },

      setCurrentBoard: (id) => {
        get()._pushHistory();
        set({ currentBoardId: id });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedCard: (id) => set({ selectedCardId: id }),

      setShowActivityPanel: (show) => set({ showActivityPanel: show }),

      setActivityFilterCard: (cardId) => set({ activityFilterCardId: cardId }),

      setCurrentUser: (user) => set({ currentUser: user }),

      _recordActivity: ({ action, boardId, cardId, columnId, details }) => {
        const s = get();
        const a: Activity = {
          id: uid(),
          boardId,
          cardId: cardId ?? null,
          columnId: columnId ?? null,
          action,
          details,
          user: s.currentUser,
          createdAt: Date.now(),
        };
        set({ activities: [a, ...s.activities].slice(0, 1000) });
      },

      createBoard: (template = 'agile', title) => {
        get()._pushHistory();
        const now = Date.now();
        let result;
        switch (template) {
          case 'blank':
            result = createBlankTemplate(now);
            break;
          case 'gtd':
            result = createGtdTemplate(now);
            break;
          case 'agile':
          default:
            result = createAgileTemplate(now);
            break;
        }
        if (title) result.board.title = title;
        const s = get();
        const columns = { ...s.columns };
        const cards = { ...s.cards };
        result.columns.forEach((c) => (columns[c.id] = c));
        result.cards.forEach((c) => (cards[c.id] = c));
        const boardId = result.board.id;
        const boards = { ...s.boards, [boardId]: result.board };
        set({ boards, columns, cards, currentBoardId: boardId });
        get()._recordActivity({
          action: 'board.update',
          boardId,
          details: `创建看板 "${result.board.title}"`,
        });
        return boardId;
      },

      deleteBoard: (id) => {
        const s = get();
        if (Object.keys(s.boards).length <= 1) return;
        get()._pushHistory();
        const board = s.boards[id];
        if (!board) return;
        const boards = { ...s.boards };
        delete boards[id];
        const columns = { ...s.columns };
        const cards = { ...s.cards };
        board.columnIds.forEach((cid) => {
          const col = columns[cid];
          if (col) {
            col.cardIds.forEach((kid) => delete cards[kid]);
            delete columns[cid];
          }
        });
        const remainingIds = Object.keys(boards);
        set({
          boards,
          columns,
          cards,
          currentBoardId: remainingIds[0] ?? s.currentBoardId,
          selectedCardId: null,
          activities: s.activities.filter((a) => a.boardId !== id),
        });
      },

      renameBoard: (id, title) => {
        const s = get();
        if (!s.boards[id]) return;
        get()._pushHistory();
        const board = { ...s.boards[id], title, updatedAt: Date.now() };
        set({ boards: { ...s.boards, [id]: board } });
        get()._recordActivity({
          action: 'board.update',
          boardId: id,
          details: `重命名看板为 "${title}"`,
        });
      },

      createColumn: (boardId, title, index) => {
        const s = get();
        const board = s.boards[boardId];
        if (!board) return '';
        get()._pushHistory();
        const columnId = uid();
        const now = Date.now();
        const column: Column = {
          id: columnId,
          title,
          cardIds: [],
          wipLimit: null,
          createdAt: now,
        };
        const columnIds = [...board.columnIds];
        if (index === undefined) {
          columnIds.push(columnId);
        } else {
          columnIds.splice(Math.max(0, Math.min(index, columnIds.length)), 0, columnId);
        }
        set({
          columns: { ...s.columns, [columnId]: column },
          boards: {
            ...s.boards,
            [boardId]: { ...board, columnIds, updatedAt: now },
          },
        });
        get()._recordActivity({
          action: 'column.create',
          boardId,
          columnId,
          details: `创建列 "${title}"`,
        });
        return columnId;
      },

      renameColumn: (columnId, title) => {
        const s = get();
        if (!s.columns[columnId]) return;
        get()._pushHistory();
        const oldTitle = s.columns[columnId].title;
        const column = { ...s.columns[columnId], title };
        const board = Object.values(s.boards).find((b) => b.columnIds.includes(columnId));
        set({ columns: { ...s.columns, [columnId]: column } });
        if (board) {
          get()._recordActivity({
            action: 'column.update',
            boardId: board.id,
            columnId,
            details: `将列从 "${oldTitle}" 重命名为 "${title}"`,
          });
        }
      },

      setColumnWipLimit: (columnId, limit) => {
        const s = get();
        if (!s.columns[columnId]) return;
        get()._pushHistory();
        set({ columns: { ...s.columns, [columnId]: { ...s.columns[columnId], wipLimit: limit } } });
      },

      deleteColumn: (columnId) => {
        const s = get();
        const column = s.columns[columnId];
        if (!column) return;
        get()._pushHistory();
        const board = Object.values(s.boards).find((b) => b.columnIds.includes(columnId));
        if (!board) return;
        const columns = { ...s.columns };
        const cards = { ...s.cards };
        column.cardIds.forEach((cid) => delete cards[cid]);
        delete columns[columnId];
        set({
          columns,
          cards,
          boards: {
            ...s.boards,
            [board.id]: {
              ...board,
              columnIds: board.columnIds.filter((id) => id !== columnId),
              updatedAt: Date.now(),
            },
          },
        });
        get()._recordActivity({
          action: 'column.delete',
          boardId: board.id,
          columnId,
          details: `删除列 "${column.title}"`,
        });
      },

      moveColumn: (boardId, fromIndex, toIndex) => {
        const s = get();
        const board = s.boards[boardId];
        if (!board) return;
        get()._pushHistory();
        const columnIds = [...board.columnIds];
        const [removed] = columnIds.splice(fromIndex, 1);
        columnIds.splice(toIndex, 0, removed);
        set({
          boards: {
            ...s.boards,
            [boardId]: { ...board, columnIds, updatedAt: Date.now() },
          },
        });
        const col = s.columns[removed];
        if (col) {
          get()._recordActivity({
            action: 'column.move',
            boardId,
            columnId: removed,
            details: `将列 "${col.title}" 从位置 ${fromIndex + 1} 移动到 ${toIndex + 1}`,
          });
        }
      },

      createCard: (columnId, title, index) => {
        const s = get();
        const column = s.columns[columnId];
        if (!column) return '';
        get()._pushHistory();
        const cardId = uid();
        const now = Date.now();
        const card: Card = {
          id: cardId,
          title,
          description: '',
          assignee: null,
          priority: 'medium',
          tags: [],
          color: 'none',
          dueDate: null,
          columnId,
          createdAt: now,
          updatedAt: now,
          comments: [],
          attachments: [],
        };
        const cardIds = [...column.cardIds];
        if (index === undefined) {
          cardIds.push(cardId);
        } else {
          cardIds.splice(Math.max(0, Math.min(index, cardIds.length)), 0, cardId);
        }
        const board = Object.values(s.boards).find((b) => b.columnIds.includes(columnId));
        set({
          cards: { ...s.cards, [cardId]: card },
          columns: { ...s.columns, [columnId]: { ...column, cardIds } },
        });
        if (board) {
          get()._recordActivity({
            action: 'card.create',
            boardId: board.id,
            columnId,
            cardId,
            details: `在 "${column.title}" 创建卡片 "${title}"`,
          });
        }
        return cardId;
      },

      updateCard: (cardId, patch) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        get()._pushHistory();
        const updated = { ...card, ...patch, updatedAt: Date.now() };
        set({ cards: { ...s.cards, [cardId]: updated } });
        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(updated.columnId)
        );
        if (board) {
          const changes: string[] = [];
          if (patch.title !== undefined && patch.title !== card.title)
            changes.push(`标题 "${card.title}" → "${patch.title}"`);
          if (patch.assignee !== undefined && patch.assignee !== card.assignee)
            changes.push(`负责人 "${card.assignee ?? '无'}" → "${patch.assignee ?? '无'}"`);
          if (patch.priority !== undefined && patch.priority !== card.priority)
            changes.push(`优先级 ${card.priority} → ${patch.priority}`);
          if (patch.dueDate !== undefined && patch.dueDate !== card.dueDate)
            changes.push('修改到期日期');
          if (patch.tags !== undefined) changes.push('修改标签');
          if (patch.color !== undefined && patch.color !== card.color)
            changes.push(`颜色 ${card.color} → ${patch.color}`);
          if (patch.description !== undefined && patch.description !== card.description)
            changes.push('修改描述');
          if (changes.length > 0) {
            get()._recordActivity({
              action: 'card.update',
              boardId: board.id,
              columnId: updated.columnId,
              cardId,
              details: `更新 "${card.title}": ${changes.join('; ')}`,
            });
          }
        }
      },

      deleteCard: (cardId) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        get()._pushHistory();
        const column = s.columns[card.columnId];
        if (!column) return;
        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(card.columnId)
        );
        const cards = { ...s.cards };
        delete cards[cardId];
        set({
          cards,
          columns: {
            ...s.columns,
            [card.columnId]: {
              ...column,
              cardIds: column.cardIds.filter((id) => id !== cardId),
            },
          },
          selectedCardId: s.selectedCardId === cardId ? null : s.selectedCardId,
          activityFilterCardId: s.activityFilterCardId === cardId ? null : s.activityFilterCardId,
        });
        if (board) {
          get()._recordActivity({
            action: 'card.delete',
            boardId: board.id,
            columnId: card.columnId,
            cardId,
            details: `删除卡片 "${card.title}"`,
          });
        }
      },

      moveCard: (fromColumnId, toColumnId, fromIndex, toIndex) => {
        const s = get();
        const fromCol = s.columns[fromColumnId];
        const toCol = s.columns[toColumnId];
        if (!fromCol || !toCol) return;
        const cardId = fromCol.cardIds[fromIndex];
        const card = s.cards[cardId];
        if (!card) return;
        get()._pushHistory();

        const newFromIds = [...fromCol.cardIds];
        newFromIds.splice(fromIndex, 1);
        const newToIds =
          fromColumnId === toColumnId ? [...newFromIds] : [...toCol.cardIds];
        newToIds.splice(toIndex, 0, cardId);

        const newCards = {
          ...s.cards,
          [cardId]: {
            ...card,
            columnId: toColumnId,
            updatedAt: Date.now(),
          },
        };

        const newColumns = { ...s.columns };
        newColumns[fromColumnId] = { ...fromCol, cardIds: newFromIds };
        if (fromColumnId !== toColumnId) {
          newColumns[toColumnId] = { ...toCol, cardIds: newToIds };
        }

        set({ cards: newCards, columns: newColumns });

        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(toColumnId)
        );
        if (board) {
          if (fromColumnId === toColumnId) {
            get()._recordActivity({
              action: 'card.move',
              boardId: board.id,
              columnId: toColumnId,
              cardId,
              details: `在 "${toCol.title}" 内移动 "${card.title}" 到位置 ${toIndex + 1}`,
            });
          } else {
            get()._recordActivity({
              action: 'card.move',
              boardId: board.id,
              columnId: toColumnId,
              cardId,
              details: `将 "${card.title}" 从 "${fromCol.title}" 移到 "${toCol.title}" 位置 ${toIndex + 1}`,
            });
          }
        }
      },

      addCardComment: (cardId, content) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        get()._pushHistory();
        const comment: Comment = {
          id: uid(),
          content,
          author: s.currentUser,
          createdAt: Date.now(),
        };
        const updated: Card = {
          ...card,
          comments: [...card.comments, comment],
          updatedAt: Date.now(),
        };
        set({ cards: { ...s.cards, [cardId]: updated } });
        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(card.columnId)
        );
        if (board) {
          get()._recordActivity({
            action: 'card.comment',
            boardId: board.id,
            columnId: card.columnId,
            cardId,
            details: `在 "${card.title}" 评论: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          });
        }
      },

      addCardAttachment: async (cardId, file) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        get()._pushHistory();
        const att: Attachment = {
          id: uid(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          createdAt: Date.now(),
        };
        const updated: Card = {
          ...card,
          attachments: [...card.attachments, att],
          updatedAt: Date.now(),
        };
        set({ cards: { ...s.cards, [cardId]: updated } });
        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(card.columnId)
        );
        if (board) {
          get()._recordActivity({
            action: 'card.update',
            boardId: board.id,
            columnId: card.columnId,
            cardId,
            details: `在 "${card.title}" 添加附件 "${file.name}"`,
          });
        }
      },

      removeCardAttachment: (cardId, attachmentId) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        get()._pushHistory();
        const att = card.attachments.find((a) => a.id === attachmentId);
        const updated: Card = {
          ...card,
          attachments: card.attachments.filter((a) => a.id !== attachmentId),
          updatedAt: Date.now(),
        };
        set({ cards: { ...s.cards, [cardId]: updated } });
        const board = Object.values(s.boards).find((b) =>
          b.columnIds.includes(card.columnId)
        );
        if (board && att) {
          get()._recordActivity({
            action: 'card.update',
            boardId: board.id,
            columnId: card.columnId,
            cardId,
            details: `从 "${card.title}" 删除附件 "${att.name}"`,
          });
        }
      },

      setFilters: (patch) => {
        const s = get();
        set({ filters: { ...s.filters, ...patch } });
      },

      resetFilters: () =>
        set({
          filters: {
            assignees: [],
            priorities: [],
            tags: [],
            dueDateFrom: null,
            dueDateTo: null,
            dueDateFromOpen: false,
            dueDateToOpen: false,
          },
        }),

      clearActivityFilter: () => set({ activityFilterCardId: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        boards: s.boards,
        columns: s.columns,
        cards: s.cards,
        activities: s.activities,
        currentBoardId: s.currentBoardId,
        viewMode: s.viewMode,
        filters: s.filters,
        currentUser: s.currentUser,
        _past: s._past,
        _future: s._future,
        canUndo: s.canUndo,
        canRedo: s.canRedo,
      }),
    }
  )
);

export const useFilteredCardIds = (columnId: string): string[] => {
  const { filters, columns, cards } = useStore();
  const col = columns[columnId];
  if (!col) return [];
  return col.cardIds.filter((cid) => {
    const c = cards[cid];
    if (!c) return false;
    if (filters.assignees.length > 0) {
      const match = c.assignee ? filters.assignees.includes(c.assignee) : false;
      if (!match && !(c.assignee === null && filters.assignees.includes('__unassigned__')))
        return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(c.priority))
      return false;
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
};
