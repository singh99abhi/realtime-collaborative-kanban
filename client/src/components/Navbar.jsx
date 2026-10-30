import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Trello, 
  Plus, 
  Lock, 
  Globe, 
  LogOut, 
  Radio, 
  FileText,
  ChevronDown
} from 'lucide-react';

export function Navbar({ 
  boards = [], 
  activeBoard, 
  onSelectBoard, 
  onOpenNewBoardModal 
}) {
  const { user, logout } = useAuth();
  const { connectionStatus, viewers } = useSocket();

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm" title="Real-time WebSocket connection active">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Sync
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/80 text-rose-400 border border-rose-800/60">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Offline
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Board Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-blue-500 font-bold text-xl tracking-tight select-none">
            <div className="p-1.5 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-400">
              <Trello className="w-6 h-6" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              SyncBoard
            </span>
          </div>

          {/* Board Selector */}
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <select
                value={activeBoard?.id || ''}
                onChange={(e) => {
                  const b = boards.find(x => x.id === Number(e.target.value));
                  if (b) onSelectBoard(b);
                }}
                className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-100 text-sm font-semibold pl-3 pr-8 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-800 text-slate-100">
                    {b.title} {b.is_private ? '(Private)' : '(Shared)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={onOpenNewBoardModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shadow-sm"
              title="Create new board"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center/Right: Live Viewers & Status & Swagger link */}
        <div className="flex items-center gap-3">
          {/* Active Viewers Avatars */}
          {viewers.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/80">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse ml-1 mr-0.5" />
              <div className="flex -space-x-1.5 overflow-hidden">
                {viewers.map((v, i) => (
                  <img
                    key={v.userId || i}
                    src={v.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.name}`}
                    alt={v.name}
                    title={`${v.name} is currently viewing this board`}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-700 object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-slate-300 font-medium pl-1 pr-1.5">
                {viewers.length} active
              </span>
            </div>
          )}

          {/* Connection Status Pill */}
          {getStatusBadge()}

          {/* API Docs Swagger Link */}
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-lg transition"
            title="Open Swagger/OpenAPI interactive documentation"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>API Docs</span>
          </a>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-slate-200 leading-tight">{user?.name}</div>
              <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
