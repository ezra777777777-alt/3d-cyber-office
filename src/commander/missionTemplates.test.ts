import { describe, expect, it } from 'vitest';
import { getMissionTemplateById, missionTemplates } from './missionTemplates';

describe('mission templates', () => {
  it('provides three first-run mission templates', () => {
    expect(missionTemplates.map((template) => template.id)).toEqual([
      'project-health-check',
      'release-summary',
      'feature-plan',
    ]);
  });

  it('fills all Commander draft fields for each template', () => {
    for (const template of missionTemplates) {
      expect(template.title.length).toBeGreaterThan(2);
      expect(template.goal.length).toBeGreaterThan(20);
      expect(template.materialNote.length).toBeGreaterThan(10);
      expect(template.constraintsText.split('\n').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('can look up a template by id', () => {
    expect(getMissionTemplateById('feature-plan')?.title).toBe('小功能实现预案');
    expect(getMissionTemplateById('missing-template')).toBeNull();
  });
});
