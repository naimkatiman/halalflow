/**
 * Registry of two-state morph icons. Each pair is authored on a 256×256 grid
 * (Phosphor's grid) with an IDENTICAL path command structure between state `a`
 * and state `b`, so `lerpPath` can interpolate them.
 *
 * Technique for asymmetric pairs (e.g. download → check): the visually simpler
 * state repeats/overlaps subpaths onto its real stroke so the structure matches
 * and the extra strokes stay invisible at rest, then slide into place mid-morph.
 */

export interface MorphPair {
  /** Resting state (active = false). */
  a: string;
  /** Toggled state (active = true). */
  b: string;
}

export const morphIcons = {
  // Download arrow (stem + arrowhead + tray) → checkmark.
  downloadCheck: {
    a: "M 128 52 L 128 150 M 90 116 L 128 154 L 166 116 M 72 196 L 184 196",
    b: "M 84 132 L 116 164 M 84 132 L 116 164 L 176 96 M 116 164 L 176 96",
  },
  // Plus → x (close): the cross rotates 45°.
  plusX: {
    a: "M 60 128 L 196 128 M 128 60 L 128 196",
    b: "M 76 76 L 180 180 M 180 76 L 76 180",
  },
  // Chevron down → chevron up.
  chevron: {
    a: "M 78 102 L 128 154 L 178 102",
    b: "M 78 154 L 128 102 L 178 154",
  },
} satisfies Record<string, MorphPair>;

export type MorphIconName = keyof typeof morphIcons;
