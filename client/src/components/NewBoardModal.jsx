import React, { useState } from 'react';
import { X, Lock, Globe, Plus } from 'lucide-react';

export function NewBoardModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      is_private: isPrivate
    });

    setTitle('');
    setDescription('');
    setIsPrivate(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-slate-100">
            Create New Board
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Board Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Marketing Campaign"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of board purpose..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Privacy Setting
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(1)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  isPrivate === 1
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Private Board
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Only you and invited members can access
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(0)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                  isPrivate === 0
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  Shared Board
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  All authenticated teammates can view & collaborate
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
