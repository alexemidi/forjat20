import { criarAtributosBase } from "./atributos.js";
import {
  EMPUNHADURA_PADRAO,
  MONTARIA_PADRAO,
  calcularPatamarParaNivel,
  criarAtaqueDesarmado
} from "../../../core/rules/combate.js";

export const CORPO_PADRAO = {
  tamanhoId: "medio",
  deslocamentoBase: 9,
  alcanceNatural: 1.5,
  montaria: { ...MONTARIA_PADRAO }
};

export function criarPersonagemDraft() {
  return {
    info: {
      nome: "",
      jogador: "",
      sexo: "",
      nivel: 1,
      patamarId: calcularPatamarParaNivel(1),
      racaId: "",
      classeId: "",
      origemId: "",
      origemRegionalId: "",
      deusId: ""
    },
    atributosBase: criarAtributosBase(),
    corpo: structuredClone(CORPO_PADRAO),
    escolhas: {
      raca: {
        opcoes: {},
        flexiveis: {},
        duende: {},
        golem: {}
      },
      classe: {
        periciasFixas: {},
        periciasRaca: [],
        periciasClasse: [],
        periciasInteligencia: [],
        oficiosFixos: {},
        poderesClasse: [],
        prototipo: {
          modo: "",
          itemSuperior: {
            itemId: "",
            melhoriaId: "",
            melhoriaIds: []
          },
          alquimicos: []
        }
      },
      origem: {
        beneficios: [],
        itens: {}
      },
      poderOrigemId: "",
      equipamentoInicialIds: [],
      escolasMagiaIds: [],
      magiasIds: []
    },
    combate: {
      defesa: {
        bonusManual: 0,
        usarDestreza: true
      },
      empunhadura: structuredClone(EMPUNHADURA_PADRAO),
      ataques: [criarAtaqueDesarmado({ corpo: CORPO_PADRAO })],
      armaduras: {
        armaduraId: null,
        armaduraInventarioId: null,
        escudoId: null,
        escudoInventarioId: null,
        penalidadeManual: 0
      }
    },
    inventario: {
      dinheiro: { tibares: 0 },
      limites: {
        itensVestidosBase: 4,
        itensVestidosBonusManual: 0
      },
      itensVestidos: [],
      itens: [],
      cargaManual: 0
    }
  };
}
