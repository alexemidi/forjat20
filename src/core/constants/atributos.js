const ATRIBUTOS = ["for", "des", "con", "int", "sab", "car"];

const CUSTO_ATRIBUTO = {
  "-1": -1,
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 4,
  "4": 7
};

const ROLAGEM_PARA_ATRIBUTO = [
  { max: 7, atributo: -2 },
  { min: 8, max: 9, atributo: -1 },
  { min: 10, max: 11, atributo: 0 },
  { min: 12, max: 13, atributo: 1 },
  { min: 14, max: 15, atributo: 2 },
  { min: 16, max: 17, atributo: 3 },
  { min: 18, atributo: 4 }
];

if (typeof module !== "undefined") {
  module.exports = {
    ATRIBUTOS,
    CUSTO_ATRIBUTO,
    ROLAGEM_PARA_ATRIBUTO
  };
}
