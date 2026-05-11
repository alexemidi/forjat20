import { useMemo, useState } from "react";
import { PERICIAS, nomePericia } from "../../../core/rules/periciasCatalogo.js";
import { filterBySearch } from "../../../shared/lib/catalogFilters.js";
import { SelectInput, TextInput } from "../../../shared/ui/TextInput.jsx";
import { calcularPericiasPersonagem } from "../model/periciasPersonagem.js";
import {
  OFICIOS,
  OriginCraftedItemDialog,
  OriginOficioPopover,
  getOficioLabel,
  getOriginValue
} from "./OriginStep.jsx";

export function RegionalOriginStep({ catalogs, draft, updateDraft }) {
  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [openOficio, setOpenOficio] = useState(null);
  const selectedOrigin = catalogs.regionalOrigins.find((origin) => getOriginValue(origin) === draft.info.origemRegionalId);
  const regionalChoices = draft.escolhas.origemRegional ?? {};
  const selectedItems = regionalChoices.itens ?? {};
  const selectedImprovements = regionalChoices.melhorias ?? {};
  const replacements = regionalChoices.periciasSubstitutas ?? {};
  const visibleOrigins = useMemo(
    () => filterBySearch(catalogs.regionalOrigins, search, [(entry) => entry.nome, (entry) => entry.regiao, (entry) => entry.beneficios?.descricao]),
    [catalogs.regionalOrigins, search]
  );
  const trainedBeforeRegional = useMemo(() => {
    const draftWithoutRegional = {
      ...draft,
      info: { ...draft.info, origemRegionalId: "" },
      escolhas: { ...draft.escolhas, origemRegional: { itens: {}, periciasSubstitutas: {}, melhorias: {} } }
    };
    return new Set(
      calcularPericiasPersonagem(draftWithoutRegional, catalogs).pericias
        .filter((pericia) => pericia.treinada)
        .map((pericia) => pericia.id)
    );
  }, [catalogs, draft]);
  const analysis = selectedOrigin ? analyzeRegionalOrigin(selectedOrigin, trainedBeforeRegional) : null;
  const itemEntries = selectedOrigin ? getRegionalItemEntries(selectedOrigin, catalogs.items, catalogs.improvements) : [];

  function setRegionalOrigin(originId) {
    updateDraft("info.origemRegionalId", originId);
    updateDraft("escolhas.origemRegional", {
      itens: {},
      periciasSubstitutas: {},
      melhorias: {}
    });
  }

  function setRegionalItem(slotId, value) {
    updateDraft(`escolhas.origemRegional.itens.${slotId}`, value);
  }

  function setRegionalReplacement(skillId, value) {
    updateDraft(`escolhas.origemRegional.periciasSubstitutas.${skillId}`, value);
  }

  function setRegionalImprovement(slotId, value) {
    updateDraft(`escolhas.origemRegional.melhorias.${slotId}`, value);
  }

  return (
    <div className="builder-step">
      <header>
        <h1 className="section-title">Origem Regional</h1>
        <p className="section-subtitle">Escolha uma origem regional. Seus benefícios são recebidos automaticamente.</p>
      </header>

      <div className="builder-form-grid">
        <SelectInput
          id="regional-origin-select"
          label="Origem regional"
          onChange={(event) => setRegionalOrigin(event.target.value)}
          value={draft.info.origemRegionalId}
        >
          <option value="">Nenhuma</option>
          {catalogs.regionalOrigins.map((origin) => (
            <option key={getOriginValue(origin)} value={getOriginValue(origin)}>
              {origin.nome}
            </option>
          ))}
        </SelectInput>
        <TextInput
          id="regional-origin-search"
          label="Buscar"
          onChange={(event) => setSearch(event.target.value)}
          value={search}
        />
      </div>

      {!selectedOrigin ? (
        <div className="data-list">
          {visibleOrigins.slice(0, 12).map((origin) => (
            <button className="data-list__row data-list__row--button" key={getOriginValue(origin)} onClick={() => setRegionalOrigin(getOriginValue(origin))} type="button">
              <strong>{origin.nome}</strong>
              <span className="muted">{origin.regiao}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Benefícios regionais</h2>
              <span className="pill">Todos</span>
            </div>
            <p className="points-note">{selectedOrigin.beneficios?.descricao}</p>
            <RegionalBenefitSummary analysis={analysis} replacements={replacements} onSetReplacement={setRegionalReplacement} />
          </section>

          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Itens</h2>
              <span className="pill">{itemEntries.length}</span>
            </div>
            <div className="origin-item-list">
              {itemEntries.map((entry) => (
                <div className={`origin-item-row${entry.interactive ? " origin-item-row--interactive" : ""}`} key={entry.id}>
                  <div>
                    <strong>{formatRegionalItemName(entry, selectedItems[entry.id])}</strong>
                    {entry.descricao ? <span>{entry.descricao}</span> : null}
                  </div>
                  {entry.kind === "oficio_instrument" ? (
                    <div className="origin-item-actions">
                      <button className="origin-item-select-button" onClick={() => setOpenOficio(openOficio === entry.id ? null : entry.id)} type="button">
                        Instrumento de ofício: {getOficioLabel(selectedItems[entry.id] || entry.oficioId).toLowerCase()}
                      </button>
                      {openOficio === entry.id ? (
                        <OriginOficioPopover
                          currentOficioId={selectedItems[entry.id] || entry.oficioId}
                          onClose={() => setOpenOficio(null)}
                          onSelect={(oficioId) => {
                            setRegionalItem(entry.id, oficioId);
                            setOpenOficio(null);
                          }}
                        />
                      ) : null}
                    </div>
                  ) : entry.kind === "shop_item" ? (
                    <div className="origin-item-actions">
                      <button className="origin-item-select-button" onClick={() => setOpenItem(openItem === entry.id ? null : entry.id)} type="button">
                        {selectedItems[entry.id] ? "Trocar item" : "Escolher item"}
                      </button>
                      {openItem === entry.id ? (
                        <OriginCraftedItemDialog
                          currentItemId={selectedItems[entry.id] ?? ""}
                          entry={entry}
                          onClose={() => setOpenItem(null)}
                          onSelect={(itemId) => {
                            setRegionalItem(entry.id, itemId);
                            setOpenItem(null);
                          }}
                        />
                      ) : null}
                    </div>
                  ) : entry.options?.length ? (
                    <select onChange={(event) => setRegionalItem(entry.id, event.target.value)} value={selectedItems[entry.id] ?? ""}>
                      <option value="">Escolha</option>
                      {entry.options.map((option) => (
                        <option key={option.id} value={option.id}>{option.nome}</option>
                      ))}
                    </select>
                  ) : entry.kind === "superior_item" ? (
                    <div className="origin-item-actions">
                      {selectedItems[entry.id] ? (
                        <select onChange={(event) => setRegionalImprovement(entry.id, event.target.value)} value={selectedImprovements[entry.id] ?? ""}>
                          <option value="">Escolher melhoria</option>
                          {getEntryImprovementOptions(entry, selectedItems[entry.id], catalogs.improvements).map((improvement) => (
                            <option key={improvement.id} value={improvement.id}>{improvement.nome}</option>
                          ))}
                        </select>
                      ) : null}
                      <button className="origin-item-select-button" onClick={() => setOpenItem(openItem === entry.id ? null : entry.id)} type="button">
                        {selectedItems[entry.id] ? "Trocar item" : "Escolher item"}
                      </button>
                      {openItem === entry.id ? (
                        <OriginCraftedItemDialog
                          currentItemId={selectedItems[entry.id] ?? ""}
                          entry={entry}
                          onClose={() => setOpenItem(null)}
                          onSelect={(itemId) => {
                            setRegionalItem(entry.id, itemId);
                            setOpenItem(null);
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function RegionalBenefitSummary({ analysis, replacements, onSetReplacement }) {
  if (!analysis) return null;
  const trained = analysis.trainedSkills.filter((skill) => skill.id !== "oficio");
  const oficios = analysis.trainedOficios;
  const repeated = analysis.repeatedSkills;
  return (
    <div className="class-ability-list">
      {trained.length || oficios.length ? (
        <article className="class-ability">
          <div className="class-ability__header">
            <strong>Perícias treinadas</strong>
            <span>{trained.length + oficios.length}</span>
          </div>
          <div className="choice-button-grid">
            {trained.map((skill) => <button className="choice-button choice-button--active" disabled key={skill.id} type="button">{nomePericia(skill.id)}</button>)}
            {oficios.map((oficioId) => <button className="choice-button choice-button--active" disabled key={oficioId} type="button">Ofício ({getOficioLabel(oficioId).toLowerCase()})</button>)}
          </div>
        </article>
      ) : null}
      {repeated.map((skill) => (
        <article className="class-ability" key={`repeat-${skill.id}`}>
          <div className="class-ability__header">
            <strong>{nomePericia(skill.id)} repetida</strong>
            <span>Escolha outra perícia</span>
          </div>
          <p className="points-note">A origem regional concede uma perícia que você já tinha. Escolha qualquer outra perícia ainda não treinada.</p>
          <div className="choice-button-grid">
            {skill.replacementOptions.map((option) => (
              <button
                className={`choice-button${replacements[skill.id] === option.id ? " choice-button--active" : ""}`}
                key={option.id}
                onClick={() => onSetReplacement(skill.id, option.id)}
                type="button"
              >
                {option.nome}
              </button>
            ))}
          </div>
        </article>
      ))}
      {analysis.skillBonuses.length ? (
        <article className="class-ability">
          <div className="class-ability__header">
            <strong>Bônus em perícias</strong>
            <span>{analysis.skillBonuses.length}</span>
          </div>
          <div className="origin-benefit-grid origin-benefit-grid--skills">
            {analysis.skillBonuses.map((bonus, index) => (
              <button className="choice-button choice-button--active" disabled key={`${bonus.id}-${index}`} type="button">
                {bonus.valor > 0 ? `+${bonus.valor}` : bonus.valor} {nomePericia(bonus.id)}
              </button>
            ))}
          </div>
        </article>
      ) : null}
      {analysis.proficiencies.length ? (
        <article className="class-ability">
          <div className="class-ability__header">
            <strong>Proficiências</strong>
            <span>{analysis.proficiencies.length}</span>
          </div>
          {analysis.proficiencies.map((entry, index) => <p key={index}>{entry}</p>)}
        </article>
      ) : null}
      {analysis.consideredTrained.length ? (
        <article className="class-ability">
          <div className="class-ability__header">
            <strong>Testes liberados sem treino</strong>
            <span>{analysis.consideredTrained.length}</span>
          </div>
          <p>{analysis.consideredTrained.map((id) => nomePericia(id)).join(", ")}</p>
        </article>
      ) : null}
    </div>
  );
}

export function analyzeRegionalOrigin(origin, trainedBeforeRegional = new Set()) {
  const description = origin?.beneficios?.descricao ?? "";
  const trainedIds = extractTrainedSkills(description);
  const trainedOficios = extractTrainedOficios(description);
  const skillBonuses = [
    ...extractSkillBonuses(description),
    ...(origin.itens ?? []).flatMap((itemText) => extractSkillBonuses(itemText))
  ];
  const consideredTrained = extractConsideredTrainedSkills(description);
  const repeatedSkills = trainedIds
    .filter((id) => trainedBeforeRegional.has(id))
    .map((id) => ({
      id,
      replacementOptions: PERICIAS.filter((pericia) => !trainedBeforeRegional.has(pericia.id) && !trainedIds.includes(pericia.id))
    }));
  return {
    trainedSkills: trainedIds.map((id) => ({ id })),
    trainedOficios,
    skillBonuses,
    consideredTrained,
    repeatedSkills,
    proficiencies: extractProficiencies(description)
  };
}

export function getRegionalGrantedSkills(origin, choices = {}, trainedBeforeRegional = new Set()) {
  const analysis = analyzeRegionalOrigin(origin, trainedBeforeRegional);
  const replacements = choices.periciasSubstitutas ?? {};
  return new Set([
    ...analysis.trainedSkills.map((skill) => skill.id).filter((id) => !trainedBeforeRegional.has(id)),
    ...Object.values(replacements).filter(Boolean)
  ]);
}

export function getRegionalGrantedOficios(origin) {
  return analyzeRegionalOrigin(origin).trainedOficios;
}

export function getRegionalSkillBonuses(origin) {
  return analyzeRegionalOrigin(origin).skillBonuses;
}

export function getRegionalConsideredTrainedSkills(origin) {
  return analyzeRegionalOrigin(origin).consideredTrained;
}

function getRegionalItemEntries(origin, items, improvements) {
  return (origin.itens ?? []).map((text, index) => {
    const id = `item_${index}`;
    const quantity = extractQuantity(text);
    const oficioId = extractInstrumentOficio(text);
    if (oficioId) {
      return { id, kind: "oficio_instrument", nome: `Instrumentos de Ofício (${getOficioLabel(oficioId).toLowerCase()})`, descricao: text, oficioId, interactive: true };
    }
    if (isSuperiorItemText(text)) {
      const fixed = findFixedItemFromText(text, items);
      return {
        id,
        kind: "superior_item",
        nome: text,
        descricao: "Escolha o item superior. A melhoria será tratada como melhoria de item.",
        maxPrice: null,
        catalog: getRegionalSuperiorCatalog(items, improvements, fixed),
        interactive: true
      };
    }
    const shopEntry = getRegionalShopEntry(text, items);
    if (shopEntry) return { id, ...shopEntry, interactive: true };
    const options = getRegionalItemOptions(text, items);
    if (options.length > 1) return { id, nome: text, descricao: "Escolha uma das opções recebidas.", options, quantity, interactive: true };
    const fixedItem = options[0] ?? findFixedItemFromText(text, items);
    return { id, nome: fixedItem?.nome ?? text, itemId: fixedItem?.id ?? "", quantidade: quantity, descricao: fixedItem ? text : "Item especial fora do catálogo; adicione manualmente se precisar de estatísticas.", options: [] };
  });
}

function getRegionalSuperiorCatalog(items, improvements, fixedItem) {
  const baseItems = fixedItem ? [fixedItem] : items.filter((item) => ["arma", "armadura", "escudo"].includes(item.tipo));
  const enhanced = baseItems
    .filter((item) => getCompatibleImprovements(item, improvements).length)
    .map((item) => ({ ...item, price: getItemPriceValue(item) }));
  return {
    weapons: enhanced.filter((item) => item.tipo === "arma"),
    armors: enhanced.filter((item) => item.tipo === "armadura"),
    shields: enhanced.filter((item) => item.tipo === "escudo"),
    general: [],
    guidance: "Escolha o item superior. Melhorias de material especial ficam fora desta escolha."
  };
}

function getRegionalShopEntry(text, items) {
  const normalized = normalizeText(text);
  const maxPrice = extractPriceLimit(text);
  if ((normalized.includes("presente de despedida") || normalized.includes("item qualquer")) && maxPrice) {
    return {
      kind: "shop_item",
      nome: text,
      descricao: `Escolha qualquer item com preço até T$ ${maxPrice}.`,
      maxPrice,
      catalog: getAnyRegionalItemCatalog(items, maxPrice)
    };
  }
  const weaponCatalog = getRegionalWeaponCatalog(text, items);
  if (!weaponCatalog) return null;
  return {
    kind: "shop_item",
    nome: text,
    descricao: weaponCatalog.guidance,
    maxPrice: null,
    catalog: weaponCatalog
  };
}

function getAnyRegionalItemCatalog(items, maxPrice) {
  const available = items
    .filter((item) => ["arma", "armadura", "escudo", "item_geral"].includes(item.tipo))
    .filter((item) => !maxPrice || getItemPriceValue(item) <= maxPrice)
    .map((item) => ({ ...item, price: getItemPriceValue(item) }));
  return {
    weapons: available.filter((item) => item.tipo === "arma"),
    armors: available.filter((item) => item.tipo === "armadura"),
    shields: available.filter((item) => item.tipo === "escudo"),
    general: available.filter((item) => item.tipo === "item_geral"),
    guidance: maxPrice ? `Escolha qualquer item com preço até T$ ${maxPrice}.` : "Escolha um item."
  };
}

function getRegionalWeaponCatalog(text, items) {
  const normalized = normalizeText(text);
  const categories = [];
  if (normalized.includes("arma simples")) categories.push("simples");
  if (normalized.includes("arma marcial")) categories.push("marcial");
  if (normalized.includes("exotica")) categories.push("exotica");
  if (!categories.length) return null;
  const weapons = items
    .filter((item) => item.tipo === "arma" && categories.includes(item.categoriaId))
    .map((item) => ({ ...item, price: getItemPriceValue(item) }));
  if (!weapons.length) return null;
  return {
    weapons,
    armors: [],
    shields: [],
    general: [],
    guidance: `Escolha ${formatRegionalWeaponGuidance(categories)}.`
  };
}

function formatRegionalWeaponGuidance(categories) {
  const labels = categories.map((category) => ({ simples: "uma arma simples", marcial: "uma arma marcial", exotica: "uma arma exótica" })[category] ?? category);
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} ou ${labels.at(-1)}`;
}

function getCompatibleImprovements(item, improvements) {
  return (improvements ?? []).filter((improvement) => {
    const allowed = improvement.categoriasIds ?? improvement.aplicavelA ?? improvement.aplicacao?.tipos ?? [];
    return !allowed.length || allowed.includes(item.tipo) || allowed.includes(item.categoriaId);
  });
}

function getEntryImprovementOptions(entry, selectedItemId, improvements) {
  const item = [...(entry.catalog?.weapons ?? []), ...(entry.catalog?.armors ?? []), ...(entry.catalog?.shields ?? [])]
    .find((option) => option.id === selectedItemId);
  return item ? getCompatibleImprovements(item, improvements).filter((improvement) => !isSpecialMaterialImprovement(improvement)) : [];
}

function isSpecialMaterialImprovement(improvement) {
  const marker = normalizeText(`${improvement.nome} ${improvement.id} ${improvement.categoria ?? ""}`);
  return marker.includes("material") || marker.includes("aco_rubi") || marker.includes("mitral") || marker.includes("madeira tollon");
}

function getRegionalItemOptions(text, items) {
  const normalized = normalizeText(text);
  if (normalized.includes("escudo leve ou pesado")) return items.filter((item) => item.tipo === "escudo").map(toItemOption);
  if (normalized.includes("cota de malha ou escudo pesado")) return ["cota_de_malha", "escudo_pesado"].map((id) => items.find((item) => item.id === id)).filter(Boolean).map(toItemOption);
  if (normalized.includes("arco longo ou katana")) return ["arco_longo", "katana"].map((id) => items.find((item) => item.id === id)).filter(Boolean).map(toItemOption);
  if (normalized.includes("camisa bufante ou traje de seda")) return ["camisa_bufante", "traje_de_seda"].map((id) => items.find((item) => item.id === id)).filter(Boolean).map(toItemOption);
  return [];
}

function toItemOption(item) {
  return { id: item.id, nome: item.nome };
}

function formatRegionalItemName(entry, selectedValue) {
  if (entry.kind === "oficio_instrument") return `Instrumentos de Ofício (${getOficioLabel(selectedValue || entry.oficioId).toLowerCase()})`;
  if (selectedValue && entry.options?.length) return entry.options.find((option) => option.id === selectedValue)?.nome ?? entry.nome;
  if (selectedValue && entry.kind === "superior_item") {
    const item = [...(entry.catalog?.weapons ?? []), ...(entry.catalog?.armors ?? []), ...(entry.catalog?.shields ?? [])].find((option) => option.id === selectedValue);
    return item ? `${item.nome} superior` : entry.nome;
  }
  if (selectedValue && entry.kind === "shop_item") {
    const item = [
      ...(entry.catalog?.weapons ?? []),
      ...(entry.catalog?.armors ?? []),
      ...(entry.catalog?.shields ?? []),
      ...(entry.catalog?.general ?? [])
    ].find((option) => option.id === selectedValue);
    return item?.nome ?? entry.nome;
  }
  return entry.nome;
}

function extractTrainedSkills(description) {
  const match = normalizeText(description).match(/treinad[oa] em ([^.]+)/);
  if (!match) return [];
  return splitSkillList(match[1].replace(/\b(e recebe|e possui|e pode|quando|alem disso|como usa).*/u, ""));
}

function extractTrainedOficios(description) {
  return [...description.matchAll(/Ofício\s*\(([^)]+)\)/gi)]
    .map((match) => normalizeId(match[1]))
    .filter(Boolean);
}

function extractSkillBonuses(description) {
  const bonuses = [];
  const normalized = normalizeText(description);
  for (const match of normalized.matchAll(/([+-]\d+)\s+em(?: testes de)?\s+([^.,;]+)/g)) {
    const valor = Number(match[1]);
    splitSkillList(match[2]).forEach((id) => bonuses.push({ id, valor }));
  }
  for (const match of normalized.matchAll(/fornece\s+([+-]\d+)\s+em testes de\s+([^.,;]+)/g)) {
    const valor = Number(match[1]);
    splitSkillList(match[2]).forEach((id) => bonuses.push({ id, valor }));
  }
  return bonuses.filter((bonus, index, list) => list.findIndex((entry) => entry.id === bonus.id && entry.valor === bonus.valor) === index);
}

function extractConsideredTrainedSkills(description) {
  const normalized = normalizeText(description);
  const result = [];
  if (normalized.includes("misticismo sem treino")) result.push("misticismo");
  if (normalized.includes("conhecimento e nobreza") && normalized.includes("mesmo sem treinamento")) result.push("conhecimento", "nobreza");
  return result;
}

function extractProficiencies(description) {
  return [...description.matchAll(/profici[êe]ncia(?: com| em)\s+([^.;]+)/gi)].map((match) => match[0]);
}

function splitSkillList(value) {
  return String(value ?? "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s*,\s*|\s+e\s+/)
    .map((entry) => normalizeId(entry))
    .filter((id) => PERICIAS.some((pericia) => pericia.id === id));
}

function extractInstrumentOficio(text) {
  const match = text.match(/Instrumentos de Ofício\s*\(([^)]+)\)/i);
  return match ? normalizeId(match[1]) : "";
}

function extractQuantity(text) {
  const match = normalizeText(text).match(/\bx\s*(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

function extractPriceLimit(text) {
  const match = normalizeText(text).match(/t\$\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function isSuperiorItemText(text) {
  const normalized = normalizeText(text);
  return normalized.includes("superior") && normalized.includes("melhoria");
}

function findFixedItemFromText(text, items) {
  const clean = normalizeText(text).replace(/\([^)]*\)/g, "");
  return items.find((item) => clean.includes(normalizeText(item.nome)));
}

function getItemPriceValue(item) {
  const value = Number(item.preco?.valor);
  return Number.isFinite(value) ? value : 0;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeId(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
