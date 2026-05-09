import {
  calcularBonusNivelPericia,
  calcularBonusTreinamentoPericia,
  calcularTotalPericia
} from "../../../core/rules/pericias.js";
import { PERICIAS } from "../../../core/rules/periciasCatalogo.js";
import { calcularAtributosComEscolhas } from "./atributos.js";
import {
  calcularBonusPericiasRaciais,
  coletarPericiasTreinadasRaciais
} from "./racaEfeitos.js";

const OFICIOS_NOMES = {
  alquimista: "alquimista",
  armeiro: "armeiro",
  artesao: "artesao",
  cozinheiro: "cozinheiro",
  alfaiate: "alfaiate",
  alvenaria: "alvenaria",
  carpinteiro: "carpinteiro",
  joalheiro: "joalheiro",
  fazendeiro: "fazendeiro",
  pescador: "pescador",
  estalajadeiro: "estalajadeiro",
  escriba: "escriba",
  escultor: "escultor",
  engenhoqueiro: "engenhoqueiro",
  pintor: "pintor",
  minerador: "minerador"
};

export function calcularPericiasPersonagem(draft, catalogs, options = {}) {
  const race = options.race ?? catalogs.races.find((raca) => raca.id === draft.info.racaId);
  const classe = options.classe ?? catalogs.classes.find((item) => item.id === draft.info.classeId);
  const raceChoices = options.raceChoices ?? draft.escolhas.raca ?? {};
  const attrs = options.attrs ?? calcularAtributosComEscolhas(draft.atributosBase, race, raceChoices);
  const nivel = Number(draft.info.nivel ?? 1);
  const escolhasClasse = draft.escolhas.classe ?? {};
  const escolhasOrigem = draft.escolhas.origem ?? {};
  const bonusNivelPericia = calcularBonusNivelPericia(nivel);
  const bonusTamanhoFurtividade = Number(options.bonusTamanhoFurtividade ?? 0);

  const fixasClasse = new Set((classe?.caracteristicas?.pericias?.fixas ?? []).filter((p) => p.id && p.id !== "oficio").map((p) => p.id));
  const fixasEscolhidasClasse = new Set(Object.values(escolhasClasse.periciasFixas ?? {}).filter(Boolean).map(getPericiaBaseId));
  const periciasEscolhidasRaca = new Set((escolhasClasse.periciasRaca ?? []).map(getPericiaBaseId));
  const periciasEscolhidasClasse = new Set((escolhasClasse.periciasClasse ?? []).map(getPericiaBaseId));
  const periciasInteligenciaClasse = new Set((escolhasClasse.periciasInteligencia ?? []).map(getPericiaBaseId));
  const periciasOrigem = new Set(getPericiasOrigemSelecionadas(escolhasOrigem));
  const oficiosSelecionados = getSelectedOficios(escolhasClasse, escolhasOrigem);
  const treinadasRaciais = race ? coletarPericiasTreinadasRaciais(race, raceChoices) : new Set();
  const bonusRacial = race ? calcularBonusPericiasRaciais(race, raceChoices) : {};

  const pericias = PERICIAS.flatMap((pericia) => {
    const treinada =
      fixasClasse.has(pericia.id) ||
      (pericia.id === "oficio" && oficiosSelecionados.length > 0) ||
      fixasEscolhidasClasse.has(pericia.id) ||
      periciasEscolhidasRaca.has(pericia.id) ||
      periciasEscolhidasClasse.has(pericia.id) ||
      periciasInteligenciaClasse.has(pericia.id) ||
      periciasOrigem.has(pericia.id) ||
      treinadasRaciais.has(pericia.id);
    const atributoValor = Number(attrs[pericia.atributo] ?? 0);
    const racial = Number(bonusRacial[pericia.id] ?? 0);
    const tamanho = pericia.id === "furtividade" ? bonusTamanhoFurtividade : 0;
    const bonusDiversos = racial + tamanho;
    const bonusTreino = calcularBonusTreinamentoPericia(nivel, treinada);
    const bloqueada = Boolean(pericia.requerTreinamento && !treinada);
    const total = bloqueada
      ? bonusDiversos
      : calcularTotalPericia({ atributo: atributoValor, nivel, treinada, bonusDiversos });

    const base = {
      ...pericia,
      treinada,
      bloqueada,
      atributoValor,
      bonusNivel: bonusNivelPericia,
      bonusTreino,
      bonusDiversos,
      bonusGeral: bonusTreino + bonusDiversos,
      total
    };
    if (pericia.id === "oficio" && oficiosSelecionados.length > 0) {
      return oficiosSelecionados.map((oficioId) => ({
        ...base,
        id: `oficio:${oficioId}`,
        nome: `${pericia.nome} (${OFICIOS_NOMES[oficioId] ?? oficioId})`
      }));
    }
    return [base];
  });

  return { pericias, bonusNivelPericia };
}

function getPericiasOrigemSelecionadas(escolhasOrigem = {}) {
  return (escolhasOrigem.beneficios ?? [])
    .filter((id) => String(id).startsWith("pericia:"))
    .map((id) => {
      const value = String(id).slice("pericia:".length);
      return normalizarPericiaId(value.split(":")[0]);
    });
}

function getPericiaBaseId(periciaId) {
  return String(periciaId ?? "").startsWith("oficio:") ? "oficio" : periciaId;
}

function normalizarPericiaId(nome) {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getSelectedOficios(classChoices = {}, originChoices = {}) {
  const fixed = Array.isArray(classChoices.oficiosFixos)
    ? classChoices.oficiosFixos
    : Object.values(classChoices.oficiosFixos ?? {});
  const fromSelections = [
    ...(classChoices.periciasClasse ?? []),
    ...(classChoices.periciasInteligencia ?? []),
    ...(classChoices.periciasRaca ?? [])
  ]
    .filter((id) => String(id).startsWith("oficio:"))
    .map((id) => String(id).slice("oficio:".length));
  const fromOrigin = (originChoices.beneficios ?? [])
    .filter((id) => String(id).startsWith("pericia:Ofício:") || String(id).startsWith("pericia:Oficio:"))
    .map((id) => String(id).split(":").at(-1))
    .filter(Boolean);
  return [...new Set([...fixed.filter(Boolean), ...fromSelections, ...fromOrigin])];
}
