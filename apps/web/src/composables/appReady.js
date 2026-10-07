let mounted = false;

export function markAppMounted() {
  mounted = true;
}

export function isAppMounted() {
  return mounted;
}
