export const STRONG_PASSWORD_RULE =
  "Use at least 8 characters with uppercase, lowercase, a number, and a special character.";

const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(password: string) {
  return STRONG_PASSWORD_PATTERN.test(password);
}
