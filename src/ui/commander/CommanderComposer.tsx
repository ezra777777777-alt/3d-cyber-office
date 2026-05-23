import { useCommanderStore } from '@/store/commanderStore';

export function CommanderComposer() {
  const draft = useCommanderStore((state) => state.draft);
  const setDraft = useCommanderStore((state) => state.setDraft);
  const createMissionFromDraft = useCommanderStore((state) => state.createMissionFromDraft);

  return (
    <section className="commander-section">
      <header className="commander-section-title">
        <span>Lobster Commander</span>
        <span className="commander-pill">Demo intake</span>
      </header>
      <label className="commander-field">
        <span>Goal</span>
        <textarea
          value={draft.goal}
          onChange={(event) => setDraft({ goal: event.target.value })}
          rows={3}
          aria-label="Commander goal"
        />
      </label>
      <label className="commander-field">
        <span>Material note</span>
        <textarea
          value={draft.materialNote}
          onChange={(event) => setDraft({ materialNote: event.target.value })}
          rows={2}
          aria-label="Commander material note"
        />
      </label>
      <label className="commander-field">
        <span>Constraints</span>
        <textarea
          value={draft.constraintsText}
          onChange={(event) => setDraft({ constraintsText: event.target.value })}
          rows={3}
          aria-label="Commander constraints"
        />
      </label>
      <button type="button" className="commander-primary" onClick={createMissionFromDraft}>
        Plan mission
      </button>
    </section>
  );
}
