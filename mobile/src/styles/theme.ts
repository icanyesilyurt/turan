export const colors = {
  teal: '#0d9488',
  tealLight: '#14b8a6',
  tealDark: '#0f766e',
  tealGlow: 'rgba(13, 148, 136, 0.15)',
  red: '#ef4444',
  white: '#ffffff',
}

export const dark = {
  bg: '#0f172a',
  bgSecondary: '#1e293b',
  bgCard: '#1e293b',
  bgInput: '#334155',
  bgHover: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#475569',
}

export const light = {
  bg: '#f8fafc',
  bgSecondary: '#ffffff',
  bgCard: '#ffffff',
  bgInput: '#f1f5f9',
  bgHover: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
}

export type ThemeColors = typeof dark

export function getTheme(mode: 'dark' | 'light'): ThemeColors {
  return mode === 'dark' ? dark : light
}
