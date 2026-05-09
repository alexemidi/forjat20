const { CORPO_PADRAO } = require("../constants/corpo");

function resolverCorpoPersonagem(corpoRaca = {}, ajustesManuais = {}) {
  return {
    tamanhoId: corpoRaca.tamanhoId ?? CORPO_PADRAO.tamanhoId,
    deslocamentoBase: corpoRaca.deslocamentoBase ?? CORPO_PADRAO.deslocamentoBase,
    alcanceNatural: corpoRaca.alcanceNatural ?? CORPO_PADRAO.alcanceNatural,
    bonusManobraManual: ajustesManuais.bonusManobraManual ?? 0,
    bonusDeslocamentoManual: ajustesManuais.bonusDeslocamentoManual ?? 0
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    resolverCorpoPersonagem
  };
}
