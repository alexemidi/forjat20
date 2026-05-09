const {
  ATRIBUTOS,
  CUSTO_ATRIBUTO,
  ROLAGEM_PARA_ATRIBUTO
} = require("../constants/atributos");

function calcularCustoAtributos(atributos) {
  return ATRIBUTOS.reduce((total, atributoId) => {
    const valor = atributos[atributoId] ?? 0;
    const custo = CUSTO_ATRIBUTO[String(valor)];

    if (custo === undefined) {
      throw new Error(`Valor de atributo invalido: ${atributoId}=${valor}`);
    }

    return total + custo;
  }, 0);
}

function converterRolagemParaAtributo(totalRolado) {
  const faixa = ROLAGEM_PARA_ATRIBUTO.find((item) => {
    const acimaDoMinimo = item.min === undefined || totalRolado >= item.min;
    const abaixoDoMaximo = item.max === undefined || totalRolado <= item.max;
    return acimaDoMinimo && abaixoDoMaximo;
  });

  if (!faixa) {
    throw new Error(`Rolagem invalida: ${totalRolado}`);
  }

  return faixa.atributo;
}

function aplicarBonusRaca(atributosBase, bonusRaca = {}) {
  return ATRIBUTOS.reduce((resultado, atributoId) => {
    resultado[atributoId] = (atributosBase[atributoId] ?? 0) + (bonusRaca[atributoId] ?? 0);
    return resultado;
  }, {});
}

if (typeof module !== "undefined") {
  module.exports = {
    calcularCustoAtributos,
    converterRolagemParaAtributo,
    aplicarBonusRaca
  };
}
