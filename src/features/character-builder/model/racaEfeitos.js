import { getAllRaceChoices, getRaceFixedAbilities, getRaceSelectedAbilities } from "./atributos.js";
import gruposArmas from "../../../data/gruposArmas.json";

function getEscolhaOptions(escolha) {
  return (
    escolha?.opcoes ??
    escolha?.chassi ??
    escolha?.sexo ??
    escolha?.linhagem ??
    escolha?.talentos ??
    escolha?.fonte ??
    escolha?.tamanho ??
    []
  );
}

export function coletarEfeitosAtivos(race, raceChoices = {}) {
  const efeitos = [];

  // Fixed habilidade efeitos (including those with embedded choices — base effects still apply)
  for (const hab of getRaceFixedAbilities(race)) {
    for (const ef of hab.efeitos ?? []) {
      efeitos.push({ ...ef, _fonte: hab.nome });
    }
  }

  // Choices from race.escolhas + habilidades[].escolha
  for (const escolha of getAllRaceChoices(race)) {
    const rawSelected = raceChoices?.opcoes?.[escolha.id];
    if (rawSelected === undefined || rawSelected === null || rawSelected === "") continue;

    const options = getEscolhaOptions(escolha);
    const selectedIds = Array.isArray(rawSelected) ? rawSelected : [rawSelected];

    for (const sid of selectedIds) {
      const option = options.find((o) => o.id === sid);
      if (!option) continue;

      for (const ef of option.efeitos ?? []) {
        efeitos.push({ ...ef, _fonte: option.nome });
      }
      for (const hab of option.habilidades ?? []) {
        for (const ef of hab.efeitos ?? []) {
          efeitos.push({ ...ef, _fonte: hab.nome });
        }
      }
    }
  }

  // Golem Desperto — chassi stored in raceChoices.golem.chassi
  if (race?.id === "golem_desperto") {
    const chassiId = raceChoices?.golem?.chassi;
    if (chassiId) {
      const escolha = getRaceSelectedAbilities(race).find((e) => e.id === "golem_desperto_chassi");
      const opt = (escolha?.chassi ?? []).find((o) => o.id === chassiId);
      if (opt) {
        for (const ef of opt.efeitos ?? []) efeitos.push({ ...ef, _fonte: opt.nome });
        for (const hab of opt.habilidades ?? []) {
          for (const ef of hab.efeitos ?? []) efeitos.push({ ...ef, _fonte: hab.nome });
        }
      }
    }
  }

  // Duende — natureza stored in raceChoices.duende.natureza
  if (race?.id === "duende") {
    const naturezaId = raceChoices?.duende?.natureza;
    if (naturezaId) {
      const escolha = getRaceSelectedAbilities(race).find((e) => e.id === "duende_natureza");
      const opt = (escolha?.opcoes ?? []).find((o) => o.id === naturezaId);
      if (opt) {
        for (const ef of opt.efeitos ?? []) efeitos.push({ ...ef, _fonte: `Natureza ${opt.nome}` });
        for (const hab of opt.habilidades ?? []) {
          for (const ef of hab.efeitos ?? []) efeitos.push({ ...ef, _fonte: hab.nome });
        }
      }
    }
  }

  return efeitos;
}

export function calcularBonusPericiasRaciais(race, raceChoices = {}) {
  const bonuses = {};
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "bonus_pericia" || ef.tipo === "penalidade_pericia") {
      for (const id of ef.pericias ?? []) {
        bonuses[id] = (bonuses[id] ?? 0) + (ef.valor ?? 0);
      }
    }
  }
  return bonuses;
}

export function coletarPericiasTreinadasRaciais(race, raceChoices = {}) {
  const set = new Set();
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "pericia_treinada" && ef.periciaId) set.add(ef.periciaId);
  }
  return set;
}

export function coletarQuantidadePericiasRaciaisEscolhiveis(race, raceChoices = {}) {
  let total = 0;
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "escolha_pericia_treinada") {
      total += Number(ef.quantidade ?? ef.periciasTreinadas ?? 0);
    }
  }
  return total;
}

