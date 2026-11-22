export const USER_UPDATED_EVENT = "pizzahub:user-updated";

export function notifyUserUpdated() {
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}
