import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { FiltersBar } from './components/FiltersBar';
import { ActivityPanel } from './components/ActivityPanel';
import { CardDetail } from './components/CardDetail';

export default function App() {
  const viewMode = useStore((s) => s.viewMode);
  const selectedCardId = useStore((s) => s.selectedCardId);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo);
  const canRedo = useStore((s) => s.canRedo);
  const [showFilters, setShowFilters] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <Header
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
      />
      <FiltersBar visible={showFilters} onClose={() => setShowFilters(false)} />

      <main className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? <KanbanBoard /> : <CalendarView />}
      </main>

      <AnimatePresence>
        {selectedCardId && <CardDetail key={selectedCardId} />}
      </AnimatePresence>

      <ActivityPanel />
    </div>
  );
}