export function coletarProficienciasRaciais(race, raceChoices = {}) {
  const proficiencias = [];
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "proficiencia_grupo_armas") {
      const grupo = getGrupoArma(ef.grupoArmaId);
      proficiencias.push({
        tipo: "grupo_armas",
        id: ef.grupoArmaId,
        nome: grupo?.nome ?? ef.grupoArmaId,
        tratarComo: ef.tratarComo,
        descricao: `${grupo?.nome ?? ef.grupoArmaId}${ef.tratarComo ? ` como ${ef.tratarComo}` : ""}`,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "proficiencia_categoria_armas") {
      proficiencias.push({
        tipo: "categoria_armas",
        id: ef.id,
        nome: ef.nome ?? formatarId(ef.id),
        descricao: ef.nome ?? formatarId(ef.id),
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "proficiencia_arma") {
      const arma = formatarId(ef.armaId);
      proficiencias.push({
        tipo: "arma",
        id: ef.armaId,
        nome: arma,
        descricao: arma,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "proficiencia_armas") {
      const armas = (ef.armas ?? []).map(formatarId).join(", ");
      proficiencias.push({
        tipo: "armas",
        armas: ef.armas ?? [],
        nome: armas,
        descricao: armas,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "considerar_armas_como_simples") {
      const armas = (ef.armas ?? []).map(formatarId).join(", ");
      proficiencias.push({
        tipo: "armas_como_simples",
        armas: ef.armas ?? [],
        nome: armas,
        tratarComo: "simples",
        descricao: `${armas} como armas simples`,
        fonte: ef._fonte
      });
    }
  }
  return proficiencias;
}

export function coletarBonusAtaqueRaciais(race, raceChoices = {}) {
  const bonus = [];
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "bonus_ataque_grupo_armas") {
      const grupo = getGrupoArma(ef.grupoArmaId);
      bonus.push({
        tipo: "grupo_armas",
        id: ef.grupoArmaId,
        nome: grupo?.nome ?? ef.grupoArmaId,
        valor: Number(ef.valor ?? 0),
        condicao: ef.condicao,
        descricao: `${formatSigned(ef.valor)} ataque com ${grupo?.nome ?? ef.grupoArmaId}`,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "bonus_ataque_armas_se_proficiente") {
      const armas = (ef.armas ?? []).map(formatarId).join(", ");
      bonus.push({
        tipo: "armas_se_proficiente",
        armas: ef.armas ?? [],
        valor: Number(ef.valor ?? 0),
        condicao: "se proficiente",
        descricao: `${formatSigned(ef.valor)} ataque com ${armas} se proficiente`,
        fonte: ef._fonte
      });
    }
  }
  return bonus;
}

export function coletarBonusDanoRaciais(race, raceChoices = {}) {
  const bonus = [];
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "bonus_dano_grupo_armas") {
      const grupo = getGrupoArma(ef.grupoArmaId);
      bonus.push({
        tipo: "grupo_armas",
        id: ef.grupoArmaId,
        nome: grupo?.nome ?? ef.grupoArmaId,
        valor: Number(ef.valor ?? 0),
        condicao: ef.condicao,
        descricao: `${formatSigned(ef.valor)} dano com ${grupo?.nome ?? ef.grupoArmaId}`,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "bonus_dano_categoria_armas") {
      const nome = ef.nome ?? formatarId(ef.id);
      bonus.push({
        tipo: "categoria_armas",
        id: ef.id,
        nome,
        valor: Number(ef.valor ?? 0),
        condicao: ef.condicao,
        descricao: `${formatSigned(ef.valor)} dano com ${nome}`,
        fonte: ef._fonte
      });
    }
    if (ef.tipo === "bonus_dano_armas") {
      const armas = (ef.armas ?? []).map(formatarId).join(", ");
      bonus.push({
        tipo: "armas",
        armas: ef.armas ?? [],
        valor: Number(ef.valor ?? 0),
        condicao: ef.condicao,
        descricao: `${formatSigned(ef.valor)} dano com ${armas}`,
        fonte: ef._fonte
      });
    }
  }
  return bonus;
}

export function coletarRDRaciais(race, raceChoices = {}) {
  const efeitos = coletarEfeitosAtivos(race, raceChoices);
  const hasUpgrade = efeitos.some((ef) => ef.tipo === "upgrade_reducao_dano_heranca");
  const rds = [];

  for (const ef of efeitos) {
    if (ef.tipo === "reducao_dano") {
      let valor = ef.valor;
      if (hasUpgrade && valor === 5) valor = 10;
      rds.push({ tipos: ef.tipos ?? [], valor, fonte: ef._fonte, condicao: ef.condicao });
    }
    // Fallback for old escolha_reducao_dano pattern
    if (ef.tipo === "escolha_reducao_dano") {
      const choiceId = Object.keys(raceChoices?.opcoes ?? {}).find((k) =>
        (ef.opcoes ?? []).includes(raceChoices.opcoes[k])
      );
      if (choiceId) {
        rds.push({ tipos: [raceChoices.opcoes[choiceId]], valor: ef.valor, fonte: ef._fonte });
      }
    }
  }

  return rds;
}

export function coletarImunidadesRaciais(race, raceChoices = {}) {
  const condicoes = new Set();
  const tiposDano = new Set();

  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "imunidade_condicao") {
      for (const c of ef.condicoes ?? []) condicoes.add(c);
    }
    if (ef.tipo === "imunidade_dano_tipo") {
      for (const t of ef.tipos ?? []) tiposDano.add(t);
    }
  }

  return { condicoes: [...condicoes], tiposDano: [...tiposDano] };
}

export function coletarTipoCriatura(race, raceChoices = {}) {
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "tipo_criatura") return ef.valor;
  }
  return null;
}

export function coletarVisao(race, raceChoices = {}) {
  const visoes = new Set();
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "visao") visoes.add(ef.valor);
    if (ef.tipo === "sentido_especial" && ef.valor === "faro") visoes.add("faro");
  }
  return [...visoes];
}

