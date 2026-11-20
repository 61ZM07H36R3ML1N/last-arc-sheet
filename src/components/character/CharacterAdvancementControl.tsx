import { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import CharacterAdvancementModal from './CharacterAdvancementModal';
import { ArrowUpCircle } from 'lucide-react';

/**
 * Place next to the character level display.
 * Requires CharacterAdvancementModal.onConfirm(characterId, expectedLevel, choices).
 */
export function CharacterAdvancementControl() {
  const [isOpen, setIsOpen] = useState(false);
  const sheet = useCharacterStore((state) => state.sheet);
  const saveAdvancement = useCharacterStore((state) => state.saveAdvancement);

  const characterLevel = sheet.classes.reduce(
    (total, characterClass) => total + characterClass.level,
    0,
  );

  return (
    <>
      <button
  type="button"
  onClick={() => setIsOpen(true)}
  disabled={characterLevel >= 20}
  title={
    characterLevel >= 20
      ? 'Maximum character level reached'
      : 'Advance Character'
  }
  aria-label="Advance Character"
  className="
    flex items-center justify-center gap-1 rounded-lg px-2 py-2
    bg-arc-bg
    hover:bg-arc-cardHover
    border border-arc-border
    text-emerald-400
    hover:border-emerald-400
    transition-all
    disabled:opacity-40
    disabled:cursor-not-allowed
  "
>
  <ArrowUpCircle size={17} />\n  <span className="text-xs sm:text-sm">Level Up</span>
</button>

      <CharacterAdvancementModal
        open={isOpen}
        sheet={sheet}
        onClose={() => setIsOpen(false)}
        onConfirm={(characterId, expectedLevel, choices) => {
          saveAdvancement(characterId, expectedLevel, choices);
        }}
      />
    </>
  );
}

export default CharacterAdvancementControl;
