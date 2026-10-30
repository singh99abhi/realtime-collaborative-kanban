import React from 'react';
import { 
  Clock, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon,
  AlertCircle
} from 'lucide-react';

export function CardItem({ 
  card, 
  onEdit, 
  onDelete, 
  onMoveQuick,
  onDragStart,
  onDragEnd,
  isDragging
}) {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'low':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onDragEnd={onDragEnd}
      className={`group relative bg-slate-800/90 hover:bg-slate-800 border rounded-xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-slate-600 ${
        isDragging 
          ? 'opacity-40 border-blue-500 scale-95 shadow-inner' 
          : 'border-slate-700/80'
      }`}
    >
      {/* Top Header: Priority Badge & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${getPriorityStyle(card.priority)}`}>
          {card.priority}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          <button
            onClick={() => onEdit(card)}
            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 transition"
            title="Edit card"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-100 leading-snug mb-1">
        {card.title}
      </h4>

      {/* Description */}
      {card.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {card.description}
        </p>
      )}

      {/* Footer: Assignee & Quick Move Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-750/60 text-xs">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 text-slate-300">
          {card.assignee_avatar ? (
            <img
              src={card.assignee_avatar}
              alt={card.assignee_name || 'Assignee'}
              title={`Assigned to ${card.assignee_name}`}
              className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-400" title="Unassigned">
              <UserIcon className="w-3 h-3" />
            </div>
          )}
          <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
            {card.assignee_name ? card.assignee_name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>

        {/* Quick status stepper buttons */}
        <div className="flex items-center gap-1">
          {card.status !== 'todo' && (
            <button
              onClick={() => onMoveQuick(card, card.status === 'done' ? 'in_progress' : 'todo')}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title={`Move to ${card.status === 'done' ? 'In Progress' : 'To Do'}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {card.status !== 'done' && (
            <button
              onClick={() => onMoveQuick(card, card.status === 'todo' ? 'in_progress' : 'done')}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title={`Move to ${card.status === 'todo' ? 'In Progress' : 'Done'}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
