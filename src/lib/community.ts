export const RAMADAN_TYPES = [
  "iftar", "moreh", "terawih", "tadarus", "qiyamullail", "bubur_lambuk",
] as const;

export const RAMADAN_TYPE_LABELS: Record<string, string> = {
  iftar: "Iftar / Berbuka",
  moreh: "Moreh",
  terawih: "Solat Terawih",
  tadarus: "Tadarus",
  qiyamullail: "Qiyamullail",
  bubur_lambuk: "Bubur Lambuk",
};

export const PANTRY_TYPE_LABELS: Record<string, string> = {
  open: "Terbuka kepada semua",
  asnaf: "Untuk asnaf berdaftar",
};
