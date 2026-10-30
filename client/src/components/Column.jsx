import React, { useState } from 'react';
import { CardItem } from './CardItem';
import { Plus, ListTodo, PlayCircle, CheckCircle2, X } from 'lucide-react';

export function Column({
  status,
  title,
  cards = [],
  onEditCard,
  onDeleteCard,
  onMoveQuick,
  onDropCard,
  onQuickAddCard,
  draggedCard,
  setDraggedCard
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const getColumnIcon = () => {
    switch (status) {
      case 'todo':
        return <ListTodo className="w-4 h-4 text-sky-400" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-amber-400" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return null;
    }
  };

  const getColumnColorClass = () => {
    switch (status) {
      case 'todo':
        return 'border-t-sky-500';
      case 'in_progress':
        return 'border-t-amber-500';
      case 'done':
        return 'border-t-emerald-500';
      default:
        return 'border-t-slate-600';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedCard) {
      onDropCard(draggedCard, status);
      setDraggedCard(null);
    }
  };

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddCard(status, quickTitle.trim());
    setQuickTitle('');
    setIsQuickAdding(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 border-t-4 ${getColumnColorClass()} p-4 transition-all duration-200 min-h-[580px] shadow-sm ${
        isDragOver ? 'ring-2 ring-blue-500/80 bg-slate-850/90 scale-[1.01]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {getColumnIcon()}
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
            {title}
          </h3>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
            {cards.length}
          </span>
        </div>

        <button
          onClick={() => setIsQuickAdding(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={`Add card to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isDragging={draggedCard?.id === card.id}
            onDragStart={(e, c) => {
              setDraggedCard(c);
              e.dataTransfer.setData('text/plain', c.id);
            }}
            onDragEnd={() => setDraggedCard(null)}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onMoveQuick={onMoveQuick}
          />
        ))}

        {/* Empty State */}
        {cards.length === 0 && !isQuickAdding && (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-medium">No tasks in this column</p>
            <button
              onClick={() => setIsQuickAdding(true)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              + Create task
            </button>
          </div>
        )}

        {/* Quick Add Form */}
        {isQuickAdding && (
          <form onSubmit={handleQuickAddSubmit} className="bg-slate-800 rounded-xl p-3 border border-blue-500/50 shadow-md">
            <textarea
              autoFocus
              rows={2}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAddSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60">
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsQuickAdding(false);
                  setQuickTitle('');
                }}
                className="p-1 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Drop Zone Placeholder when dragging over */}
      {isDragOver && (
        <div className="mt-3 py-3 border-2 border-dashed border-blue-400/60 bg-blue-500/10 rounded-xl text-center text-xs text-blue-300 font-medium animate-pulse">
          Drop here to move into {title}
        </div>
      )}
    </div>
  );
}
