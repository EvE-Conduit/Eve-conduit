import { Scanner } from "@tailwindcss/oxide";

/** Every Tailwind class candidate used in the given directories. */
export function scanCandidates(...dirs: string[]): string[] {
  const scanner = new Scanner({ sources: dirs.map((base) => ({ base, pattern: "**/*", negated: false })) });
  return [...new Set(scanner.scan())].sort();
}