export function coletarBonusPvRacial(race, raceChoices = {}, nivel = 1) {
  return detalharBonusPvRacial(race, raceChoices, nivel).total;
}

export function coletarBonusPmRacial(race, raceChoices = {}, nivel = 1) {
  return detalharBonusPmRacial(race, raceChoices, nivel).total;
}

export function detalharBonusPvRacial(race, raceChoices = {}, nivel = 1) {
  const detalhes = [];
  let total = 0;
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "bonus_pv") {
      const inicial = Number(ef.nivel1 ?? 0);
      const porNivelApos1 = Number(ef.porNivelApos1 ?? 0);
      total += inicial + porNivelApos1 * Math.max(0, nivel - 1);
      detalhes.push({ inicial, porNivelApos1 });
    }
  }
  return { total, detalhes };
}

export function detalharBonusPmRacial(race, raceChoices = {}, nivel = 1) {
  const detalhes = [];
  let total = 0;
  for (const ef of coletarEfeitosAtivos(race, raceChoices)) {
    if (ef.tipo === "bonus_pm_por_nivel") {
      const porNivel = Number(ef.valor ?? 0);
      total += porNivel * nivel;
      detalhes.push({ porNivel });
    }
  }
  return { total, detalhes };
}

export function coletarHabilidadesAtivas(race, raceChoices = {}) {
  const habs = [];

  for (const hab of getRaceFixedAbilities(race)) {
    if (hab.nome && hab.descricao) {
      habs.push({ nome: hab.nome, descricao: hab.descricao });
    }
  }

  for (const escolha of getAllRaceChoices(race)) {
    const rawSelected = raceChoices?.opcoes?.[escolha.id];
    if (rawSelected === undefined || rawSelected === null || rawSelected === "") continue;

    const options = getEscolhaOptions(escolha);
    const selectedIds = Array.isArray(rawSelected) ? rawSelected : [rawSelected];

    for (const sid of selectedIds) {
      const option = options.find((o) => o.id === sid);
      if (!option) continue;

      if (option.descricao) {
        habs.push({ nome: option.nome, descricao: option.descricao });
      }
      for (const hab of option.habilidades ?? []) {
        if (hab.descricao) habs.push({ nome: hab.nome, descricao: hab.descricao });
      }
    }
  }

  // Golem Desperto chassi
  if (race?.id === "golem_desperto") {
    const chassiId = raceChoices?.golem?.chassi;
    if (chassiId) {
      const escolha = getRaceSelectedAbilities(race).find((e) => e.id === "golem_desperto_chassi");
      const opt = (escolha?.chassi ?? []).find((o) => o.id === chassiId);
      if (opt?.descricao) {
        habs.push({ nome: `Chassi: ${opt.nome}`, descricao: opt.descricao });
      }
      for (const hab of opt?.habilidades ?? []) {
        if (hab.descricao) habs.push({ nome: hab.nome, descricao: hab.descricao });
      }
    }
  }

  // Duende natureza
  if (race?.id === "duende") {
    const naturezaId = raceChoices?.duende?.natureza;
    if (naturezaId) {
      const escolha = getRaceSelectedAbilities(race).find((e) => e.id === "duende_natureza");
      const opt = (escolha?.opcoes ?? []).find((o) => o.id === naturezaId);
      if (opt?.descricao) {
        habs.push({ nome: `Natureza: ${opt.nome}`, descricao: opt.descricao });
      }
      for (const hab of opt?.habilidades ?? []) {
        if (hab.descricao) habs.push({ nome: hab.nome, descricao: hab.descricao });
      }
    }
  }

  return habs;
}

function getGrupoArma(grupoArmaId) {
  return gruposArmas.find((grupo) => grupo.id === grupoArmaId);
}

function formatarId(id) {
  return String(id ?? "").replaceAll("_", " ");
}

function formatSigned(value) {
  const number = Number(value ?? 0);
  return number > 0 ? `+${number}` : String(number);
}
