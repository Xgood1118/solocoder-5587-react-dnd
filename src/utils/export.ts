import type { AppState, Board, Card, Column, Priority } from '../types';

const formatDate = (timestamp: number | null): string => {
  if (timestamp === null) return '无';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const priorityLabel: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const escapeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled';
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportJson = (state: AppState, boardId: string): void => {
  const board: Board | undefined = state.boards[boardId];
  if (!board) return;

  const columns: Record<string, Column> = {};
  const cards: Record<string, Card> = {};

  board.columnIds.forEach((cid) => {
    const col = state.columns[cid];
    if (col) {
      columns[cid] = col;
      col.cardIds.forEach((kid) => {
        const card = state.cards[kid];
        if (card) {
          cards[kid] = card;
        }
      });
    }
  });

  const payload = {
    version: 1,
    exportedAt: Date.now(),
    data: {
      boards: { [boardId]: board },
      columns,
      cards,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, `${escapeFilename(board.title)}.json`);
};

export const exportMarkdown = (state: AppState, boardId: string): void => {
  const board = state.boards[boardId];
  if (!board) return;

  const lines: string[] = [];

  lines.push(`# ${board.title}`);
  lines.push('');

  board.columnIds.forEach((cid) => {
    const col = state.columns[cid];
    if (!col) return;

    lines.push(`## ${col.title}`);
    lines.push('');

    col.cardIds.forEach((kid) => {
      const card = state.cards[kid];
      if (!card) return;

      lines.push(`### ${card.title}`);
      lines.push('');

      lines.push(`- **优先级**: ${priorityLabel[card.priority]}`);
      lines.push(`- **负责人**: ${card.assignee ?? '无'}`);
      lines.push(`- **到期日期**: ${formatDate(card.dueDate)}`);

      if (card.tags.length > 0) {
        const tagNames = card.tags.map((t) => t.name).join(', ');
        lines.push(`- **标签**: ${tagNames}`);
      }

      lines.push('');

      if (card.description) {
        lines.push(card.description);
        lines.push('');
      }
    });
  });

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown' });
  triggerDownload(blob, `${escapeFilename(board.title)}.md`);
};
