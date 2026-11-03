import { BookMarked } from 'lucide-react';
import { useCharacterStore } from '../../store/useCharacterStore';

export default function NotesTab() {
  const { sheet, updateNotes } = useCharacterStore();

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3 bg-arc-card rounded-lg border border-arc-border flex justify-between items-center">
        <div>
          <span className="font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
            <BookMarked size={14} className="text-arc-accent" /> Player Journal & Session Notes
          </span>
          <span className="text-[10px] text-slate-400">
            Track quests, NPC names, lore, and inventory details beyond core stats
          </span>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={sheet.notes || ''}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder="Write session notes, quest objectives, clues, or reminders here..."
          rows={14}
          className="w-full bg-arc-card border border-arc-border rounded-lg p-3 text-slate-200 focus:outline-none focus:border-arc-accent font-sans text-xs leading-relaxed resize-y shadow-inner"
        />
        <div className="text-[10px] text-slate-500 text-right pr-2 mt-1">
          Auto-saves directly to local storage
        </div>
      </div>
    </div>
  );
}