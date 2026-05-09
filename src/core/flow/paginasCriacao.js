const HOME_CRIADOR = {
  id: "home",
  ordem: 0,
  titulo: "Home"
};

const PAGINAS_CRIACAO = [
  {
    id: "raca-atributos",
    ordem: 1,
    titulo: "Raca e Atributos"
  },
  {
    id: "classe",
    ordem: 2,
    titulo: "Classe"
  },
  {
    id: "origem",
    ordem: 3,
    titulo: "Origem"
  },
  {
    id: "origem-regional",
    ordem: 4,
    titulo: "Origem Regional e Poderes Extras"
  },
  {
    id: "divindade",
    ordem: 5,
    titulo: "Divindade"
  },
  {
    id: "equipamento",
    ordem: 6,
    titulo: "Equipamento Inicial"
  },
  {
    id: "magias",
    ordem: 7,
    titulo: "Magias"
  },
  {
    id: "revisao",
    ordem: 8,
    titulo: "Revisao e Exportacao"
  }
];

if (typeof module !== "undefined") {
  module.exports = {
    HOME_CRIADOR,
    PAGINAS_CRIACAO
  };
}
