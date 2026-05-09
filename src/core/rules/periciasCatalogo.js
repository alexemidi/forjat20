export const PERICIAS = [
  { id: "acrobacia", nome: "Acrobacia", atributo: "des" },
  { id: "adestramento", nome: "Adestramento", atributo: "car", requerTreinamento: true },
  { id: "atletismo", nome: "Atletismo", atributo: "for" },
  { id: "atuacao", nome: "Atuacao", atributo: "car", requerTreinamento: true },
  { id: "cavalgar", nome: "Cavalgar", atributo: "des" },
  { id: "conhecimento", nome: "Conhecimento", atributo: "int", requerTreinamento: true },
  { id: "cura", nome: "Cura", atributo: "sab", requerTreinamento: true },
  { id: "diplomacia", nome: "Diplomacia", atributo: "car" },
  { id: "enganacao", nome: "Enganacao", atributo: "car" },
  { id: "fortitude", nome: "Fortitude", atributo: "con" },
  { id: "furtividade", nome: "Furtividade", atributo: "des" },
  { id: "guerra", nome: "Guerra", atributo: "int", requerTreinamento: true },
  { id: "iniciativa", nome: "Iniciativa", atributo: "des" },
  { id: "intimidacao", nome: "Intimidacao", atributo: "car" },
  { id: "intuicao", nome: "Intuicao", atributo: "sab" },
  { id: "investigacao", nome: "Investigacao", atributo: "int" },
  { id: "jogatina", nome: "Jogatina", atributo: "car" },
  { id: "ladinagem", nome: "Ladinagem", atributo: "des", requerTreinamento: true },
  { id: "luta", nome: "Luta", atributo: "for" },
  { id: "misticismo", nome: "Misticismo", atributo: "int", requerTreinamento: true },
  { id: "nobreza", nome: "Nobreza", atributo: "int", requerTreinamento: true },
  { id: "oficio", nome: "Oficio", atributo: "int", requerTreinamento: true },
  { id: "percepcao", nome: "Percepcao", atributo: "sab" },
  { id: "pilotagem", nome: "Pilotagem", atributo: "des", requerTreinamento: true },
  { id: "pontaria", nome: "Pontaria", atributo: "des" },
  { id: "reflexos", nome: "Reflexos", atributo: "des" },
  { id: "religiao", nome: "Religiao", atributo: "sab", requerTreinamento: true },
  { id: "sobrevivencia", nome: "Sobrevivencia", atributo: "sab" },
  { id: "vontade", nome: "Vontade", atributo: "sab" }
];

export function nomePericia(periciaId) {
  return PERICIAS.find((pericia) => pericia.id === periciaId)?.nome ?? periciaId;
}
