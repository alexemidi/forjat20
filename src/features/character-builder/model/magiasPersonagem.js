export const ATRIBUTO_MAGIA_LABELS = {
  for: "Força",
  des: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  sab: "Sabedoria",
  car: "Carisma"
};

export function calcularInfoMagiaPersonagem(draft, classe, attrs = {}) {
  const atributoId = getAtributoChaveMagia(draft, classe);
  if (!atributoId) return null;

  const nivel = Number(draft.info?.nivel ?? 1);
  const valorAtributo = Number(attrs[atributoId] ?? 0);
  return {
    atributoId,
    atributoNome: ATRIBUTO_MAGIA_LABELS[atributoId] ?? atributoId.toUpperCase(),
    valorAtributo,
    cd: 10 + Math.floor(nivel / 2) + valorAtributo,
    formula: `10 + ${Math.floor(nivel / 2)} (1/2 nível) + ${atributoId.toUpperCase()} ${formatSigned(valorAtributo)}`
  };
}

export function getAtributoChaveMagia(draft, classe) {
  if (!classe) return "";
  if (classe.id === "arcanista") {
    const caminhoId = draft.escolhas?.classe?.arcanista?.caminhoId;
    if (caminhoId === "feiticeiro") return "car";
    if (caminhoId === "bruxo" || caminhoId === "mago") return "int";
    return "";
  }

  const effect = (classe.habilidades ?? [])
    .flatMap((habilidade) => habilidade.efeitos ?? [])
    .find((efeito) => efeito.tipo === "definir_atributo_chave_magia" && efeito.atributo && efeito.atributo !== "caminho_arcanista");
  return effect?.atributo ?? "";
}

function formatSigned(value) {
  return value >= 0 ? `+${value}` : String(value);
}
