// Dimensions are in logical points; native material blur is managed by iOS.
export { neverType, neverSpacing, neverRadius } from './typography';
export const neverControl = { minimum: 44, input: 54, primary: 52, row: 76, tabBar: 64 } as const;
export const neverIcon = { small: 16, medium: 20, large: 24, preview: 46 } as const;
export const neverMaterial = { blur: 24, border: 1, shadowOpacity: 0.09, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } } as const;
export const neverMotion = { quick: 140, standard: 220, pressScale: 0.975, spring: { damping: 22, stiffness: 320, mass: 0.7 } } as const;
