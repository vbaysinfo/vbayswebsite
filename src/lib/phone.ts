// Indian mobile numbers (optionally prefixed with +91 / 0); also accepts
// international numbers of 10–15 digits written with a leading "+".
export function normalizePhone(v: string): string | null {
  const digits = v.replace(/[^0-9+]/g, "");
  const plain = digits.replace(/^\+/, "");
  if (/^(91)?[6-9]\d{9}$/.test(plain)) return `+91${plain.slice(-10)}`;
  if (/^0[6-9]\d{9}$/.test(plain)) return `+91${plain.slice(-10)}`;
  if (digits.startsWith("+") && /^\d{10,15}$/.test(plain)) return `+${plain}`;
  return null;
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
