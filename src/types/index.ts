export type Priority = 'high' | 'medium' | 'low';

export type CardColor =
  | 'none'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

export type ViewMode = 'kanban' | 'calendar';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  createdAt: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  assignee: string | null;
  priority: Priority;
  tags: Tag[];
  color: CardColor;
  dueDate: number | null;
  columnId: string;
  createdAt: number;
  updatedAt: number;
  comments: Comment[];
  attachments: Attachment[];
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
  wipLimit: number | null;
  createdAt: number;
}

export interface Board {
  id: string;
  title: string;
  columnIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ActivityAction =
  | 'card.create'
  | 'card.delete'
  | 'card.move'
  | 'card.update'
  | 'card.comment'
  | 'column.create'
  | 'column.update'
  | 'column.delete'
  | 'column.move'
  | 'board.update';

export interface Activity {
  id: string;
  boardId: string;
  cardId: string | null;
  columnId: string | null;
  action: ActivityAction;
  details: string;
  user: string;
  createdAt: number;
}

export interface Filters {
  assignees: string[];
  priorities: Priority[];
  tags: string[];
  dueDateFrom: number | null;
  dueDateTo: number | null;
  dueDateFromOpen: boolean;
  dueDateToOpen: boolean;
}

export interface AppState {
  boards: Record<string, Board>;
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  activities: Activity[];
  currentBoardId: string;
  viewMode: ViewMode;
  filters: Filters;
  selectedCardId: string | null;
  activityFilterCardId: string | null;
  showActivityPanel: boolean;
  currentUser: string;
}
