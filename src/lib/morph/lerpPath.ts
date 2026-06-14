/**
 * Interpolate between two SVG path `d` strings that share an identical command
 * structure (same sequence of M/L/C/… commands, only the numbers differ).
 *
 * Because the system owns its icon pairs, we guarantee matched structure at
 * authoring time and interpolate with a plain number lerp — no morph library,
 * no reliance on patchy CSS `d` animation support.
 */

type Token =
  | { kind: "cmd"; cmd: string }
  | { kind: "num"; num: number };

// One regex, two alternatives: a single command letter, or a number
// (handles leading sign, bare decimals like `.5`, and scientific notation).
const TOKEN_RE = /([A-Za-z])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;

function tokenize(path: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(path)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ kind: "cmd", cmd: match[1] });
    } else {
      tokens.push({ kind: "num", num: parseFloat(match[2]) });
    }
  }
  return tokens;
}

function format(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  // Collapse -0 to 0 so output is stable.
  return String(rounded === 0 ? 0 : rounded);
}

export function lerpPath(a: string, b: string, t: number): string {
  const from = tokenize(a);
  const to = tokenize(b);

  if (from.length !== to.length) {
    throw new Error(
      `lerpPath: path structure mismatch (${from.length} vs ${to.length} tokens). ` +
        `Both states must share the same command structure.`,
    );
  }

  const out: string[] = new Array(from.length);
  for (let i = 0; i < from.length; i++) {
    const x = from[i];
    const y = to[i];

    if (x.kind === "cmd" && y.kind === "cmd") {
      if (x.cmd !== y.cmd) {
        throw new Error(
          `lerpPath: command mismatch at token ${i} ("${x.cmd}" vs "${y.cmd}").`,
        );
      }
      out[i] = x.cmd;
    } else if (x.kind === "num" && y.kind === "num") {
      out[i] = format(x.num + (y.num - x.num) * t);
    } else {
      throw new Error(`lerpPath: token kind mismatch at token ${i}.`);
    }
  }

  return out.join(" ");
}
