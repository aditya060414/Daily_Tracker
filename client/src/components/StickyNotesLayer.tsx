import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, CornerDownLeft } from 'lucide-react';
import { useStickyStore, useAuthStore } from '../store';
import { StickyNote } from '../types';

// Helper to determine first emoji or capital letter from a note title
const getDisplayCharacter = (title: string, userInitial: string): string => {
  if (!title || title === 'Untitled Note') return userInitial;
  const trimmed = title.trim();
  // Regex to match unicode emoji at the start of string
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
  const match = trimmed.match(emojiRegex);
  if (match) return match[0];
  const firstChar = trimmed.charAt(0).toUpperCase();
  return firstChar === 'U' ? userInitial : firstChar;
};

// Seed-based stable rotation angles between -1.5deg and 1.5deg
const getRotationAngle = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const angle = (hash % 300) / 100 - 1.5; // -1.5 to 1.5 degrees
  return `${angle}deg`;
};

// Colors configuration for the color picker
const COLORS: Array<'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'gray' | 'dark'> = [
  'yellow',
  'pink',
  'green',
  'blue',
  'purple',
  'orange',
  'teal',
  'gray',
  'dark',
];

interface ContextMenuState {
  noteId: string;
  x: number;
  y: number;
}

export const StickyNotesLayer: React.FC = () => {
  const { notes, fetchNotes, addNote, updateNote, deleteNote, setPosition } = useStickyStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Global click to close context menu
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  return createPortal(
    <div className="fixed inset-0 pointer-events-none select-none z-[9999]">
      {/* RENDER ALL NOTES */}
      {notes.map((note) => (
        <StickyNoteItem
          key={note._id}
          note={note}
          updateNote={updateNote}
          deleteNote={deleteNote}
          setPosition={setPosition}
          onOpenContextMenu={(x, y) => setContextMenu({ noteId: note._id, x, y })}
        />
      ))}

      {/* GLOBAL ADD BUTTON FAB */}
      <button
        onClick={() => addNote()}
        className="fixed bottom-[88px] md:bottom-6 right-6 w-11 h-11 bg-accent hover:bg-accent/90 text-off-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all pointer-events-auto z-[9999] border border-accent/20 group glow-accent"
        title="Add Sticky Note"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
      </button>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onDelete={async (id) => {
            if (confirm('Are you sure you want to delete this sticky note?')) {
              await deleteNote(id);
            }
          }}
          onChangeColor={(id, color) => updateNote(id, { color })}
        />
      )}
    </div>,
    document.body
  );
};

