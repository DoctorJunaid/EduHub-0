import { createAppStore } from './appStore.js';
export const store = createAppStore({ demoEnabled: import.meta.env.VITE_STUDENT_DEMO !== 'false' });
