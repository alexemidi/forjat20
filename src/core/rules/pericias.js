export function calcularBonusNivelPericia(nivel) {
  return Math.floor(Math.max(1, Number(nivel) || 1) / 2);
}

export function calcularBonusTreinamentoPericia(nivel, treinada = false) {
  if (!treinada) return 0;

  const valor = Math.max(1, Number(nivel) || 1);
  if (valor <= 6) return 2;
  if (valor <= 14) return 4;
  return 6;
}

export function calcularTotalPericia({ atributo = 0, nivel = 1, treinada = false, bonusDiversos = 0 }) {
  return (
    Number(atributo || 0) +
    calcularBonusNivelPericia(nivel) +
    calcularBonusTreinamentoPericia(nivel, treinada) +
    Number(bonusDiversos || 0)
  );
}
