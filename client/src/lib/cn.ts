type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class joiner. The app composes variants from fixed maps rather than
 * merging arbitrary conflicting utilities, so tailwind-merge is not needed.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(' ');
}
