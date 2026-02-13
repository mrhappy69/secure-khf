export const AUTH_COOKIE = "auth";

export function setAuthCookie() {
  // 7 days cookie
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE}=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function isAuthed(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${AUTH_COOKIE}=1`));
}
