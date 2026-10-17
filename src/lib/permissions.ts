/**
 * Permission helpers for optional Chrome permissions.
 *
 * Permissions are requested lazily, only when a feature requires them.
 */

export type OptionalPermission = 'tabs' | 'bookmarks' | 'history';

export async function hasPermission(
  permission: OptionalPermission
): Promise<boolean> {
  if (
    typeof chrome === 'undefined' ||
    !chrome.permissions ||
    typeof chrome.permissions.contains !== 'function'
  ) {
    return false;
  }
  try {
    return (await chrome.permissions.contains({ permissions: [permission] })) ===
      true;
  } catch {
    return false;
  }
}

export async function requestPermission(
  permission: OptionalPermission
): Promise<boolean> {
  const granted = await hasPermission(permission);
  if (granted) return true;
  try {
    return (
      await chrome.permissions.request({ permissions: [permission] })
    ) === true;
  } catch {
    return false;
  }
}
