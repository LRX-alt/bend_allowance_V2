import { ref } from 'vue';

export const shellMode = ref('page');

export function useShell() {
  return shellMode;
}
