const ADMIN_SESSION_KEY = 'bosslab_admin_authed'

export const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? '1234567890'

export function isAdminAuthed() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
}

export function setAdminAuthed(value: boolean) {
  if (value) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
  }
}
