const personagemModelo = {
  schemaVersion: "0.1.0",

  info: {
    nome: "",
    jogador: "",
    sexo: "",
    nivel: 1,
    patamarId: "iniciante", // iniciante | veterano | campeao | lenda
    racaId: "",
    classeId: "",
    origemId: "",
    origemRegionalId: "",
    deusId: ""
  },

  atributosBase: {
    for: 0,
    des: 0,
    con: 0,
    int: 0,
    sab: 0,
    car: 0
  },

  atributosFinais: {
    for: 0,
    des: 0,
    con: 0,
    int: 0,
    sab: 0,
    car: 0
  },

  corpo: {
    tamanhoId: "medio",
    deslocamentoBase: 9,
    alcanceNatural: 1.5,
    bonusManobraManual: 0,
    bonusDeslocamentoManual: 0,
    montaria: {
      montado: false, // true se esta montado ou e considerado montado
      natural: false,
      montariaId: null,
      tamanhoId: null,
      montagemId: null, // compat legado; prefira montariaId
      nivelMontaria: "iniciante", // iniciante | veterano | mestre
      treinadoEmCavalgar: false, // se true, não precisa fazer teste de Cavalgar
      bonusEspecial: "", // compat legado; prefira observacoes
      possuiGinete: false,
      observacoes: ""
    }
  },

  escolhas: {
    raca: {
      opcoes: {},
      flexiveis: {},
      duende: {},
      golem: {}
    },
    poderOrigemId: "",
    equipamentoInicialIds: [],
    escolasMagiaIds: [],
    magiasIds: []
  },

  recursos: {
    pvTotais: 0,
    pmTotais: 0,
    pvAtual: 0,
    pmAtual: 0
  },

  proficiencias: [],

  pericias: {
    acrobacia: { treinada: false, bonus: 0,  nivel: 0 },
    adestramento: { treinada: false, bonus: 0,  nivel: 0 },
    atletismo: { treinada: false, bonus: 0,  nivel: 0 },
    atuacao: { treinada: false, bonus: 0,  nivel: 0 },
    cavalgar: { treinada: false, bonus: 0,  nivel: 0 },
    conhecimento: { treinada: false, bonus: 0,  nivel: 0 },
    cura: { treinada: false, bonus: 0,  nivel: 0 },
    diplomacia: { treinada: false, bonus: 0,  nivel: 0 },
    enganacao: { treinada: false, bonus: 0,  nivel: 0 },
    fortitude: { treinada: false, bonus: 0,  nivel: 0 },
    furtividade: { treinada: false, bonus: 0,  nivel: 0 },
    guerra: { treinada: false, bonus: 0,  nivel: 0 },
    iniciativa: { treinada: false, bonus: 0,  nivel: 0 },
    intimidacao: { treinada: false, bonus: 0,  nivel: 0 },
    intuicao: { treinada: false, bonus: 0,  nivel: 0 },
    investigacao: { treinada: false, bonus: 0,  nivel: 0 },
    jogatina: { treinada: false, bonus: 0,  nivel: 0 },
    ladinagem: { treinada: false, bonus: 0,  nivel: 0 },
    luta: { treinada: false, bonus: 0,  nivel: 0 },
    misticismo: { treinada: false, bonus: 0,  nivel: 0 },
    nobreza: { treinada: false, bonus: 0,  nivel: 0 },
    oficio: { treinada: false, bonus: 0,  nivel: 0 },
    percepcao: { treinada: false, bonus: 0,  nivel: 0 },
    pilotagem: { treinada: false, bonus: 0,  nivel: 0 },
    pontaria: { treinada: false, bonus: 0,  nivel: 0 },
    reflexos: { treinada: false, bonus: 0,  nivel: 0 },
    religiao: { treinada: false, bonus: 0,  nivel: 0 },
    sobrevivencia: { treinada: false, bonus: 0,  nivel: 0 },
    vontade: { treinada: false, bonus: 0,  nivel: 0 }
  },

  combate: {
    defesa: {
      bonusManual: 0,
      usarDestreza: true
    },
    empunhadura: {
      maoDireita: {
        itemInventarioId: null
      },
      maoEsquerda: {
        itemInventarioId: null
      },
      usandoDuasMaos: false,
      itemDuasMaosId: null,
      armaDosMaosId: null // compat legado; prefira itemDuasMaosId
    },
    ataques: [
      {
        nome: "Ataque Desarmado",
        origem: "desarmado",
        itemInventarioId: null,
        maoId: null,
        atributoAtaque: "for",
        periciaId: "luta",
        alcance: "corpo a corpo",
        dano: "1d3", // aumenta com tamanho da criatura (Grandes e acima)
        critico: "x2",
        tipoDano: "impacto",
        bonusAtaqueManual: 0,
        bonusDanoManual: 0,
        observacoes: "Não letal. Escala com tamanho da criatura."
      }
    ],
    armaduras: {
      armaduraId: null,
      armaduraInventarioId: null,
      escudoId: null,
      escudoInventarioId: null,
      penalidadeManual: 0
    }
  },

  inventario: {
    dinheiro: {
      tibares: 0
    },
    limites: {
      itensVestidosBase: 4,
      itensVestidosBonusManual: 0
    },
    itensVestidos: [],
    itens: [
      {
        id: "",
        itemId: "",
        quantidade: 1,
        estado: "guardado",
        equipadoEm: null,
        melhoriasIds: [],
        materialEspecialId: null,
        encantamentoIds: [],
        ataque: {
          atributoAtaque: "for",
          periciaId: "luta",
          alcance: "",
          dano: "",
          critico: "",
          tipoDano: "",
          bonusAtaqueManual: 0,
          bonusDanoManual: 0
        },
        espacosManual: null,
        observacoes: ""
      }
    ],
    cargaManual: 0
  },

  poderes: {
    adquiridos: [
      {
        poderId: "",
        origem: "",
        nivel: 1,
        escolhas: {}
      }
    ]
  },

  magias: {
    aprendidas: [
      { id: "" }
    ]
  },

  reducoes: {
    elemental: { acido: 0, eletricidade: 0, fogo: 0, frio: 0 },
    fisico: { corte: 0, impacto: 0, perfuracao: 0 },
    magico: { essencia: 0, luz: 0, psiquico: 0, trevas: 0 }
  },

  imunidades: {
    tipos: [],
    condicoes: []
  }
};

if (typeof module !== "undefined") {
  module.exports = personagemModelo;
}