// ==========================================
// CONTEXT MENU COMPONENT
// ==========================================
interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onDelete: (id: string) => void;
  onChangeColor: (id: string, color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'gray' | 'dark') => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onClose, onDelete, onChangeColor }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorSubmenu, setShowColorSubmenu] = useState(false);

  // Position adjustment so context menu doesn't go off-screen
  const [adjustedPos, setAdjustedPos] = useState({ x: menu.x, y: menu.y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = menu.x;
      let newY = menu.y;

      if (menu.x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 8;
      }
      if (menu.y + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 8;
      }
      setAdjustedPos({ x: newX, y: newY });
    }
  }, [menu.x, menu.y]);

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      className="absolute bg-panel border border-border rounded-lg shadow-xl py-1 text-xs font-mono min-w-[140px] text-off-white pointer-events-auto z-[10000] backdrop-blur-md animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          useStickyStore.getState().updateNote(menu.noteId, { isMinimized: false });
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-accent/15 hover:text-accent transition-colors flex items-center gap-2"
      >
        <span>Open Note</span>
      </button>

      <div className="relative">
        <button
          onMouseEnter={() => setShowColorSubmenu(true)}
          onClick={() => setShowColorSubmenu(!showColorSubmenu)}
          className="w-full text-left px-3 py-2 hover:bg-accent/15 hover:text-accent transition-colors flex items-center justify-between"
        >
          <span>Change Color</span>
          <span className="text-[10px] text-off-white-muted">&gt;</span>
        </button>

        {showColorSubmenu && (
          <div
            className="absolute left-[138px] top-0 bg-panel border border-border rounded-lg shadow-xl p-2 flex gap-1.5 z-[10001] backdrop-blur-md"
            onMouseLeave={() => setShowColorSubmenu(false)}
          >
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChangeColor(menu.noteId, color);
                  onClose();
                }}
                className={`w-4 h-4 rounded-full border border-black/10 hover:scale-110 transition-transform ${
                  color === 'yellow' ? 'bg-[#fef08a]' :
                  color === 'pink' ? 'bg-[#fecdd3]' :
                  color === 'green' ? 'bg-[#bbf7d0]' :
                  color === 'blue' ? 'bg-[#bae6fd]' :
                  color === 'purple' ? 'bg-[#e9d5ff]' :
                  color === 'orange' ? 'bg-[#fed7aa]' :
                  color === 'teal' ? 'bg-[#99f6e4]' :
                  color === 'gray' ? 'bg-[#e2e8f0]' : 'bg-[#1a1f2c]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border my-1" />

      <button
        onClick={() => {
          onDelete(menu.noteId);
          onClose();
        }}
        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
      >
        <Trash2 className="w-3 h-3" />
        <span>Delete Note</span>
      </button>
    </div>
  );
};

// ==========================================
// STICKY NOTE ITEM COMPONENT
// ==========================================
interface StickyNoteItemProps {
  note: StickyNote;
  updateNote: (id: string, fields: Partial<Omit<StickyNote, '_id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteNote: (id: string) => Promise<void>;
  setPosition: (id: string, x: number, y: number) => void;
  onOpenContextMenu: (x: number, y: number) => void;
}

const StickyNoteItem: React.FC<StickyNoteItemProps> = ({
  note,
  updateNote,
  deleteNote,
  setPosition,
  onOpenContextMenu,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const isDarkNote = note.color === 'dark';
  const user = useAuthStore((state) => state.user);
  const userInitial = (user?.name || user?.username || user?.email || '✦').charAt(0).toUpperCase();
  const [titleValue, setTitleValue] = useState(note.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const touchTimerRef = useRef<any>(null);

  // Check if this note was just created (is new) to apply entry bounce animation
  const isNew = useRef(note.title === 'Untitled Note' && note.content === '' && !note.isMinimized && note._id.startsWith('temp-'));

  // Positions on screen: X, Y as percentage
  const [dragPos, setDragPos] = useState({ x: note.position.x, y: note.position.y });

  // Sync state positions to dragPos on note prop updates (when not actively dragging)
  useEffect(() => {
    setDragPos({ x: note.position.x, y: note.position.y });
  }, [note.position.x, note.position.y]);

  // Handle click outside to minimize maximized notes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (note.isMinimized) return;
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        // Prevent minimize if clicking another note, or clicking context menu
        const clickedAnotherNote = (e.target as Element).closest('.sticky-note-card');
        const clickedMenu = (e.target as Element).closest('.bg-panel'); // context menu
        if (!clickedAnotherNote && !clickedMenu) {
          updateNote(note._id, { isMinimized: true });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [note.isMinimized, note._id, updateNote]);

  // Focus textarea when note is maximized
  useEffect(() => {
    if (!note.isMinimized && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [note.isMinimized]);

  // Calculate sliding layout: if maximized, adjust X & Y so the 320x380 card is fully visible
  const width = note.isMinimized ? 48 : 320;
  const height = note.isMinimized ? 48 : 380;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let displayX = dragPos.x;
  let displayY = dragPos.y;

  if (!note.isMinimized) {
    const cardWidthPct = (320 / vw) * 100;
    const cardHeightPct = (380 / vh) * 100;
    displayX = Math.min(dragPos.x, 100 - cardWidthPct);
    displayY = Math.min(dragPos.y, 100 - cardHeightPct);
    displayX = Math.max(0, displayX);
    displayY = Math.max(0, displayY);
  } else {
    // Minimized bounds clamp
    const circleWidthPct = (48 / vw) * 100;
    const circleHeightPct = (48 / vh) * 100;
    displayX = Math.min(dragPos.x, 100 - circleWidthPct);
    displayY = Math.min(dragPos.y, 100 - circleHeightPct);
    displayX = Math.max(0, displayX);
    displayY = Math.max(0, displayY);
  }

  // Pointer dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only allow left mouse click drag
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Avoid dragging when clicking buttons, picker dots, inputs
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.color-dot')
    ) {
      return;
    }

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...dragPos };
    let hasMoved = false;

    // Capture pointer events on target
    const element = cardRef.current;
    if (element) {
      element.setPointerCapture(e.pointerId);
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved = true;
      }

      if (hasMoved) {
        const deltaXPct = (dx / window.innerWidth) * 100;
        const deltaYPct = (dy / window.innerHeight) * 100;

        setDragPos({
          x: startPos.x + deltaXPct,
          y: startPos.y + deltaYPct,
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (element) {
        try {
          element.releasePointerCapture(upEvent.pointerId);
        } catch (err) {}
      }

      if (hasMoved) {
        // Save final dragged position back to Zustand store
        // Clamp values
        const finalWidth = note.isMinimized ? 48 : 320;
        const finalHeight = note.isMinimized ? 48 : 380;
        const widthPct = (finalWidth / window.innerWidth) * 100;
        const heightPct = (finalHeight / window.innerHeight) * 100;

        const clampedX = Math.max(0, Math.min(dragPos.x, 100 - widthPct));
        const clampedY = Math.max(0, Math.min(dragPos.y, 100 - heightPct));

        setPosition(note._id, clampedX, clampedY);
      } else {
        // Simple click -> toggle maximize
        if (note.isMinimized) {
          updateNote(note._id, { isMinimized: false });
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Mobile Long Press for Context Menu
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!note.isMinimized) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    touchTimerRef.current = setTimeout(() => {
      onOpenContextMenu(clientX, clientY);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  // Right click handler for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!note.isMinimized) return;
    e.preventDefault();
    onOpenContextMenu(e.clientX, e.clientY);
  };

  // Compute word count
  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;

  // Staggered bob delay based on note ID
  const seed = note._id ? note._id.charCodeAt(note._id.length - 1) : 0;
  const bobDelay = `${(seed % 5) * 0.4}s`;

  // Color classes map
  const colorClass = `sticky-${note.color}`;

  // Custom transform values
  const rotation = getRotationAngle(note._id);
  const cardTransform = note.isMinimized
    ? 'scale(1)'
    : `scale(1) rotate(${rotation})`;

  return (
    <div
      ref={cardRef}
      style={{
        left: `${displayX}%`,
        top: `${displayY}%`,
        width: `${width}px`,
        height: `${height}px`,
        transform: cardTransform,
        animationDelay: note.isMinimized ? bobDelay : '0s',
        '--rotate-angle': rotation,
      } as React.CSSProperties}
      className={`fixed select-none pointer-events-auto rounded-2xl border shadow-lg overflow-hidden flex flex-col sticky-note-card cursor-grab active:cursor-grabbing transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${colorClass} ${
        note.isMinimized
          ? 'rounded-full select-none justify-center items-center font-mono font-bold text-lg border-2 glow-accent shadow-md hover:scale-110 active:scale-95 animate-sticky-bob'
          : 'paper-texture hover:shadow-xl'
      } ${isNew.current ? 'animate-sticky-bounce' : ''}`}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      {/* MINIMIZED CIRCLE VIEW */}
      {note.isMinimized ? (
        <span className="text-xl pointer-events-none select-none select-none">
          {getDisplayCharacter(note.title, userInitial)}
        </span>
      ) : (
        /* MAXIMIZED CARD VIEW */
        <div className="flex flex-col h-full w-full pointer-events-auto select-text animate-fade-in">
          {/* Header Bar */}
          <div className={`flex items-center justify-between px-3 py-2 border-b select-none ${isDarkNote ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-black/[0.03]'}`}>
            {/* Inline Title Edit */}
            <div className="flex-grow min-w-0 pr-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    updateNote(note._id, { title: titleValue || 'Untitled Note' });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                      updateNote(note._id, { title: titleValue || 'Untitled Note' });
                    }
                  }}
                  className={`w-full text-xs px-1 py-0.5 rounded outline-none font-bold ${isDarkNote ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}
                  autoFocus
                />
              ) : (
                <h4
                  onClick={() => setIsEditingTitle(true)}
                  className={`text-xs font-bold font-mono truncate px-1 py-0.5 rounded cursor-text ${isDarkNote ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                  title="Click to edit title"
                >
                  {note.title}
                </h4>
              )}
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Color dots picker */}
              <div className="flex items-center gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateNote(note._id, { color: c })}
                    className={`w-2.5 h-2.5 rounded-full border border-black/25 color-dot hover:scale-125 transition-transform ${
                      c === 'yellow' ? 'bg-[#eab308]' :
                      c === 'pink' ? 'bg-[#f43f5e]' :
                      c === 'green' ? 'bg-[#22c55e]' :
                      c === 'blue' ? 'bg-[#0ea5e9]' :
                      c === 'purple' ? 'bg-[#a855f7]' :
                      c === 'orange' ? 'bg-[#f97316]' :
                      c === 'teal' ? 'bg-[#0d9488]' :
                      c === 'gray' ? 'bg-[#64748b]' : 'bg-[#1a1f2c]'
                    } ${note.color === c ? (isDarkNote ? 'ring-1 ring-white/80 scale-110' : 'ring-1 ring-black/60 scale-110') : ''}`}
                    title={`Color: ${c}`}
                  />
                ))}
              </div>

              {/* Minimize button */}
              <button
                onClick={() => updateNote(note._id, { isMinimized: true })}
                className={`p-1 rounded transition-colors ${isDarkNote ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/10 text-black/60 hover:text-black'}`}
                title="Minimize Note"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>

              {/* Delete button */}
              <button
                onClick={async () => {
                  if (confirm('Delete this sticky note?')) {
                    await deleteNote(note._id);
                  }
                }}
                className={`p-1 rounded transition-colors ${isDarkNote ? 'hover:bg-red-500/30 text-white/60 hover:text-red-300' : 'hover:bg-red-500/20 hover:text-red-700 text-black/60'}`}
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content editable area */}
          <div className="flex-1 p-4 relative flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => updateNote(note._id, { content: e.target.value })}
              placeholder="Write a note..."
              className="flex-grow w-full bg-transparent resize-none outline-none font-handwriting text-lg focus:outline-none placeholder-black/30 pr-1 pb-4 leading-relaxed overflow-y-auto"
            />
            {/* Word Count */}
            <div className="absolute bottom-2 right-4 text-[10px] font-mono opacity-55 select-none pointer-events-none">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
