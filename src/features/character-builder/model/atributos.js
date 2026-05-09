export const ATRIBUTOS = [
  { id: "for", nome: "Força" },
  { id: "des", nome: "Destreza" },
  { id: "con", nome: "Constituição" },
  { id: "int", nome: "Inteligência" },
  { id: "sab", nome: "Sabedoria" },
  { id: "car", nome: "Carisma" }
];

export const CUSTO_ATRIBUTO = {
  "-1": -1,
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 7
};

export function calcularCustoAtributos(atributos) {
  return ATRIBUTOS.reduce((total, atributo) => total + (CUSTO_ATRIBUTO[atributos[atributo.id]] ?? 0), 0);
}

export function calcularAtributosComRaca(atributosBase, raca) {
  return calcularAtributosComEscolhas(atributosBase, raca);
}

export function calcularAtributosComEscolhas(atributosBase, raca, escolhasRaca = {}) {
  const fixos = raca?.atributos?.fixos ?? raca?.atributos ?? {};

  return ATRIBUTOS.reduce((resultado, atributo) => {
    resultado[atributo.id] =
      Number(atributosBase[atributo.id] ?? 0) + calcularBonusRacial(raca, escolhasRaca, atributo.id, fixos);
    return resultado;
  }, {});
}

export function getAllRaceChoices(raca) {
  const fromEscolhas = getRaceSelectedAbilities(raca);
  const fromHabilidades = getRaceFixedAbilities(raca)
    .filter((h) => h.escolha && getEscolhaOptions(h.escolha).length > 0)
    .map((h) => ({ id: h.id, nome: h.nome, descricao: h.descricao, ...h.escolha }));
  return [...fromHabilidades, ...fromEscolhas];
}

export function getRaceFixedAbilities(raca) {
  if (Array.isArray(raca?.habilidades)) return raca.habilidades;
  if (Array.isArray(raca?.habilidades?.fixas)) return raca.habilidades.fixas;
  return [];
}

export function getRaceSelectedAbilities(raca) {
  if (Array.isArray(raca?.habilidades?.selecionadas)) return raca.habilidades.selecionadas;
  if (Array.isArray(raca?.escolhas)) return raca.escolhas;
  return [];
}

export function calcularBonusRacial(raca, escolhasRaca = {}, atributoId, fixos = null) {
  if (!raca) return 0;

  let bonus = Number((fixos ?? raca.atributos?.fixos ?? raca.atributos ?? {})[atributoId] ?? 0);

  if (selecoesFlexiveis(escolhasRaca, "raca").includes(atributoId)) {
    bonus += Number(getRaceFlexibleRules(raca, escolhasRaca)?.valor ?? 1);
  }

  for (const escolha of getAllRaceChoices(raca)) {
    const selectedOptionId = escolhasRaca.opcoes?.[escolha.id];
    const option = getEscolhaOptions(escolha).find((entry) => entry.id === selectedOptionId);
    if (!option) continue;

    bonus += Number(option.atributos?.[atributoId] ?? 0);
    if (selecoesFlexiveis(escolhasRaca, escolha.id).includes(atributoId)) {
      bonus += Number(option.atributosFlexiveis?.valor ?? 1);
    }
  }

  if (raca.id === "duende") {
    const duende = escolhasRaca.duende ?? {};
    if (duende.natureza === "animal" && duende.naturezaAtributo === atributoId) bonus += 1;
    if ((duende.dons ?? []).includes(atributoId)) bonus += 1;
    if (duende.tamanho === "minusculo" && atributoId === "for") bonus -= 1;
    if (duende.tamanho === "grande" && atributoId === "des") bonus -= 1;
  }

  if (raca.id === "golem_desperto") {
    const tamanho = escolhasRaca.golem?.tamanho;
    if (tamanho === "pequeno" && atributoId === "des") bonus += 1;
    if (tamanho === "grande" && atributoId === "des") bonus -= 1;

    const chassiId = escolhasRaca.golem?.chassi;
    if (chassiId) {
      const chassiEscolha = getRaceSelectedAbilities(raca).find((e) => e.id === "golem_desperto_chassi");
      const chassiOpcao = getEscolhaOptions(chassiEscolha ?? {}).find((o) => o.id === chassiId);
      bonus += Number(chassiOpcao?.atributos?.[atributoId] ?? 0);
      if (selecoesFlexiveis(escolhasRaca, "golem_desperto_chassi").includes(atributoId)) {
        bonus += Number(chassiOpcao?.atributosFlexiveis?.valor ?? 1);
      }
    }
  }

  return bonus;
}

function getEscolhaOptions(escolha) {
  return escolha?.opcoes ?? escolha?.chassi ?? escolha?.sexo ?? escolha?.linhagem ?? escolha?.talentos ?? escolha?.fonte ?? escolha?.tamanho ?? [];
}

export function selecoesFlexiveis(escolhasRaca = {}, scope) {
  const value = escolhasRaca.flexiveis?.[scope];
  return Array.isArray(value) ? value : [];
}

export function getRaceFlexibleRules(raca, escolhasRaca = {}) {
  const rules = raca?.atributos?.flexiveis;
  if (!rules) return null;

  if (raca?.id === "kallyanach" && escolhasRaca.distribuicaoAtributos === "um_atributo_2") {
    return { ...rules, quantidade: 1, valor: 2 };
  }

  return rules;
}

export function criarAtributosBase() {
  return ATRIBUTOS.reduce((resultado, atributo) => {
    resultado[atributo.id] = 0;
    return resultado;
  }, {});
}
