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
  const origem = catalogs.origins?.find((origin) => (origin.id ?? origin.nome) === draft.info.origemId);
  const attrs = options.attrs ?? aplicarBonusAtributosOrigem(calcularAtributosComEscolhas(draft.atributosBase, race, raceChoices), draft, origem);
  const nivel = Number(draft.info.nivel ?? 1);
  const escolhasClasse = draft.escolhas.classe ?? {};
  const escolhasOrigem = draft.escolhas.origem ?? {};
  const escolhasOrigemRegional = draft.escolhas.origemRegional ?? {};
  const origemRegional = catalogs.regionalOrigins?.find((origin) => (origin.id ?? origin.nome) === draft.info.origemRegionalId);
  const bonusNivelPericia = calcularBonusNivelPericia(nivel);
  const bonusTamanhoFurtividade = Number(options.bonusTamanhoFurtividade ?? 0);

  const fixasClasse = new Set((classe?.caracteristicas?.pericias?.fixas ?? []).filter((p) => p.id && p.id !== "oficio").map((p) => p.id));
  const fixasEscolhidasClasse = new Set(Object.values(escolhasClasse.periciasFixas ?? {}).filter(Boolean).map(getPericiaBaseId));
  const periciasEscolhidasRaca = new Set((escolhasClasse.periciasRaca ?? []).map(getPericiaBaseId));
  const periciasEscolhidasClasse = new Set((escolhasClasse.periciasClasse ?? []).map(getPericiaBaseId));
  const periciasInteligenciaClasse = new Set((escolhasClasse.periciasInteligencia ?? []).map(getPericiaBaseId));
  const periciasOrigem = new Set(getPericiasOrigemSelecionadas(escolhasOrigem));
  const periciasConcedidasEscolhasClasse = getClassChoiceGrantedSkills(classe, escolhasClasse, nivel);
  const treinadasRaciais = race ? coletarPericiasTreinadasRaciais(race, raceChoices) : new Set();
  const treinadasAntesRegional = new Set([
    ...fixasClasse,
    ...fixasEscolhidasClasse,
    ...periciasEscolhidasRaca,
    ...periciasEscolhidasClasse,
    ...periciasInteligenciaClasse,
    ...periciasOrigem,
    ...periciasConcedidasEscolhasClasse,
    ...treinadasRaciais
  ]);
  const periciasRegionais = getPericiasRegionais(origemRegional, escolhasOrigemRegional, treinadasAntesRegional);
  const oficiosSelecionados = getSelectedOficios(escolhasClasse, escolhasOrigem, origemRegional);
  const bonusRegional = getBonusPericiasRegionais(origemRegional);
  const bonusOrigem = getBonusPericiasOrigem(origem, escolhasOrigem);
  const consideradasSemTreino = getPericiasConsideradasTreinadasRegionais(origemRegional);
  const bonusRacial = race ? calcularBonusPericiasRaciais(race, raceChoices) : {};
  const bonusPericiasItens = coletarBonusPericiasMelhorias(draft, catalogs);

  const pericias = PERICIAS.flatMap((pericia) => {
    const treinada =
      fixasClasse.has(pericia.id) ||
      (pericia.id === "oficio" && oficiosSelecionados.length > 0) ||
      fixasEscolhidasClasse.has(pericia.id) ||
      periciasEscolhidasRaca.has(pericia.id) ||
      periciasEscolhidasClasse.has(pericia.id) ||
      periciasInteligenciaClasse.has(pericia.id) ||
      periciasOrigem.has(pericia.id) ||
      periciasRegionais.has(pericia.id) ||
      periciasConcedidasEscolhasClasse.has(pericia.id) ||
      treinadasRaciais.has(pericia.id);
    const atributoValor = Number(attrs[pericia.atributo] ?? 0);
    const racial = Number(bonusRacial[pericia.id] ?? 0);
    const regional = Number(bonusRegional[pericia.id] ?? 0);
    const origemBonus = Number(bonusOrigem[pericia.id] ?? 0);
    const tamanho = pericia.id === "furtividade" ? bonusTamanhoFurtividade : 0;
    const liberadaSemTreino = consideradasSemTreino.has(pericia.id);
    const bloqueada = Boolean(pericia.requerTreinamento && !treinada && !liberadaSemTreino);
    const bonusItem = bloqueada ? 0 : Number(bonusPericiasItens[pericia.id] ?? 0);
    const bonusDiversos = racial + regional + origemBonus + tamanho + bonusItem;
    const bonusTreino = calcularBonusTreinamentoPericia(nivel, treinada);
    const total = bloqueada
      ? bonusDiversos
      : calcularTotalPericia({ atributo: atributoValor, nivel, treinada, bonusDiversos });

    const base = {
      ...pericia,
      treinada,
      consideradaSemTreino: liberadaSemTreino,
      bloqueada,
      atributoValor,
      bonusNivel: bonusNivelPericia,
      bonusTreino,
      bonusItem,
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

function getClassChoiceGrantedSkills(classe, classChoices = {}, nivel = 1) {
  const granted = [];
  if (classChoices.arcanista?.linhagemId === "linhagem_feerica") granted.push("enganacao");
  collectDirectClassAbilityGrantedSkills(classe, nivel).forEach((periciaId) => granted.push(periciaId));
  collectClassAbilityChoiceOptions(classe, classChoices, nivel).forEach((option) => {
    if (option.pericia?.id) granted.push(option.pericia.id);
    if (isPericiaId(option.id)) granted.push(option.id);
    if (String(option.id ?? "").startsWith("oficio_")) granted.push("oficio");
  });
  return new Set(granted);
}

function collectDirectClassAbilityGrantedSkills(classe, nivel = 1) {
  return (classe?.habilidades ?? [])
    .filter((ability) => Number(ability.nivel ?? 1) <= Number(nivel ?? 1))
    .flatMap((ability) => ability.efeitos ?? [])
    .filter((effect) => effect.tipo === "treinar_pericia" && effect.periciaId)
    .map((effect) => effect.periciaId);
}

function collectClassAbilityChoiceOptions(classe, classChoices = {}, nivel = 1) {
  const selectedByAbility = classChoices.habilidades ?? {};
  return (classe?.habilidades ?? [])
    .filter((ability) => Number(ability.nivel ?? 1) <= Number(nivel ?? 1))
    .flatMap((ability) => {
      const selectedByChoice = selectedByAbility[ability.id] ?? {};
      return (ability.escolhas ?? []).flatMap((choice) => {
        const selected = selectedByChoice[choice.id];
        const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];
        return selectedIds
          .map((id) => (choice.opcoes ?? []).find((option) => getChoiceOptionId(option) === id))
          .filter(Boolean)
          .map(normalizeClassChoiceOption);
      });
    });
}

function getChoiceOptionId(option) {
  return typeof option === "string" ? option : option?.id ?? option?.nome;
}

function normalizeClassChoiceOption(option) {
  return typeof option === "string" ? { id: option } : option;
}

function isPericiaId(value) {
  return PERICIAS.some((pericia) => pericia.id === value);
}

function coletarBonusPericiasMelhorias(draft, catalogs) {
  const bonus = {};
  getSelectedPrototypeImprovementIds(draft).forEach((melhoriaId) => {
    const melhoria = catalogs.improvements?.find((item) => item.id === melhoriaId);
    (melhoria?.efeitos ?? []).forEach((efeito) => {
      if (efeito.tipo === "bonus_pericia" && efeito.periciaId) {
        bonus[efeito.periciaId] = Number(bonus[efeito.periciaId] ?? 0) + Number(efeito.bonus ?? 0);
      }
      if (efeito.tipo === "penalidade_pericia" && efeito.periciaId) {
        bonus[efeito.periciaId] = Number(bonus[efeito.periciaId] ?? 0) + Number(efeito.penalidade ?? 0);
      }
    });
  });
  return bonus;
}

function getSelectedPrototypeImprovementIds(draft) {
  const itemSuperior = draft.escolhas?.classe?.prototipo?.itemSuperior ?? {};
  const prototypeIds = Array.isArray(itemSuperior.melhoriaIds)
    ? itemSuperior.melhoriaIds.filter(Boolean)
    : itemSuperior.melhoriaId ? [itemSuperior.melhoriaId] : [];
  const regionalIds = Object.values(draft.escolhas?.origemRegional?.melhorias ?? {}).filter(Boolean);
  const originBudgetIds = Object.values(draft.escolhas?.origem?.itens ?? {})
    .filter(Array.isArray)
    .flatMap((items) => items.flatMap((item) => item.melhoriaIds ?? []))
    .filter(Boolean);
  return [...prototypeIds, ...regionalIds, ...originBudgetIds];
}

function getPericiasOrigemSelecionadas(escolhasOrigem = {}) {
  return (escolhasOrigem.beneficios ?? [])
    .filter((id) => String(id).startsWith("pericia:"))
    .map((id) => {
      const value = String(id).slice("pericia:".length);
      return normalizarPericiaId(value.split(":")[0]);
    });
}

function getPericiasRegionais(origemRegional, escolhasOrigemRegional = {}, treinadasAntesRegional = new Set()) {
  if (!origemRegional) return new Set();
  const trained = extractRegionalTrainedSkills(origemRegional.beneficios?.descricao ?? "")
    .filter((id) => !treinadasAntesRegional.has(id));
  const replacements = Object.values(escolhasOrigemRegional.periciasSubstitutas ?? {}).filter(Boolean);
  return new Set([...trained, ...replacements]);
}

function getBonusPericiasRegionais(origemRegional) {
  if (!origemRegional) return {};
  const bonus = {};
  [
    ...(extractRegionalSkillBonuses(origemRegional.beneficios?.descricao ?? "")),
    ...(origemRegional.itens ?? []).flatMap((itemText) => extractRegionalSkillBonuses(itemText))
  ].forEach((entry) => {
    bonus[entry.id] = Number(bonus[entry.id] ?? 0) + Number(entry.valor ?? 0);
  });
  return bonus;
}

function getBonusPericiasOrigem(origem, escolhasOrigem = {}) {
  if (!origem) return {};
  const bonus = {};
  (origem.itens ?? [])
    .filter((itemText) => !normalizarPericiaId(itemText).includes("colecao_de_livros"))
    .flatMap((itemText) => extractRegionalSkillBonuses(itemText))
    .forEach((entry) => {
      bonus[entry.id] = Number(bonus[entry.id] ?? 0) + Number(entry.valor ?? 0);
    });
  Object.values(escolhasOrigem.itens ?? {}).forEach((value) => {
    const periciaId = getSkillBonusFromOriginItemChoice(value);
    if (periciaId) bonus[periciaId] = Number(bonus[periciaId] ?? 0) + 1;
  });
  return bonus;
}

function getSkillBonusFromOriginItemChoice(value) {
  const id = String(value ?? "");
  if (!id.startsWith("colecao_de_livros:")) return "";
  return normalizarPericiaId(id.split(":").at(-1));
}

function aplicarBonusAtributosOrigem(attrs, draft, origem) {
  const result = { ...attrs };
  if (normalizarPericiaId(origem?.nome) === "forasteiro" && draft.escolhas?.origem?.aprovacoes?.forasteiroCarisma) {
    result.car = Number(result.car ?? 0) + 1;
  }
  return result;
}

function getPericiasConsideradasTreinadasRegionais(origemRegional) {
  if (!origemRegional) return new Set();
  const description = normalizeText(origemRegional.beneficios?.descricao ?? "");
  const result = [];
  if (description.includes("misticismo sem treino")) result.push("misticismo");
  if (description.includes("conhecimento e nobreza") && description.includes("mesmo sem treinamento")) result.push("conhecimento", "nobreza");
  return new Set(result);
}

function extractRegionalTrainedSkills(description) {
  const normalized = normalizeText(description);
  const match = normalized.match(/treinad[oa] em ([^.]+)/);
  if (!match) return [];
  return splitRegionalSkillList(match[1].replace(/\b(e recebe|e possui|e pode|quando|alem disso|como usa).*/u, ""));
}

function extractRegionalSkillBonuses(description) {
  const bonuses = [];
  const normalized = normalizeText(description);
  for (const match of normalized.matchAll(/([+-]\d+)\s+em(?: testes de)?\s+([^.,;]+)/g)) {
    const valor = Number(match[1]);
    splitRegionalSkillList(match[2]).forEach((id) => bonuses.push({ id, valor }));
  }
  for (const match of normalized.matchAll(/fornece\s+([+-]\d+)\s+em testes de\s+([^.,;]+)/g)) {
    const valor = Number(match[1]);
    splitRegionalSkillList(match[2]).forEach((id) => bonuses.push({ id, valor }));
  }
  return bonuses.filter((bonus, index, list) => list.findIndex((entry) => entry.id === bonus.id && entry.valor === bonus.valor) === index);
}

function splitRegionalSkillList(value) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s*,\s*|\s+e\s+/)
    .map((entry) => normalizarPericiaId(entry))
    .filter((id) => PERICIAS.some((pericia) => pericia.id === id));
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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getSelectedOficios(classChoices = {}, originChoices = {}, origemRegional = null) {
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
  const fromAbilityChoices = Object.values(classChoices.habilidades ?? {})
    .flatMap((choiceMap) => Object.values(choiceMap ?? {}))
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((id) => String(id).startsWith("oficio_"))
    .map((id) => String(id).slice("oficio_".length));
  const fromRegional = [...(origemRegional?.beneficios?.descricao ?? "").matchAll(/Ofício\s*\(([^)]+)\)/gi)]
    .map((match) => normalizarPericiaId(match[1]))
    .filter(Boolean);
  return [...new Set([...fixed.filter(Boolean), ...fromSelections, ...fromOrigin, ...fromAbilityChoices, ...fromRegional])];
}
