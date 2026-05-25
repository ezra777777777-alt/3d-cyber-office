import type { CommanderExperienceState } from '@/commander/commanderExperience';

export function CommanderNarrativeStrip({ state }: { state: CommanderExperienceState }) {
  return (
    <section className={`commander-narrative commander-narrative-${state.stage}`}>
      <strong>{state.headline}</strong>
      <span>{state.nextAction}</span>
    </section>
  );
}
