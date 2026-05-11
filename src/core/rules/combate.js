/**
 * Regras centrais de combate usadas pelo criador de personagem.
 * Mantem aqui apenas estado e calculos; UI de inventario/equipamento consome estas funcoes.
 */

export const PATAMARES = {
  iniciante: { id: "iniciante", nome: "Iniciante", minNivel: 1, maxNivel: 4 },
  veterano: { id: "veterano", nome: "Veterano", minNivel: 5, maxNivel: 10 },
  campeao: { id: "campeao", nome: "Campeao", minNivel: 11, maxNivel: 16 },
  lenda: { id: "lenda", nome: "Lenda", minNivel: 17, maxNivel: 20 }
};

export const MONTARIAS = {
  cavalo: {
    id: "cavalo",
    nome: "Cavalo",
    tamanhoId: "grande",
    beneficios: {
      iniciante: { deslocamentoBase: 12, acoesMovimentoExtras: 1 },
      veterano: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusAtaqueCorpoACorpo: 2 },
      mestre: { deslocamentoBase: 15, acoesMovimentoExtras: 2, bonusAtaqueCorpoACorpo: 2 }
    }
  },
  cavalo_de_guerra: {
    id: "cavalo_de_guerra",
    nome: "Cavalo de Guerra",
    tamanhoId: "grande",
    dispensaTesteCombate: true,
    beneficios: {
      iniciante: { deslocamentoBase: 12, acoesMovimentoExtras: 1 },
      veterano: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusAtaqueCorpoACorpo: 2 },
      mestre: { deslocamentoBase: 15, acoesMovimentoExtras: 2, bonusAtaqueCorpoACorpo: 2 }
    }
  },
  ponei: {
    id: "ponei",
    nome: "Ponei",
    tamanhoId: "medio",
    beneficios: {
      iniciante: { deslocamentoBase: 12, acoesMovimentoExtras: 1 },
      veterano: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusAtaqueCorpoACorpo: 2 },
      mestre: { deslocamentoBase: 15, acoesMovimentoExtras: 2, bonusAtaqueCorpoACorpo: 2 }
    }
  },
  ponei_de_guerra: {
    id: "ponei_de_guerra",
    nome: "Ponei de Guerra",
    tamanhoId: "medio",
    dispensaTesteCombate: true,
    beneficios: {
      iniciante: { deslocamentoBase: 12, acoesMovimentoExtras: 1 },
      veterano: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusAtaqueCorpoACorpo: 2 },
      mestre: { deslocamentoBase: 15, acoesMovimentoExtras: 2, bonusAtaqueCorpoACorpo: 2 }
    }
  },
  cao_de_caca: {
    id: "cao_de_caca",
    nome: "Cao de caca",
    tamanhoId: "medio",
    beneficios: {
      iniciante: { deslocamentoBase: 9, acoesMovimentoExtras: 1, sentidos: ["faro"] },
      veterano: { deslocamentoBase: 12, acoesMovimentoExtras: 1, sentidos: ["faro"], bonusDefesa: 2 },
      mestre: { deslocamentoBase: 12, acoesMovimentoExtras: 1, sentidos: ["faro"], bonusDefesa: 2, manobraLivreAoAcertar: "derrubar" }
    }
  },
  lobo_das_cavernas: {
    id: "lobo_das_cavernas",
    nome: "Lobo-das-cavernas",
    tamanhoId: "grande",
    beneficios: {
      iniciante: { deslocamentoBase: 12, acoesMovimentoExtras: 1 },
      veterano: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusDanoCorpoACorpoUmaVez: "1d8" },
      mestre: { deslocamentoBase: 15, acoesMovimentoExtras: 1, bonusDanoCorpoACorpoUmaVez: "1d8", manobraLivreAoAcertar: "derrubar" }
    }
  },
  grifo: {
    id: "grifo",
    nome: "Grifo",
    tamanhoId: "grande",
    beneficios: {
      iniciante: { montavel: false, bonusDanoCorpoACorpoUmaVez: "1d8" },
      veterano: { deslocamentoVoo: 18, bonusDanoCorpoACorpoUmaVez: "1d8" },
      mestre: { deslocamentoVoo: 18, acoesMovimentoExtras: 1, bonusDanoCorpoACorpoUmaVez: "1d8" }
    }
  },
  gorlogg: {
    id: "gorlogg",
    nome: "Gorlogg",
    tamanhoId: "grande",
    beneficios: {
      iniciante: { deslocamentoBase: 12, bonusDanoCorpoACorpoUmaVez: "1d6" },
      veterano: { deslocamentoBase: 12, bonusDanoCorpoACorpoUmaVez: "1d10" },
      mestre: { deslocamentoBase: 15, bonusDanoCorpoACorpoUmaVez: "2d8" }
    }
  },
  trobo: {
    id: "trobo",
    nome: "Trobo",
    tamanhoId: "grande",
    beneficios: {
      iniciante: { deslocamentoBase: 9, acoesMovimentoExtras: 1, bonusResistencia: 1 },
      veterano: { deslocamentoBase: 12, acoesMovimentoExtras: 1, bonusResistencia: 2 },
      mestre: { deslocamentoBase: 12, acoesMovimentoExtras: 1, bonusResistencia: 5 }
    }
  }
};

