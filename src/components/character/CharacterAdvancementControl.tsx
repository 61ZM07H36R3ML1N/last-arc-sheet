import { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import CharacterAdvancementModal from './CharacterAdvancementModal';

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
        disabled={characterLevel >= 20}
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {characterLevel >= 20 ? 'Maximum Level' : 'Advance Character'}
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
