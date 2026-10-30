import React, { useState, useEffect, useCallback } from 'react';
import { Column } from './Column';
import { CardModal } from './CardModal';
import { api } from '../api';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Lock, 
  Globe, 
  Users, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function BoardView({ board, onBoardUpdated }) {
  const { socket, joinBoard, leaveBoard } = useSocket();
  const [boardDetails, setBoardDetails] = useState(null);
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Drag state
  const [draggedCard, setDraggedCard] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [modalInitialStatus, setModalInitialStatus] = useState('todo');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Board Details and Cards
  const loadBoard = useCallback(async () => {
    if (!board?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBoard(board.id);
      setBoardDetails(data.board);
      setCards(data.cards || []);
    } catch (err) {
      setError(err.message || 'Failed to load board details.');
    } finally {
      setLoading(false);
    }
  }, [board?.id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Load registered users for assignee selector
  useEffect(() => {
    api.getUsers()
      .then(res => setUsers(res.users || []))
      .catch(console.error);
  }, []);

  // Real-Time WebSocket Synchronization
  useEffect(() => {
    if (!board?.id) return;

    joinBoard(board.id);

    if (!socket) return;

    // Listen to real-time events broadcast from other sessions
    const handleCardCreated = ({ boardId, card }) => {
      if (Number(boardId) === Number(board.id)) {
        setCards(prev => {
          if (prev.some(c => c.id === card.id)) return prev;
          return [...prev, card];
        });
        showToast(`New task added: "${card.title}"`, 'info');
      }
    };

    const handleCardUpdated = ({ boardId, card }) => {
      if (Number(boardId) === Number(board.id)) {
        setCards(prev => prev.map(c => c.id === card.id ? card : c));
      }
    };

    const handleCardMoved = ({ boardId, cardId, targetStatus, newPosition, card }) => {
      if (Number(boardId) === Number(board.id)) {
        setCards(prev => {
          // If we have the full populated card from server
          if (card) {
            const others = prev.filter(c => c.id !== cardId);
            return [...others, card];
          }
          // Fallback manual status update
          return prev.map(c => c.id === cardId ? { ...c, status: targetStatus, position: newPosition } : c);
        });
      }
    };

    const handleCardDeleted = ({ boardId, cardId }) => {
      if (Number(boardId) === Number(board.id)) {
        setCards(prev => prev.filter(c => c.id !== cardId));
        showToast('A task was removed', 'info');
      }
    };

    socket.on('card:created', handleCardCreated);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:moved', handleCardMoved);
    socket.on('card:deleted', handleCardDeleted);

    return () => {
      leaveBoard(board.id);
      socket.off('card:created', handleCardCreated);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:moved', handleCardMoved);
      socket.off('card:deleted', handleCardDeleted);
    };
  }, [board?.id, socket, joinBoard, leaveBoard]);

  // Card Operations
  const handleSaveCard = async (cardData) => {
    try {
      if (editingCard) {
        const res = await api.updateCard(board.id, editingCard.id, cardData);
        setCards(prev => prev.map(c => c.id === editingCard.id ? res.card : c));
        showToast('Task updated successfully', 'success');
      } else {
        const res = await api.createCard(board.id, cardData);
        setCards(prev => [...prev, res.card]);
        showToast('Task created successfully', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteCard(board.id, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      showToast('Task deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMoveCard = async (card, targetStatus, targetPosition = 0) => {
    // Optimistic UI update
    setCards(prev => prev.map(c => {
      if (c.id === card.id) {
        return { ...c, status: targetStatus, position: targetPosition };
      }
      return c;
    }));

    try {
      const res = await api.moveCard(board.id, card.id, {
        status: targetStatus,
        position: targetPosition
      });
      if (res.card) {
        setCards(prev => prev.map(c => c.id === card.id ? res.card : c));
      }
    } catch (err) {
      showToast(err.message, 'error');
      loadBoard(); // Rollback on failure
    }
  };

  const handleDropCard = (card, targetStatus) => {
    if (card.status === targetStatus) return;
    const targetCards = cards.filter(c => c.status === targetStatus);
    const newPos = targetCards.length;
    handleMoveCard(card, targetStatus, newPos);
  };

  const handleQuickAddCard = async (status, title) => {
    try {
      const res = await api.createCard(board.id, {
        title,
        status,
        priority: 'medium'
      });
      setCards(prev => [...prev, res.card]);
      showToast('Task added', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter cards
  const filteredCards = cards.filter(card => {
    const matchesQuery = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
    return matchesQuery && matchesPriority;
  });

  const todoCards = filteredCards.filter(c => c.status === 'todo');
  const inProgressCards = filteredCards.filter(c => c.status === 'in_progress');
  const doneCards = filteredCards.filter(c => c.status === 'done');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading board & tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-rose-300">Access Restricted</h3>
        <p className="text-xs text-rose-300/80 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp ${
          toast.type === 'error' 
            ? 'bg-rose-950/90 text-rose-300 border-rose-800' 
            : 'bg-slate-900/95 text-slate-100 border-slate-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-blue-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Board Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {boardDetails?.title}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              boardDetails?.is_private
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
            }`}>
              {boardDetails?.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {boardDetails?.is_private ? 'Private Board' : 'Shared Workspace'}
            </span>
          </div>
          {boardDetails?.description && (
            <p className="text-xs text-slate-400 mt-1">
              {boardDetails.description}
            </p>
          )}
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Create Task Button */}
          <button
            onClick={() => {
              setEditingCard(null);
              setModalInitialStatus('todo');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* 3 Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Column
          status="todo"
          title="To Do"
          cards={todoCards}
          draggedCard={draggedCard}
          setDraggedCard={setDraggedCard}
          onDropCard={handleDropCard}
          onEditCard={(c) => {
            setEditingCard(c);
            setModalOpen(true);
          }}
          onDeleteCard={handleDeleteCard}
          onMoveQuick={handleMoveCard}
          onQuickAddCard={handleQuickAddCard}
        />

        <Column
          status="in_progress"
          title="In Progress"
          cards={inProgressCards}
          draggedCard={draggedCard}
          setDraggedCard={setDraggedCard}
          onDropCard={handleDropCard}
          onEditCard={(c) => {
            setEditingCard(c);
            setModalOpen(true);
          }}
          onDeleteCard={handleDeleteCard}
          onMoveQuick={handleMoveCard}
          onQuickAddCard={handleQuickAddCard}
        />

        <Column
          status="done"
          title="Done"
          cards={doneCards}
          draggedCard={draggedCard}
          setDraggedCard={setDraggedCard}
          onDropCard={handleDropCard}
          onEditCard={(c) => {
            setEditingCard(c);
            setModalOpen(true);
          }}
          onDeleteCard={handleDeleteCard}
          onMoveQuick={handleMoveCard}
          onQuickAddCard={handleQuickAddCard}
        />
      </div>

      {/* Card Creation / Editing Modal */}
      <CardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCard}
        card={editingCard}
        initialStatus={modalInitialStatus}
        users={users}
      />
    </div>
  );
}