export const EMPUNHADURA_PADRAO = {
  maoDireita: { itemInventarioId: null },
  maoEsquerda: { itemInventarioId: null },
  usandoDuasMaos: false,
  itemDuasMaosId: null
};

export const MONTARIA_PADRAO = {
  montado: false,
  natural: false,
  montariaId: null,
  tamanhoId: null,
  nivelMontaria: "iniciante",
  treinadoEmCavalgar: false,
  possuiGinete: false,
  observacoes: ""
};

const DANO_PASSOS = [
  "1",
  "1d2",
  "1d3",
  "1d4",
  "1d6",
  "1d8",
  "1d10",
  "1d12",
  "3d6",
  "4d6",
  "4d8",
  "4d10",
  "4d12"
];

const PASSOS_TAMANHO = {
  minusculo: -1,
  pequeno: 0,
  medio: 0,
  grande: 1,
  enorme: 1,
  colossal: 2
};

const ORDEM_TAMANHO = ["minusculo", "pequeno", "medio", "grande", "enorme", "colossal"];

export function calcularPatamarParaNivel(nivel) {
  const valor = Math.max(1, Math.min(20, Number(nivel) || 1));
  if (valor <= 4) return PATAMARES.iniciante.id;
  if (valor <= 10) return PATAMARES.veterano.id;
  if (valor <= 16) return PATAMARES.campeao.id;
  return PATAMARES.lenda.id;
}

export function nomePatamar(patamarId) {
  return PATAMARES[patamarId]?.nome ?? PATAMARES.iniciante.nome;
}

export function ajustarPassosDano(danoBase, passos = 0) {
  const indice = DANO_PASSOS.indexOf(danoBase);
  if (indice < 0) return danoBase;
  const proximoIndice = Math.max(0, Math.min(DANO_PASSOS.length - 1, indice + Number(passos || 0)));
  return DANO_PASSOS[proximoIndice];
}

export function calcularPassosDanoPorTamanho(tamanhoId) {
  return PASSOS_TAMANHO[tamanhoId] ?? 0;
}

export function calcularDanoDesarmado(personagem, bonusDano = 0) {
  const tamanho = personagem?.corpo?.tamanhoId ?? "medio";
  const danoBase = ajustarPassosDano("1d3", calcularPassosDanoPorTamanho(tamanho));
  const bonus = Number(bonusDano || 0);
  if (!bonus) return danoBase;
  return `${danoBase}${bonus > 0 ? "+" : ""}${bonus}`;
}

export function criarAtaqueDesarmado(personagem) {
  return {
    nome: "Ataque Desarmado",
    origem: "desarmado",
    itemInventarioId: null,
    maoId: null,
    atributoAtaque: "for",
    periciaId: "luta",
    alcance: "corpo a corpo",
    dano: calcularDanoDesarmado(personagem),
    critico: "x2",
    tipoDano: "impacto",
    letal: false,
    bonusAtaqueManual: 0,
    bonusDanoManual: 0,
    observacoes: "Nao letal. Uma unica arma leve corpo a corpo natural do proprio corpo, sem ser arma natural."
  };
}

export function maoEstaLivre(mao) {
  return !mao?.itemInventarioId;
}

export function normalizarEmpunhadura(empunhadura = {}) {
  return {
    maoDireita: { ...EMPUNHADURA_PADRAO.maoDireita, ...(empunhadura.maoDireita ?? {}) },
    maoEsquerda: { ...EMPUNHADURA_PADRAO.maoEsquerda, ...(empunhadura.maoEsquerda ?? {}) },
    usandoDuasMaos: Boolean(empunhadura.usandoDuasMaos),
    itemDuasMaosId: empunhadura.itemDuasMaosId ?? empunhadura.armaDosMaosId ?? null
  };
}

export function obterMaosNecessarias(item) {
  const empunhaduraId = item?.arma?.empunhaduraId;
  if (empunhaduraId === "duas_maos") return 2;
  if (item?.equipamento?.slotsPermitidos?.includes("duas_maos")) return 2;
  return 1;
}

export function itemEhAdaptavel(item) {
  const ids = item?.arma?.propriedadesIds ?? [];
  const texto = `${item?.textos?.habilidade ?? ""} ${item?.textos?.variavel ?? ""}`;
  return ids.includes("adaptavel") || /adapt[aá]vel/i.test(texto);
}

