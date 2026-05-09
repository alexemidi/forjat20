import { calcularAtributosComEscolhas } from "./atributos.js";
import { CORPO_PADRAO } from "./personagemDraft.js";
import {
  EMPUNHADURA_PADRAO,
  calcularPatamarParaNivel,
  criarAtaqueDesarmado,
  normalizarEmpunhadura,
  normalizarMontaria
} from "../../../core/rules/combate.js";
import {
  coletarBonusAtaqueRaciais,
  coletarBonusDanoRaciais,
  coletarProficienciasRaciais
} from "./racaEfeitos.js";

export function compilarPersonagem(draft, catalogs) {
  const race = catalogs.races.find((r) => r.id === draft.info.racaId);
  const atributosFinais = calcularAtributosComEscolhas(
    draft.atributosBase,
    race,
    draft.escolhas.raca
  );
  const corpo = {
    ...CORPO_PADRAO,
    ...(draft.corpo ?? {}),
    montaria: normalizarMontaria(draft.corpo?.montaria, draft.info.racaId, draft.corpo ?? CORPO_PADRAO)
  };
  const personagemBaseParaAtaques = { info: draft.info, corpo };

  return {
    schemaVersion: "0.1.0",

    info: {
      nome: draft.info.nome,
      jogador: draft.info.jogador,
      sexo: draft.info.sexo,
      nivel: draft.info.nivel,
      patamarId: calcularPatamarParaNivel(draft.info.nivel),
      racaId: draft.info.racaId,
      classeId: draft.info.classeId,
      origemId: draft.info.origemId,
      origemRegionalId: draft.info.origemRegionalId,
      deusId: draft.info.deusId
    },

    atributosBase: { ...draft.atributosBase },
    atributosFinais,

    corpo,

    escolhas: {
      raca: draft.escolhas.raca,
      classe: draft.escolhas.classe,
      origem: draft.escolhas.origem,
      poderOrigemId: draft.escolhas.poderOrigemId,
      equipamentoInicialIds: draft.escolhas.equipamentoInicialIds,
      escolasMagiaIds: draft.escolhas.escolasMagiaIds,
      magiasIds: draft.escolhas.magiasIds
    },

    recursos: {
      pvTotais: 0,
      pmTotais: 0,
      pvAtual: 0,
      pmAtual: 0
    },

    proficiencias: [
      ...(catalogs.classes.find((c) => c.id === draft.info.classeId)?.caracteristicas?.proficiencias ?? []).map((id) => ({
        tipo: "classe",
        id
      })),
      ...coletarProficienciasRaciais(race, draft.escolhas.raca)
    ],
    bonusAtaque: [
      ...coletarBonusAtaqueRaciais(race, draft.escolhas.raca)
    ],
    bonusDano: [
      ...coletarBonusDanoRaciais(race, draft.escolhas.raca)
    ],

    pericias: {
      treinadas: [],
      bonusManuais: {}
    },

    combate: {
      defesa: {
        bonusManual: 0,
        usarDestreza: true
      },
      empunhadura: normalizarEmpunhadura(draft.combate?.empunhadura ?? EMPUNHADURA_PADRAO),
      ataques: [criarAtaqueDesarmado(personagemBaseParaAtaques)],
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
    },

    poderes: {
      adquiridos: [
        ...(draft.escolhas.classe?.poderesClasse ?? []).map((id) => ({
          tipo: "classe",
          classeId: draft.info.classeId,
          poderId: id
        }))
      ]
    },

    magias: {
      aprendidas: []
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
}
