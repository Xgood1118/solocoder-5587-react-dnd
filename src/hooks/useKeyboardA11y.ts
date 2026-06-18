import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';

interface UseKeyboardA11yReturn {
  isFocused: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const useKeyboardA11y = (
  cardId: string,
  columnId: string
): UseKeyboardA11yReturn => {
  const [isFocused, setIsFocused] = useState(false);
  const setSelectedCard = useStore((s) => s.setSelectedCard);
  const deleteCard = useStore((s) => s.deleteCard);
  const columns = useStore((s) => s.columns);
  const boards = useStore((s) => s.boards);
  const currentBoardId = useStore((s) => s.currentBoardId);

  useEffect(() => {
    const handleFocusChange = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.getAttribute('data-card-id') === cardId) {
        setIsFocused(true);
      } else {
        setIsFocused(false);
      }
    };

    document.addEventListener('focusin', handleFocusChange);
    handleFocusChange();

    return () => {
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [cardId]);

  const findCurrentIndex = (elements: NodeListOf<HTMLElement>): number => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].getAttribute('data-card-id') === cardId) {
        return i;
      }
    }
    return -1;
  };

  const navigateCard = useCallback(
    (direction: 'prev' | 'next') => {
      const selector = `[data-column-id="${columnId}"][data-card-id]`;
      const elements = document.querySelectorAll<HTMLElement>(selector);
      if (elements.length === 0) return;

      const currentIdx = findCurrentIndex(elements);
      if (currentIdx === -1) return;

      const targetIdx =
        direction === 'prev' ? currentIdx - 1 : currentIdx + 1;

      if (targetIdx >= 0 && targetIdx < elements.length) {
        elements[targetIdx].focus();
      }
    },
    [columnId, cardId]
  );

  const navigateColumn = useCallback(
    (direction: 'left' | 'right') => {
      const board = boards[currentBoardId];
      if (!board) return;

      const currentColIdx = board.columnIds.indexOf(columnId);
      if (currentColIdx === -1) return;

      const targetColIdx =
        direction === 'left' ? currentColIdx - 1 : currentColIdx + 1;

      if (targetColIdx < 0 || targetColIdx >= board.columnIds.length) return;

      const targetColId = board.columnIds[targetColIdx];
      const targetCol = columns[targetColId];
      if (!targetCol) return;

      const selector = `[data-column-id="${targetColId}"][data-card-id]`;
      const elements = document.querySelectorAll<HTMLElement>(selector);

      if (elements.length > 0) {
        elements[0].focus();
      } else {
        const colSelector = `[data-column-focusable="${targetColId}"]`;
        const colElement = document.querySelector<HTMLElement>(colSelector);
        if (colElement) {
          colElement.focus();
        }
      }
    },
    [boards, currentBoardId, columnId, columns]
  );

  const handleDelete = useCallback(() => {
    const card = useStore.getState().cards[cardId];
    const cardTitle = card ? card.title : '该卡片';
    if (window.confirm(`确定要删除卡片"${cardTitle}"吗？`)) {
      deleteCard(cardId);
    }
  }, [cardId, deleteCard]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateCard('prev');
          break;

        case 'ArrowDown':
          e.preventDefault();
          navigateCard('next');
          break;

        case 'ArrowLeft':
          e.preventDefault();
          navigateColumn('left');
          break;

        case 'ArrowRight':
          e.preventDefault();
          navigateColumn('right');
          break;

        case 'Enter':
          e.preventDefault();
          setSelectedCard(cardId);
          break;

        case ' ':
          e.preventDefault();
          setSelectedCard(cardId);
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDelete();
          break;
      }
    },
    [navigateCard, navigateColumn, setSelectedCard, cardId, handleDelete]
  );

  return { isFocused, onKeyDown };
};

export default useKeyboardA11y;
