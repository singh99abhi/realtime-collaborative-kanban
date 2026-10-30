import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { BoardView } from './components/BoardView';
import { AuthPage } from './components/AuthPage';
import { NewBoardModal } from './components/NewBoardModal';
import { api } from './api';
import { Loader2, Plus, Layout } from 'lucide-react';

function KanbanApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [newBoardModalOpen, setNewBoardModalOpen] = useState(false);

  const fetchBoards = useCallback(async () => {
    if (!isAuthenticated) return;
    setBoardsLoading(true);
    try {
      const res = await api.getBoards();
      const loadedBoards = res.boards || [];
      setBoards(loadedBoards);

      if (loadedBoards.length > 0) {
        // Retain current board if still valid, otherwise pick first
        setActiveBoard(prev => {
          if (prev && loadedBoards.some(b => b.id === prev.id)) {
            return loadedBoards.find(b => b.id === prev.id);
          }
          return loadedBoards[0];
        });
      } else {
        setActiveBoard(null);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setBoardsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async (boardData) => {
    try {
      const res = await api.createBoard(boardData);
      setBoards(prev => [res.board, ...prev]);
      setActiveBoard(res.board);
    } catch (err) {
      alert(err.message || 'Failed to create board');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={setActiveBoard}
          onOpenNewBoardModal={() => setNewBoardModalOpen(true)}
        />

        <main className="flex-1 flex flex-col">
          {boardsLoading && boards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : activeBoard ? (
            <BoardView 
              key={activeBoard.id} 
              board={activeBoard} 
              onBoardUpdated={fetchBoards} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-slate-400">
                <Layout className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-200">No Boards Available</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Get started by creating your first collaborative Kanban board.
                </p>
              </div>
              <button
                onClick={() => setNewBoardModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
              >
                <Plus className="w-4 h-4" />
                Create New Board
              </button>
            </div>
          )}
        </main>

        <NewBoardModal
          isOpen={newBoardModalOpen}
          onClose={() => setNewBoardModalOpen(false)}
          onCreate={handleCreateBoard}
        />
      </div>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KanbanApp />
    </AuthProvider>
  );
}