export function equiparItemNaMao(empunhadura, itemInventario, itemCatalogo, maoPreferida = "maoDireita", usarDuasMaos = false) {
  const estado = normalizarEmpunhadura(empunhadura);
  const itemInventarioId = itemInventario?.id ?? itemInventario?.itemInventarioId ?? itemInventario;
  const maosNecessarias = usarDuasMaos || obterMaosNecessarias(itemCatalogo) === 2 ? 2 : 1;

  if (!itemInventarioId) return estado;

  if (maosNecessarias === 2) {
    return {
      maoDireita: { itemInventarioId },
      maoEsquerda: { itemInventarioId },
      usandoDuasMaos: true,
      itemDuasMaosId: itemInventarioId
    };
  }

  const proxima = {
    ...estado,
    usandoDuasMaos: false,
    itemDuasMaosId: null
  };

  if (estado.usandoDuasMaos) {
    proxima.maoDireita = { itemInventarioId: null };
    proxima.maoEsquerda = { itemInventarioId: null };
  }

  const mao = maoPreferida === "maoEsquerda" ? "maoEsquerda" : "maoDireita";
  const outraMao = mao === "maoDireita" ? "maoEsquerda" : "maoDireita";

  if (maoEstaLivre(proxima[mao])) {
    proxima[mao] = { itemInventarioId };
  } else if (maoEstaLivre(proxima[outraMao])) {
    proxima[outraMao] = { itemInventarioId };
  } else {
    proxima[mao] = { itemInventarioId };
  }

  return proxima;
}

export function criarMontariaParaRaca(racaId, corpo = {}) {
  if (racaId !== "centauro") return { ...MONTARIA_PADRAO };

  return {
    ...MONTARIA_PADRAO,
    montado: true,
    natural: true,
    montariaId: "centauro",
    tamanhoId: corpo.tamanhoId ?? "grande",
    nivelMontaria: null,
    observacoes: "Ginete Natural: considerado montado para investidas e beneficios de armas; nao recebe beneficios de uma montaria."
  };
}

export function normalizarMontaria(montaria = {}, racaId = null, corpo = {}) {
  if (racaId === "centauro") return criarMontariaParaRaca(racaId, corpo);
  return {
    ...MONTARIA_PADRAO,
    ...montaria,
    montariaId: montaria.montariaId ?? montaria.montagemId ?? null
  };
}

export function estaMontado(personagem) {
  return Boolean(personagem?.corpo?.montaria?.montado || personagem?.info?.racaId === "centauro");
}

export function calcularTamanhoEfetivo(personagem) {
  const tamanhoBase = personagem?.corpo?.tamanhoId ?? "medio";
  const montaria = personagem?.corpo?.montaria;
  if (!montaria?.montado || !montaria?.tamanhoId) return tamanhoBase;

  const base = ORDEM_TAMANHO.indexOf(tamanhoBase);
  const montado = ORDEM_TAMANHO.indexOf(montaria.tamanhoId);
  return montado > base ? montaria.tamanhoId : tamanhoBase;
}

export function calcularPenalidadesCombateMontado(personagem) {
  const montaria = normalizarMontaria(personagem?.corpo?.montaria, personagem?.info?.racaId, personagem?.corpo);

  if (!montaria.montado) {
    return { penalidadeAtaqueDistancia: 0, condicaoMagia: "normal", exigeTesteGuia: false, testeQuedaAoSofrerDano: false };
  }

  if (montaria.natural || montaria.treinadoEmCavalgar || montaria.possuiGinete) {
    return { penalidadeAtaqueDistancia: 0, condicaoMagia: "normal", exigeTesteGuia: false, testeQuedaAoSofrerDano: false };
  }

  if (["cavalo", "ponei"].includes(montaria.montariaId)) {
    return {
      penalidadeAtaqueDistancia: -2,
      condicaoMagia: "ruim",
      exigeTesteGuia: true,
      testeGuia: "Cavalgar CD 20 por rodada para permanecer montado em combate",
      testeQuedaAoSofrerDano: true,
      testeQueda: "Cavalgar CD igual ao dano sofrido; falha derruba e causa 1d6"
    };
  }

  return {
    penalidadeAtaqueDistancia: -2,
    condicaoMagia: "ruim",
    exigeTesteGuia: true,
    testeGuia: "acao de movimento, Cavalgar CD 10 por turno",
    testeQuedaAoSofrerDano: true,
    testeQueda: "Cavalgar CD igual ao dano sofrido; falha derruba e causa 1d6"
  };
}

export function obterBeneficiosMontaria(montaria = {}) {
  const id = montaria.montariaId ?? montaria.montagemId;
  if (!id || montaria.natural) return null;
  return MONTARIAS[id]?.beneficios?.[montaria.nivelMontaria ?? "iniciante"] ?? null;
}

// Compatibilidade com nome antigo.
export const calcularPenalidade_CombateMontado = calcularPenalidadesCombateMontado;
export const validarSobreposicaoArmas = equiparItemNaMao;
