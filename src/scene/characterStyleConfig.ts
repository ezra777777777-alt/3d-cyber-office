export type CharacterSilhouette = 'assistant-pod' | 'lobster-command-pod';

export interface CharacterRoleStyle {
  silhouette: CharacterSilhouette;
  accent: string;
  visor: string;
  body: string;
  scale: number;
  statusLightOffset: readonly [number, number, number];
}

export const CHARACTER_STYLE = {
  roles: {
    'agent-lobster-commander': {
      silhouette: 'lobster-command-pod',
      accent: '#ff6b4a',
      visor: '#172235',
      body: '#ffb39f',
      scale: 1.22,
      statusLightOffset: [0, 1.42, 0.08],
    },
    'agent-coordinator': {
      silhouette: 'assistant-pod',
      accent: '#24c6dc',
      visor: '#18283a',
      body: '#d8eef5',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
    'agent-builder': {
      silhouette: 'assistant-pod',
      accent: '#8ad36d',
      visor: '#1d2b24',
      body: '#e1f1da',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
    'agent-reviewer': {
      silhouette: 'assistant-pod',
      accent: '#f2b84b',
      visor: '#302719',
      body: '#f4e4bd',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
  },
} as const;

export type CharacterRoleId = keyof typeof CHARACTER_STYLE.roles;

export function getRoleStyle(roleId: string): CharacterRoleStyle {
  return CHARACTER_STYLE.roles[(roleId as CharacterRoleId)] ?? CHARACTER_STYLE.roles['agent-coordinator'];
}

export function getCharacterSilhouette(roleId: string): CharacterSilhouette {
  return getRoleStyle(roleId).silhouette;
}

export function hasHumanoidLimbRatio(silhouette: CharacterSilhouette): boolean {
  return false;
}
