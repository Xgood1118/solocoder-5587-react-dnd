import type { Board, Card, Column, Tag } from '../types';
import { uid } from '../utils';

const defaultColors = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
];

export const makeTag = (name: string): Tag => ({
  id: uid(),
  name,
  color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
});

interface TemplateBoard {
  board: Board;
  columns: Column[];
  cards: Card[];
}

export const createBlankTemplate = (now: number): TemplateBoard => {
  const boardId = uid();
  const todoId = uid();
  const doingId = uid();
  const doneId = uid();
  const archiveId = uid();

  const board: Board = {
    id: boardId,
    title: '我的看板',
    columnIds: [todoId, doingId, doneId, archiveId],
    createdAt: now,
    updatedAt: now,
  };

  const columns: Column[] = [
    {
      id: todoId,
      title: '待办',
      cardIds: [],
      wipLimit: null,
      createdAt: now,
    },
    {
      id: doingId,
      title: '进行中',
      cardIds: [],
      wipLimit: 5,
      createdAt: now,
    },
    {
      id: doneId,
      title: '已完成',
      cardIds: [],
      wipLimit: null,
      createdAt: now,
    },
    {
      id: archiveId,
      title: '归档',
      cardIds: [],
      wipLimit: null,
      createdAt: now,
    },
  ];

  return { board, columns, cards: [] };
};

export const createAgileTemplate = (now: number): TemplateBoard => {
  const boardId = uid();
  const backlogId = uid();
  const todoId = uid();
  const doingId = uid();
  const doneId = uid();
  const archiveId = uid();
  const retroId = uid();

  const board: Board = {
    id: boardId,
    title: '敏捷开发看板',
    columnIds: [backlogId, todoId, doingId, doneId, archiveId, retroId],
    createdAt: now,
    updatedAt: now,
  };

  const tagFrontend = makeTag('前端');
  const tagBackend = makeTag('后端');
  const tagDesign = makeTag('设计');
  const tagBug = makeTag('Bug');

  const columns: Column[] = [
    { id: backlogId, title: '待规划', cardIds: [], wipLimit: null, createdAt: now },
    { id: todoId, title: '待办', cardIds: [], wipLimit: 8, createdAt: now },
    { id: doingId, title: '进行中', cardIds: [], wipLimit: 4, createdAt: now },
    { id: doneId, title: '已完成', cardIds: [], wipLimit: null, createdAt: now },
    { id: archiveId, title: '归档', cardIds: [], wipLimit: null, createdAt: now },
    { id: retroId, title: '回顾', cardIds: [], wipLimit: null, createdAt: now },
  ];

  const cards: Card[] = [
    {
      id: uid(),
      title: '搭建项目初始化',
      description: '初始化 Vite + React + TypeScript 项目',
      assignee: '张三',
      priority: 'high',
      tags: [tagFrontend],
      color: 'blue',
      dueDate: now + 86400000,
      columnId: doneId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
    {
      id: uid(),
      title: '设计登录页 UI',
      description: '- 登录表单\n- 忘记密码\n- 社交登录',
      assignee: '李四',
      priority: 'medium',
      tags: [tagDesign],
      color: 'purple',
      dueDate: now + 2 * 86400000,
      columnId: doingId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
    {
      id: uid(),
      title: '用户登录 API',
      description: '## 接口清单\n\n1. 登录\n2. 登出\n3. 刷新 token',
      assignee: '王五',
      priority: 'high',
      tags: [tagBackend],
      color: 'orange',
      dueDate: now + 3 * 86400000,
      columnId: todoId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
    {
      id: uid(),
      title: '修复首页白屏 Bug',
      description: '在 iOS Safari 下首次加载会白屏',
      assignee: '张三',
      priority: 'high',
      tags: [tagFrontend, tagBug],
      color: 'red',
      dueDate: now + 86400000,
      columnId: doingId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
  ];

  columns.find((c) => c.id === doingId)!.cardIds = [cards[1].id, cards[3].id];
  columns.find((c) => c.id === doneId)!.cardIds = [cards[0].id];
  columns.find((c) => c.id === todoId)!.cardIds = [cards[2].id];

  return { board, columns, cards };
};

export const createGtdTemplate = (now: number): TemplateBoard => {
  const boardId = uid();
  const inboxId = uid();
  const nextId = uid();
  const waitingId = uid();
  const projectId = uid();
  const doneId = uid();

  const board: Board = {
    id: boardId,
    title: 'GTD 收件箱',
    columnIds: [inboxId, nextId, waitingId, projectId, doneId],
    createdAt: now,
    updatedAt: now,
  };

  const tagWork = makeTag('工作');
  const tagLife = makeTag('生活');
  const tagLearn = makeTag('学习');

  const columns: Column[] = [
    { id: inboxId, title: '📥 收件箱', cardIds: [], wipLimit: null, createdAt: now },
    { id: nextId, title: '✅ 下一步', cardIds: [], wipLimit: 10, createdAt: now },
    { id: waitingId, title: '⏳ 等待中', cardIds: [], wipLimit: null, createdAt: now },
    { id: projectId, title: '📋 项目', cardIds: [], wipLimit: null, createdAt: now },
    { id: doneId, title: '🎉 完成', cardIds: [], wipLimit: null, createdAt: now },
  ];

  const cards: Card[] = [
    {
      id: uid(),
      title: '买牛奶',
      description: '',
      assignee: null,
      priority: 'low',
      tags: [tagLife],
      color: 'green',
      dueDate: now + 86400000,
      columnId: inboxId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
    {
      id: uid(),
      title: '写周报',
      description: '每周五下班前提交',
      assignee: '我',
      priority: 'medium',
      tags: [tagWork],
      color: 'yellow',
      dueDate: now + 4 * 86400000,
      columnId: nextId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
    {
      id: uid(),
      title: '读完《设计模式》',
      description: '第 5-8 章',
      assignee: '我',
      priority: 'low',
      tags: [tagLearn],
      color: 'blue',
      dueDate: null,
      columnId: projectId,
      createdAt: now,
      updatedAt: now,
      comments: [],
      attachments: [],
    },
  ];

  columns.find((c) => c.id === inboxId)!.cardIds = [cards[0].id];
  columns.find((c) => c.id === nextId)!.cardIds = [cards[1].id];
  columns.find((c) => c.id === projectId)!.cardIds = [cards[2].id];

  return { board, columns, cards };
};
