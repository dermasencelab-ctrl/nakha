// ============================================
// Demo data merge helpers.
// All functions are no-ops when DEMO_MODE is false, so production
// behavior is untouched. Every demo record carries demo: true.
// ============================================
import { DEMO_MODE } from '../config/settings';
import { DEMO_COOKS, DEMO_DISHES } from '../data/demoData';

export const isDemoEnabled = () => DEMO_MODE === true;

export const isDemoId = (id) =>
  typeof id === 'string' && id.startsWith('demo-');

export const getDemoCooks = () => (isDemoEnabled() ? DEMO_COOKS : []);

export const getDemoDishes = () => (isDemoEnabled() ? DEMO_DISHES : []);

export const findDemoCook = (id) =>
  isDemoEnabled() ? DEMO_COOKS.find((c) => c.id === id) || null : null;

export const findDemoDishesByCook = (cookId) =>
  isDemoEnabled() ? DEMO_DISHES.filter((d) => d.cookId === cookId) : [];

// Merge real arrays with demo data; demo entries come first so they're
// visible at the top of carousels/lists during recording.
export const mergeCooks = (realCooks = []) =>
  isDemoEnabled() ? [...DEMO_COOKS, ...realCooks] : realCooks;

export const mergeDishes = (realDishes = []) =>
  isDemoEnabled() ? [...DEMO_DISHES, ...realDishes] : realDishes;
