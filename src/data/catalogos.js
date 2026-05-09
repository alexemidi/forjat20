import { cleanText } from "../shared/lib/text.js";

export const books = [
  { id: "basico", nome: "Básico" },
  { id: "herois_de_arton", nome: "Heróis de Arton" },
  { id: "ameacas_de_arton", nome: "Ameaças de Arton" },
  { id: "deuses_de_arton", nome: "Deuses de Arton" },
  { id: "dragao_brasil", nome: "Dragão Brasil" }
];

export const creationPages = [
  { id: "raca-atributos", titulo: "Raça e Atributos" },
  { id: "classe", titulo: "Classe" },
  { id: "origem", titulo: "Origem" },
  { id: "origem-regional", titulo: "Origem Regional" },
  { id: "divindade", titulo: "Divindade" },
  { id: "equipamento", titulo: "Equipamento" },
  { id: "magias", titulo: "Magias" },
  { id: "revisao", titulo: "Revisão" }
];

export async function loadCatalogs() {
  const [
    races,
    classes,
    origensData,
    origensRegionaisData,
    deusesData,
    poderesData,
    poderesClasseData,
    itensData,
    melhoriasData,
    magias
  ] = await Promise.all([
    import("../../races_update.json"),
    import("../../classes_full.json"),
    import("../../origens.json"),
    import("../../origem_regional.json"),
    import("../../deuses.json"),
    import("../../poderes_gerais.json"),
    import("../../poderes_classe.json"),
    import("../../itens.json"),
    import("../../melhorias.json"),
    import("../../magias.json")
  ]);

  return {
    races: cleanCatalog(races.default),
    classes: cleanCatalog(classes.default),
    origins: cleanCatalog(origensData.default.origens ?? []),
    regionalOrigins: cleanCatalog(origensRegionaisData.default.origens_regionais ?? []),
    gods: cleanCatalog(deusesData.default.deuses ?? []),
    powers: cleanCatalog(flattenCatalogGroups(poderesData.default.poderes ?? [])),
    classPowers: cleanCatalog(flattenCatalogGroups(poderesClasseData.default.poderesClasse ?? [])),
    personalStrikeEffects: cleanCatalog(poderesClasseData.default.golpePessoalEfeitos ?? []),
    items: cleanCatalog(itensData.default.itens ?? []),
    improvements: cleanCatalog(melhoriasData.default.melhorias ?? []),
    specialMaterials: cleanCatalog(melhoriasData.default.materiaisEspeciais ?? []),
    spells: cleanCatalog(magias.default)
  };
}

function flattenCatalogGroups(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((group) => (Array.isArray(group) ? group : []));
}

function cleanCatalog(value) {
  return deepMap(value, (entry) => (typeof entry === "string" ? cleanText(entry) : entry));
}

function deepMap(value, fn) {
  if (Array.isArray(value)) return value.map((item) => deepMap(item, fn));
  if (!value || typeof value !== "object") return fn(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, itemValue]) => [key, deepMap(itemValue, fn)])
  );
}
