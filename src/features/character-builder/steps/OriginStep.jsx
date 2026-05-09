import { useMemo, useState } from "react";
import { filterBySearch } from "../../../shared/lib/catalogFilters.js";
import { SelectInput, TextInput } from "../../../shared/ui/TextInput.jsx";
import { calcularPericiasPersonagem } from "../model/periciasPersonagem.js";

const BENEFIT_LIMIT = 2;

export function OriginStep({ catalogs, draft, updateDraft }) {
  const [search, setSearch] = useState("");
  const [openOriginOficio, setOpenOriginOficio] = useState(null);
  const [openOriginItemOficio, setOpenOriginItemOficio] = useState(null);
  const [openOriginCraftedItem, setOpenOriginCraftedItem] = useState(null);
  const selectedOrigin = catalogs.origins.find((origin) => getOriginValue(origin) === draft.info.origemId);
  const selectedBenefits = draft.escolhas.origem?.beneficios ?? [];
  const selectedItems = draft.escolhas.origem?.itens ?? {};
  const visibleOrigins = useMemo(
    () => filterBySearch(catalogs.origins, search, [(entry) => entry.nome]),
    [catalogs.origins, search]
  );
  const trainedBeforeOrigin = useMemo(() => {
    const draftWithoutOriginBenefits = {
      ...draft,
      escolhas: {
        ...draft.escolhas,
        origem: {
          ...(draft.escolhas.origem ?? {}),
          beneficios: []
        }
      }
    };
    return new Set(
      calcularPericiasPersonagem(draftWithoutOriginBenefits, catalogs).pericias
        .filter((pericia) => pericia.treinada)
        .map((pericia) => pericia.id)
    );
  }, [catalogs, draft]);
  const selectedCharacterOficios = useMemo(() => {
    return calcularPericiasPersonagem(draft, catalogs).pericias
      .filter((pericia) => pericia.treinada && String(pericia.id).startsWith("oficio:"))
      .map((pericia) => String(pericia.id).slice("oficio:".length));
  }, [catalogs, draft]);

  function setOrigin(originId) {
    updateDraft("info.origemId", originId);
    updateDraft("escolhas.origem", {
      beneficios: [],
      itens: {}
    });
  }

  function toggleBenefit(benefit) {
    if (benefit.isOficio) return;
    const benefitId = benefit.id;
    if (selectedBenefits.includes(benefitId)) {
      updateDraft("escolhas.origem.beneficios", selectedBenefits.filter((id) => id !== benefitId));
      return;
    }
    if (benefit.disabled) return;
    if (selectedBenefits.length >= BENEFIT_LIMIT) return;
    updateDraft("escolhas.origem.beneficios", [...selectedBenefits, benefitId]);
  }

  function setOriginItem(slotId, itemId) {
    updateDraft(`escolhas.origem.itens.${slotId}`, itemId);
  }

  function setOriginOficio(benefit, oficioId) {
    const prefix = `${benefit.id}:`;
    const nextId = `${prefix}${oficioId}`;
    const withoutOficio = selectedBenefits.filter((id) => id !== benefit.id && !String(id).startsWith(prefix));
    if (withoutOficio.length >= BENEFIT_LIMIT) return;
    updateDraft("escolhas.origem.beneficios", [...withoutOficio, nextId]);
    setOpenOriginOficio(null);
  }

  function removeOriginOficio(benefit) {
    const prefix = `${benefit.id}:`;
    updateDraft("escolhas.origem.beneficios", selectedBenefits.filter((id) => id !== benefit.id && !String(id).startsWith(prefix)));
    setOpenOriginOficio(null);
  }

  const benefits = selectedOrigin ? getOriginBenefits(selectedOrigin, catalogs.powers, trainedBeforeOrigin) : [];
  const skillBenefits = benefits.filter((benefit) => benefit.kind === "pericia");
  const powerBenefits = benefits.filter((benefit) => benefit.kind !== "pericia");
  const itemEntries = selectedOrigin ? getOriginItemEntries(selectedOrigin, catalogs.items, selectedCharacterOficios) : [];

  return (
    <div className="builder-step">
      <header>
        <h1 className="section-title">Origem</h1>
        <p className="section-subtitle">Escolha a origem, dois benefícios e confira os itens recebidos.</p>
      </header>

      <div className="builder-form-grid">
        <SelectInput
          id="origin-select"
          label="Origem"
          onChange={(event) => setOrigin(event.target.value)}
          value={draft.info.origemId}
        >
          <option value="">Selecione</option>
          {catalogs.origins.map((origin) => (
            <option key={getOriginValue(origin)} value={getOriginValue(origin)}>
              {origin.nome}
            </option>
          ))}
        </SelectInput>
        <TextInput
          id="origin-search"
          label="Buscar"
          onChange={(event) => setSearch(event.target.value)}
          value={search}
        />
      </div>

      {!selectedOrigin ? (
        <div className="data-list">
          {visibleOrigins.slice(0, 12).map((origin) => (
            <button className="data-list__row data-list__row--button" key={getOriginValue(origin)} onClick={() => setOrigin(getOriginValue(origin))} type="button">
              <strong>{origin.nome}</strong>
              <span className="muted">{formatOriginPreview(origin)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Benefícios</h2>
              <span className="pill">{selectedBenefits.length}/{BENEFIT_LIMIT}</span>
            </div>
            <p className="points-note">Escolha dois benefícios: perícias, poderes gerais ou o poder único da origem.</p>
            <OriginBenefitGrid
              benefits={skillBenefits}
              onRemoveOficio={removeOriginOficio}
              onSelectOficio={setOriginOficio}
              onToggle={toggleBenefit}
              openOficio={openOriginOficio}
              selectedBenefits={selectedBenefits}
              setOpenOficio={setOpenOriginOficio}
              skill
            />
            {powerBenefits.length ? (
              <>
                <div className="origin-benefit-separator" />
                <OriginBenefitGrid benefits={powerBenefits} selectedBenefits={selectedBenefits} onToggle={toggleBenefit} />
              </>
            ) : null}
          </section>

          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Itens</h2>
              <span className="pill">{itemEntries.length}</span>
            </div>
            <div className="origin-item-list">
              {itemEntries.map((entry) => (
                <div
                  className={`origin-item-row${entry.kind === "instrumentos_oficio" || entry.kind === "crafted_item" ? " origin-item-row--interactive" : ""}`}
                  key={entry.id}
                  onClick={
                    entry.kind === "instrumentos_oficio" && selectedCharacterOficios.length
                      ? () => setOpenOriginItemOficio(openOriginItemOficio === entry.id ? null : entry.id)
                      : entry.kind === "crafted_item"
                        ? () => setOpenOriginCraftedItem(openOriginCraftedItem === entry.id ? null : entry.id)
                        : undefined
                  }
                >
                  <div>
                    <strong>{formatOriginItemName(entry, selectedItems[entry.id])}</strong>
                    {entry.descricao ? <span>{entry.descricao}</span> : null}
                    {entry.kind === "instrumentos_oficio" && selectedCharacterOficios.length === 0 ? (
                      <span>Escolha uma perícia Ofício antes de definir os instrumentos.</span>
                    ) : null}
                  </div>
                  {entry.kind === "instrumentos_oficio" ? (
                    openOriginItemOficio === entry.id ? (
                      <OriginOficioPopover
                        currentOficioId={selectedItems[entry.id] ?? ""}
                        oficioOptions={selectedCharacterOficios.map((oficioId) => ({ id: oficioId, label: getOficioLabel(oficioId) }))}
                        onClose={() => setOpenOriginItemOficio(null)}
                        onSelect={(oficioId) => {
                          setOriginItem(entry.id, oficioId);
                          setOpenOriginItemOficio(null);
                        }}
                      />
                    ) : null
                  ) : entry.kind === "crafted_item" ? (
                    <>
                      <button
                        className="origin-item-select-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenOriginCraftedItem(openOriginCraftedItem === entry.id ? null : entry.id);
                        }}
                        type="button"
                      >
                        {selectedItems[entry.id] ? "Trocar item" : "Escolher item"}
                      </button>
                      {openOriginCraftedItem === entry.id ? (
                        <OriginCraftedItemDialog
                          currentItemId={selectedItems[entry.id] ?? ""}
                          entry={entry}
                          onClose={() => setOpenOriginCraftedItem(null)}
                          onSelect={(itemId) => {
                            setOriginItem(entry.id, itemId);
                            setOpenOriginCraftedItem(null);
                          }}
                        />
                      ) : null}
                    </>
                  ) : entry.options?.length ? (
                    <select onChange={(event) => setOriginItem(entry.id, event.target.value)} value={selectedItems[entry.id] ?? ""}>
                      <option value="">Escolha</option>
                      {entry.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.nome}
                        </option>
                      ))}
                    </select>
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

function getOriginValue(origin) {
  return origin.id ?? origin.nome;
}

function OriginBenefitGrid({
  benefits,
  onRemoveOficio,
  onSelectOficio,
  onToggle,
  openOficio,
  selectedBenefits,
  setOpenOficio,
  skill = false
}) {
  if (!benefits.length) return null;
  return (
    <div className={`origin-benefit-grid${skill ? " origin-benefit-grid--skills" : ""}`}>
      {benefits.map((benefit) => {
        const selectedOficioId = benefit.isOficio ? getSelectedOriginOficioId(selectedBenefits, benefit.id) : "";
        const selected = benefit.isOficio ? Boolean(selectedOficioId) : selectedBenefits.includes(benefit.id);
        const disabled = !selected && (selectedBenefits.length >= BENEFIT_LIMIT || benefit.disabled);
        if (skill) {
          return (
            <div className="origin-skill-button-wrap" key={benefit.id}>
              <button
                className={`choice-button${selected ? " choice-button--active" : ""}${selectedOficioId ? " choice-button--oficio-selected" : ""}`}
                disabled={disabled}
                onClick={() => {
                  if (benefit.isOficio) {
                    setOpenOficio?.(openOficio === benefit.id ? null : benefit.id);
                    return;
                  }
                  onToggle(benefit);
                }}
                type="button"
              >
                <span className="choice-button__text">
                  {selectedOficioId ? `Of\u00edcio (${getOficioLabel(selectedOficioId).toLowerCase()})` : benefit.isOficio ? "Escolha o Of\u00edcio" : benefit.nome}
                </span>
                {selectedOficioId ? (
                  <span
                    className="choice-button__close"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveOficio?.(benefit);
                    }}
                    role="button"
                    tabIndex={0}
                    title="Remover ofício"
                  >
                    ×
                  </span>
                ) : null}
              </button>
              {benefit.disabledReason ? <small className="origin-benefit-card__reason">{benefit.disabledReason}</small> : null}
              {openOficio === benefit.id ? (
                <OriginOficioPopover
                  currentOficioId={selectedOficioId}
                  trainedBeforeOrigin={benefit.trainedOficios ?? new Set()}
                  onClose={() => setOpenOficio?.(null)}
                  onSelect={(oficioId) => onSelectOficio?.(benefit, oficioId)}
                />
              ) : null}
            </div>
          );
        }
        return (
          <button
            className={`origin-benefit-card${selected ? " origin-benefit-card--active" : ""}${benefit.disabled ? " origin-benefit-card--locked" : ""}`}
            disabled={disabled}
            key={benefit.id}
            onClick={() => onToggle(benefit)}
            type="button"
          >
            <span>{benefit.kindLabel}</span>
            <strong>{benefit.nome}</strong>
            {benefit.descricao ? <small>{benefit.descricao}</small> : null}
            {benefit.disabledReason ? <small className="origin-benefit-card__reason">{benefit.disabledReason}</small> : null}
          </button>
        );
      })}
    </div>
  );
}

function getOriginBenefits(origin, powers, trainedBeforeOrigin) {
  const beneficios = origin.beneficios ?? {};
  return [
    ...(beneficios.pericias ?? []).map((nome) => {
      const periciaId = normalizeId(nome);
      const trainedOficios = getTrainedOficios(trainedBeforeOrigin);
      const alreadyTrained = periciaId === "oficio"
        ? OFICIOS.every((oficio) => trainedOficios.has(oficio.id))
        : trainedBeforeOrigin.has(periciaId);
      return {
        id: `pericia:${nome}`,
        kind: "pericia",
        kindLabel: "Perícia",
        nome,
        isOficio: periciaId === "oficio",
        trainedOficios,
        disabled: alreadyTrained,
        disabledReason: alreadyTrained ? "Perícia já treinada!" : ""
      };
    }),
    ...(beneficios.poderes ?? []).map((nome) => {
      const power = findPowerByName(powers, nome);
      return {
        id: `poder:${nome}`,
        kind: "poder",
        kindLabel: power ? `Poder Geral - ${formatPowerCategory(power.categoria)}` : "Poder",
        nome,
        descricao: power ? formatPowerDescription(power) : "Você recebe este poder, se cumprir seus pré-requisitos.",
        powerId: power?.id ?? null
      };
    }),
    beneficios.poder_unico
      ? {
          id: `poder_unico:${beneficios.poder_unico.nome}`,
          kind: "poder_unico",
          kindLabel: "Poder Único",
          nome: beneficios.poder_unico.nome,
          descricao: beneficios.poder_unico.descricao
        }
      : null
  ].filter(Boolean);
}

const OFICIOS = [
  { id: "alquimista", label: "Alquimista" },
  { id: "armeiro", label: "Armeiro" },
  { id: "artesao", label: "Artesão" },
  { id: "cozinheiro", label: "Cozinheiro" },
  { id: "alfaiate", label: "Alfaiate" },
  { id: "alvenaria", label: "Alvenaria" },
  { id: "carpinteiro", label: "Carpinteiro" },
  { id: "joalheiro", label: "Joalheiro" },
  { id: "fazendeiro", label: "Fazendeiro" },
  { id: "pescador", label: "Pescador" },
  { id: "estalajadeiro", label: "Estalajadeiro" },
  { id: "escriba", label: "Escriba" },
  { id: "escultor", label: "Escultor" },
  { id: "engenhoqueiro", label: "Engenhoqueiro" },
  { id: "pintor", label: "Pintor" },
  { id: "minerador", label: "Minerador" },
  { id: "mercador", label: "Mercador" }
];

function OriginOficioPopover({ currentOficioId = "", oficioOptions = OFICIOS, trainedBeforeOrigin = new Set(), onClose, onSelect }) {
  const options = oficioOptions.filter((oficio) => oficio.id === currentOficioId || !trainedBeforeOrigin.has(oficio.id));
  return (
    <div className="class-oficio-popover origin-oficio-popover" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="false" aria-label="Escolher ofício">
      <div className="class-oficio-popover__header">
        <strong>Ofício</strong>
        <button className="icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <div className="choice-button-grid choice-button-grid--compact">
        {options.map((oficio) => (
          <button
            className={`choice-button${currentOficioId === oficio.id ? " choice-button--active" : ""}`}
            key={oficio.id}
            onClick={() => onSelect(oficio.id)}
            type="button"
          >
            {oficio.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getTrainedOficios(trainedBeforeOrigin) {
  return new Set(
    [...trainedBeforeOrigin]
      .filter((id) => String(id).startsWith("oficio:"))
      .map((id) => String(id).slice("oficio:".length))
  );
}

function getSelectedOriginOficioId(selectedBenefits, benefitId) {
  const prefix = `${benefitId}:`;
  const selected = selectedBenefits.find((id) => String(id).startsWith(prefix));
  return selected ? String(selected).slice(prefix.length) : "";
}

function getOficioLabel(oficioId) {
  return OFICIOS.find((oficio) => oficio.id === oficioId)?.label ?? oficioId;
}

function findPowerByName(powers, name) {
  const wanted = normalizeText(name);
  return (powers ?? []).find((power) => normalizeText(power.nome) === wanted);
}

function formatPowerDescription(power) {
  const prereq = power.preRequisitosTexto ? ` Pré-requisito: ${power.preRequisitosTexto}.` : "";
  return `${power.descricao}${prereq}`;
}

function formatPowerCategory(category) {
  const labels = {
    combate: "Combate",
    destino: "Destino",
    magia: "Magia",
    concedido: "Concedido",
    tormenta: "Tormenta",
    raca: "Raça",
    grupo: "Grupo"
  };
  return labels[category] ?? category ?? "Geral";
}

function getOriginItemEntries(origin, items, selectedOficios = []) {
  return (origin.itens ?? []).map((itemText, index) => {
    if (isOficioInstrumentChoice(itemText)) {
      return {
        id: `item_${index}`,
        kind: "instrumentos_oficio",
        nome: "Instrumentos de ofício",
        descricao: itemText,
        options: []
      };
    }
    if (isArtistChoice(itemText)) {
      return {
        id: `item_${index}`,
        nome: "Estojo de disfarces ou instrumento musical",
        descricao: itemText,
        options: getArtistItemOptions(items)
      };
    }
    if (isCraftedItemChoice(itemText)) {
      const maxPrice = getCraftedItemPriceLimit(itemText);
      return {
        id: `item_${index}`,
        kind: "crafted_item",
        nome: itemText,
        descricao: maxPrice ? `Itens com preço até T$ ${maxPrice}.` : null,
        maxPrice,
        catalog: getCraftedItemCatalog(items, maxPrice, selectedOficios),
        options: []
      };
    }
    return {
      id: `item_${index}`,
      nome: itemText,
      descricao: null,
      options: []
    };
  });
}

function isOficioInstrumentChoice(itemText) {
  const normalized = normalizeText(itemText);
  return normalized.includes("instrumentos de oficio") && normalized.includes("qualquer");
}

function formatOriginItemName(entry, selectedValue) {
  if (entry.kind === "instrumentos_oficio" && selectedValue) {
    return `Instrumentos de ofício (${getOficioLabel(selectedValue).toLowerCase()})`;
  }
  if (entry.kind === "crafted_item" && selectedValue) {
    const item = resolveCraftedCatalogItem(entry.catalog, selectedValue);
    if (item) return item.nome;
  }
  return entry.nome;
}

function isArtistChoice(itemText) {
  const normalized = normalizeText(itemText);
  return normalized.includes("estojo de disfarces") && normalized.includes("instrumento musical");
}

function getArtistItemOptions(items) {
  const musicalItems = items
    .filter((item) => {
      const marker = normalizeText(`${item.nome} ${item.textos?.habilidade ?? ""} ${item.textos?.variavel ?? ""} ${item.textos?.descricao ?? ""}`);
      return item.categoriaId === "instrumento" && (item.id === "instrumento_musical" || marker.includes("instrumento musical") || marker.includes("bardo"));
    })
    .map((item) => ({ id: item.id, nome: item.nome }));

  return [
    ...items
      .filter((item) => item.id === "estojo_de_disfarces")
      .map((item) => ({ id: item.id, nome: item.nome })),
    ...musicalItems
  ].sort((a, b) => a.nome.localeCompare(b.nome));
}

function isCraftedItemChoice(itemText) {
  const normalized = normalizeText(itemText);
  return normalized.includes("um item") && normalized.includes("fabricar");
}

function getCraftedItemPriceLimit(itemText) {
  const normalized = normalizeText(itemText);
  const match = normalized.match(/t\$\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function getCraftedItemCatalog(items, maxPrice, selectedOficios = []) {
  const availableItems = expandCraftableItemVariants(items)
    .filter((item) => ["arma", "armadura", "escudo", "item_geral"].includes(item.tipo))
    .filter((item) => !maxPrice || getItemPriceValue(item) <= maxPrice)
    .filter((item) => canOficiosFabricateItem(item, selectedOficios))
    .map((item) => ({
      ...item,
      price: getItemPriceValue(item)
    }));

  return {
    weapons: availableItems.filter((item) => item.tipo === "arma"),
    armors: availableItems.filter((item) => item.tipo === "armadura"),
    shields: availableItems.filter((item) => item.tipo === "escudo"),
    general: availableItems.filter((item) => item.tipo === "item_geral" && GENERAL_ITEM_ALLOWED_CATEGORIES.has(item.categoriaId)),
    guidance: getCraftGuidanceForOficios(selectedOficios)
  };
}

function expandCraftableItemVariants(items = []) {
  return items.flatMap((item) => {
    if (!Array.isArray(item.variantes) || !item.variantes.length) return [item];
    return item.variantes.map((variant) => ({
      ...item,
      ...variant,
      id: `${item.id}:${variant.id}`,
      itemBaseId: item.id,
      varianteId: variant.id,
      nome: variant.oficioId ? `Instrumentos de Of\u00edcio (${getOficioLabel(variant.oficioId).toLowerCase()})` : variant.nome ?? item.nome
    }));
  });
}

function canOficiosFabricateItem(item, selectedOficios = []) {
  if (!selectedOficios.length) return false;
  const allowedKeys = getAllowedCraftKeysForOficios(selectedOficios);
  if (item.oficioId) return allowedKeys.has(`oficio:${item.oficioId}`);
  return getCraftKeysForItem(item).some((key) => allowedKeys.has(key));
}

function getAllowedCraftKeysForOficios(selectedOficios = []) {
  const keys = new Set();
  selectedOficios.forEach((oficioId) => {
    keys.add(`oficio:${oficioId}`);
    (OFICIO_CRAFT_KEYS[oficioId] ?? []).forEach((key) => keys.add(key));
  });
  return keys;
}

function getCraftKeysForItem(item) {
  const keys = [item.id ? `item:${item.id}` : ""];
  if (item.itemBaseId) keys.push(`item:${item.itemBaseId}`);
  if (item.oficioId) keys.push(`oficio:${item.oficioId}`);
  if (["arma", "armadura", "escudo"].includes(item.tipo)) keys.push(item.tipo);
  if (item.tipo === "item_geral") keys.push(item.categoriaId);
  return keys.filter(Boolean);
}

function getCraftGuidanceForOficios(selectedOficios = []) {
  if (!selectedOficios.length) {
    return "Escolha uma pericia Oficio para filtrar pelos itens que o personagem consegue fabricar.";
  }

  return selectedOficios
    .map((oficioId) => {
      const labels = (OFICIO_CRAFT_KEYS[oficioId] ?? []).map((key) => CRAFT_KEY_LABELS[key] ?? GENERAL_ITEM_CATEGORY_LABELS[key] ?? formatIdLabel(key));
      return labels.length
        ? `${getOficioLabel(oficioId)}: ${labels.join(", ")}`
        : `${getOficioLabel(oficioId)}: sem itens da lista padrao; combine excecoes com o mestre`;
    })
    .join(" | ");
}

function getCraftedCatalogItems(catalog) {
  if (!catalog) return [];
  return [
    ...(catalog.weapons ?? []),
    ...(catalog.armors ?? []),
    ...(catalog.shields ?? []),
    ...(catalog.general ?? [])
  ];
}

function resolveCraftedCatalogItem(catalog, selectedValue) {
  const items = getCraftedCatalogItems(catalog);
  const exact = items.find((option) => option.id === selectedValue);
  if (exact) return exact;

  const variants = items.filter((option) => option.itemBaseId === selectedValue);
  return variants.length === 1 ? variants[0] : null;
}

function getItemPriceValue(item) {
  const value = Number(item.preco?.valor);
  return Number.isFinite(value) ? value : 0;
}

function buildWeaponGroups(items) {
  return groupByOrdered(items, (item) => item.categoriaId).map(([categoryId, categoryItems]) => ({
    id: `armas_${categoryId}`,
    kind: "weapon",
    label: `Armas ${WEAPON_CATEGORY_LABELS[categoryId] ?? categoryId}`,
    items: groupByOrdered(categoryItems, getWeaponSubgroupId).map(([subgroupId, subgroupItems]) => ({
      id: subgroupId,
      label: WEAPON_SUBGROUP_LABELS[subgroupId] ?? formatIdLabel(subgroupId),
      items: subgroupItems
    }))
  }));
}

function groupByOrdered(items, getKey) {
  const groups = new Map();
  items.forEach((item) => {
    const key = getKey(item) || "outros";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()];
}

function getWeaponSubgroupId(item) {
  const combat = item.arma?.combateId === "a_distancia" ? "distancia" : item.arma?.combateId === "corpo_a_corpo" ? "corpo" : item.arma?.combateId || "outros";
  const grip = item.arma?.empunhaduraId || "outros";
  return `${combat}_${grip}`;
}

function formatWeaponDamage(item) {
  return item.arma?.dano?.texto ?? item.arma?.dano?.principal ?? "—";
}

function formatWeaponCritical(item) {
  if (item.arma?.critico?.texto) return item.arma.critico.texto;
  const margem = item.arma?.critico?.margem;
  const multiplicador = item.arma?.critico?.multiplicador;
  if (!multiplicador) return "—";
  return margem && margem !== 20 ? `${margem}/x${multiplicador}` : `x${multiplicador}`;
}

function formatWeaponReach(item) {
  return REACH_LABELS[item.arma?.alcanceId] ?? (item.arma?.alcanceId ? formatIdLabel(item.arma.alcanceId) : "—");
}

function formatWeaponDamageType(item) {
  const types = item.arma?.tipoDanoIds ?? [];
  return types.length ? types.map((type) => DAMAGE_TYPE_LABELS[type] ?? formatIdLabel(type)).join(", ") : "—";
}

function formatDefenseBonus(item) {
  if (item.tipo === "armadura") return formatSignedNumber(item.armadura?.defesa);
  if (item.tipo === "escudo") return formatSignedNumber(item.escudo?.bonusDefesa);
  return "—";
}

function formatArmorPenalty(item) {
  if (item.tipo === "armadura") return formatNumberOrDash(item.armadura?.penalidade);
  if (item.tipo === "escudo") return formatNumberOrDash(item.escudo?.penalidade);
  return "—";
}

function formatSignedNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number > 0 ? `+${number}` : String(number);
}

function formatNumberOrDash(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "—";
}

function formatPrice(item) {
  return item.price ? `T$ ${formatDecimal(item.price)}` : "—";
}

function formatSpaces(item) {
  return item.espacos === null || item.espacos === undefined ? "—" : formatDecimal(item.espacos);
}

function formatDecimal(value) {
  return String(value).replace(".", ",");
}

function formatIdLabel(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const WEAPON_CATEGORY_LABELS = {
  simples: "Simples",
  marcial: "Marciais",
  exotica: "Exóticas",
  fogo: "de Fogo"
};

const WEAPON_SUBGROUP_LABELS = {
  corpo_leve: "Corpo a Corpo — Leves",
  corpo_uma_mao: "Corpo a Corpo — Uma Mão",
  corpo_duas_maos: "Corpo a Corpo — Duas Mãos",
  distancia_leve: "Ataque à Distância — Leves",
  distancia_uma_mao: "Ataque à Distância — Uma Mão",
  distancia_duas_maos: "Ataque à Distância — Duas Mãos",
  corpo_a_corpo_e_distancia_uma_mao: "Corpo a Corpo e Distância — Uma Mão",
  corpo_a_corpo_e_distancia_duas_maos: "Corpo a Corpo e Distância — Duas Mãos"
};

const REACH_LABELS = {
  curto: "Curto",
  medio: "Médio",
  longo: "Longo",
  "3m": "3m",
  "4_5m": "4,5m",
  cone_de_6m: "Cone de 6m"
};

const DAMAGE_TYPE_LABELS = {
  acido: "Ácido",
  corte: "Corte",
  eletricidade: "Eletricidade",
  fogo: "Fogo",
  frio: "Frio",
  impacto: "Impacto",
  luz: "Luz",
  perfuracao: "Perfuração",
  trevas: "Trevas"
};

const GENERAL_ITEM_CATEGORY_LABELS = {
  equipamento_aventura: "Equipamento de Aventura",
  instrumento: "Instrumentos",
  ferramenta: "Ferramentas",
  vestuario: "Vestuário",
  esoterico: "Esotéricos",
  alquimico_preparado: "Alquímicos Preparados",
  alquimico_catalisador: "Catalisadores Alquímicos",
  alquimico_venenoso: "Venenos",
  alimentacao: "Alimentação",
  bebida: "Bebidas",
  animal: "Animais",
  veiculo: "Veículos",
  aparato: "Aparatos",
  servico: "Serviços"
};

const GENERAL_ITEM_ALLOWED_CATEGORIES = new Set([
  "equipamento_aventura",
  "instrumento",
  "ferramenta",
  "vestuario",
  "esoterico",
  "alquimico_preparado",
  "alquimico_catalisador",
  "alquimico_venenoso",
  "alimentacao",
  "bebida",
  "animal",
  "veiculo",
  "aparato"
]);

const CRAFT_KEY_LABELS = {
  arma: "armas",
  armadura: "armaduras",
  escudo: "escudos",
  equipamento_aventura: "equipamentos de aventura",
  ferramenta: "ferramentas",
  vestuario: "vestuario",
  esoterico: "esotericos",
  alquimico_preparado: "alquimicos preparados",
  alquimico_catalisador: "catalisadores alquimicos",
  alquimico_venenoso: "venenos",
  alimentacao: "alimentacao",
  bebida: "bebidas",
  animal: "animais",
  veiculo: "veiculos",
  aparato: "aparatos",
  instrumento: "instrumentos",
  "item:anel_eclesiastico": "anel eclesiastico",
  "item:piercing_de_umbigo": "piercing de umbigo",
  "item:monoculo": "monoculo",
  "item:enfeite_de_elmo": "enfeite de elmo"
};

const OFICIO_CRAFT_KEYS = {
  alquimista: ["alquimico_preparado", "alquimico_catalisador", "alquimico_venenoso"],
  armeiro: ["arma", "armadura", "escudo"],
  alfaiate: ["vestuario"],
  artesao: ["equipamento_aventura", "ferramenta", "instrumento", "item:enfeite_de_elmo"],
  engenhoqueiro: ["aparato", "ferramenta"],
  escriba: ["equipamento_aventura", "ferramenta"],
  carpinteiro: ["equipamento_aventura", "ferramenta", "instrumento", "veiculo"],
  joalheiro: ["item:anel_eclesiastico", "item:piercing_de_umbigo", "item:monoculo", "item:enfeite_de_elmo"],
  escultor: ["equipamento_aventura"],
  pintor: ["equipamento_aventura", "ferramenta"],
  alvenaria: ["equipamento_aventura", "ferramenta"],
  mercador: [],
  cozinheiro: ["alimentacao", "bebida"],
  fazendeiro: ["alimentacao", "animal"],
  pescador: ["alimentacao"],
  minerador: [],
  estalajadeiro: []
};

const CRAFTED_ITEM_TABS = [
  { id: "weapons", label: "Armas" },
  { id: "armors", label: "Armaduras" },
  { id: "shields", label: "Escudos" },
  { id: "general", label: "Itens gerais" }
];

function OriginCraftedItemDialog({ currentItemId, entry, onClose, onSelect }) {
  const availableTabs = CRAFTED_ITEM_TABS.filter((tab) => entry.catalog?.[tab.id]?.length);
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id ?? "weapons");
  const [filters, setFilters] = useState({
    weaponCategory: [],
    weaponGrip: [],
    weaponCombat: [],
    armorCategory: [],
    shieldCategory: [],
    generalCategory: []
  });
  const currentTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : availableTabs[0]?.id;
  const visibleItems = filterCraftedItems(entry.catalog?.[currentTab] ?? [], currentTab, filters);
  const hasCraftedItems = availableTabs.length > 0;

  function toggleFilter(key, value) {
    setFilters((current) => {
      const values = current[key] ?? [];
      return {
        ...current,
        [key]: values.includes(value) ? [] : [value]
      };
    });
  }

  return (
    <div className="origin-item-dialog" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="false" aria-label="Escolher item fabricado">
      <div className="origin-item-dialog__header">
        <div>
          <strong>Escolher item</strong>
          {entry.maxPrice ? <span>Até T$ {entry.maxPrice}</span> : null}
        </div>
        <button className="icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      {entry.catalog?.guidance ? <p className="origin-item-dialog__guidance">{entry.catalog.guidance}</p> : null}
      {hasCraftedItems ? (
        <>
          <div className="origin-item-tabs">
            {availableTabs.map((tab) => (
              <button
                className={`origin-item-filter${currentTab === tab.id ? " origin-item-filter--active" : ""}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <OriginCraftedFilters activeTab={currentTab} filters={filters} items={entry.catalog?.[currentTab] ?? []} onToggle={toggleFilter} />
          <OriginCraftedItemTable activeTab={currentTab} currentItemId={currentItemId} items={visibleItems} onSelect={onSelect} />
        </>
      ) : (
        <div className="origin-item-empty">
          Nenhum item da lista corresponde aos Oficios treinados. O personagem ainda pode manter o beneficio e combinar uma excecao com o mestre.
        </div>
      )}
    </div>
  );
}

function OriginCraftedFilters({ activeTab, filters, items, onToggle }) {
  if (activeTab === "weapons") {
    const availableCategoryIds = new Set(items.map((item) => item.categoriaId).filter(Boolean));
    const availableGripIds = new Set(items.map((item) => item.arma?.empunhaduraId).filter(Boolean));
    const availableCombatIds = new Set(items.map((item) => getWeaponCombatFilterId(item)).filter(Boolean));
    return (
      <div className="origin-item-filter-grid">
        {[
          ["weaponCategory", "simples", "Armas Simples"],
          ["weaponCategory", "marcial", "Armas Marciais"],
          ["weaponCategory", "exotica", "Armas Exóticas"],
          ["weaponCategory", "fogo", "Armas de Fogo"],
          ["weaponGrip", "leve", "Leve"],
          ["weaponGrip", "uma_mao", "Uma Mão"],
          ["weaponGrip", "duas_maos", "Duas Mãos"],
          ["weaponCombat", "corpo", "Corpo a Corpo"],
          ["weaponCombat", "distancia", "À Distância"]
        ].filter(([key, value]) => {
          if (key === "weaponCategory") return availableCategoryIds.has(value);
          if (key === "weaponGrip") return availableGripIds.has(value);
          return availableCombatIds.has(value);
        }).map(([key, value, label]) => {
          const active = filters[key].includes(value);
          const disabled = !active && !filterOptionHasResults(items, activeTab, filters, key, value);
          return (
            <button
              className={`origin-item-filter${active ? " origin-item-filter--active" : ""}`}
              disabled={disabled}
              key={`${key}_${value}`}
              onClick={() => onToggle(key, value)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (activeTab === "armors" || activeTab === "shields") {
    const key = activeTab === "armors" ? "armorCategory" : "shieldCategory";
    const availableCategoryIds = new Set(items.map((item) => item.categoriaId).filter(Boolean));
    const options = activeTab === "armors"
      ? [["leve", "Leve"], ["pesada", "Pesada"]]
      : [["leve", "Leve"], ["pesado", "Pesado"]];
    return (
      <div className="origin-item-filter-grid origin-item-filter-grid--short">
        {options.filter(([value]) => availableCategoryIds.has(value)).map(([value, label]) => {
          const active = filters[key].includes(value);
          const disabled = !active && !filterOptionHasResults(items, activeTab, filters, key, value);
          return (
            <button
              className={`origin-item-filter${active ? " origin-item-filter--active" : ""}`}
              disabled={disabled}
              key={value}
              onClick={() => onToggle(key, value)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="origin-item-filter-grid">
      {[...GENERAL_ITEM_ALLOWED_CATEGORIES].filter((categoryId) => items.some((item) => item.categoriaId === categoryId)).map((categoryId) => {
        const active = filters.generalCategory.includes(categoryId);
        const disabled = !active && !filterOptionHasResults(items, activeTab, filters, "generalCategory", categoryId);
        return (
          <button
            className={`origin-item-filter${active ? " origin-item-filter--active" : ""}`}
            disabled={disabled}
            key={categoryId}
            onClick={() => onToggle("generalCategory", categoryId)}
            type="button"
          >
            {GENERAL_ITEM_CATEGORY_LABELS[categoryId] ?? formatIdLabel(categoryId)}
          </button>
        );
      })}
    </div>
  );
}

function OriginCraftedItemTable({ activeTab, currentItemId, items, onSelect }) {
  if (activeTab === "weapons") {
    const groups = buildWeaponGroups(items);
    return (
      <div className="origin-item-table origin-item-table--weapons">
        <div className="origin-item-table__head">
          <span>Armas</span>
          <span>Preço</span>
          <span>Dano</span>
          <span>Crítico</span>
          <span>Tipo</span>
          <span>Espaço</span>
        </div>
        {groups.map((group) => (
          <div className="origin-item-table__section" key={group.id}>
            <strong>{group.label}</strong>
            {group.items.map((subgroup) => (
              <div className="origin-item-table__subsection" key={subgroup.id}>
                <strong>{subgroup.label}</strong>
                {subgroup.items.map((item) => (
                  <button
                    className={`origin-item-table__row${currentItemId === item.id ? " origin-item-table__row--active" : ""}`}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    type="button"
                  >
                    <span>{item.nome}</span>
                    <span>{formatPrice(item)}</span>
                    <span>{formatWeaponDamage(item)}</span>
                    <span>{formatWeaponCritical(item)}</span>
                    <span>{formatWeaponDamageType(item)}</span>
                    <span>{formatSpaces(item)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "armors" || activeTab === "shields") {
    return (
      <div className="origin-item-table origin-item-table--armor">
        <div className="origin-item-table__head">
          <span>{activeTab === "armors" ? "Armaduras" : "Escudos"}</span>
          <span>Preço</span>
          <span>Bônus na Defesa</span>
          <span>Penalidade</span>
          <span>Espaço</span>
        </div>
        <div className="origin-item-table__section">
          <strong>{activeTab === "armors" ? "Armaduras" : "Escudos"}</strong>
          {items.map((item) => (
            <button
              className={`origin-item-table__row${currentItemId === item.id ? " origin-item-table__row--active" : ""}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span>{item.nome}</span>
              <span>{formatPrice(item)}</span>
              <span>{formatDefenseBonus(item)}</span>
              <span>{formatArmorPenalty(item)}</span>
              <span>{formatSpaces(item)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const groups = buildGeneralItemGroups(items);
  return (
    <div className="origin-item-table origin-item-table--general">
      <div className="origin-item-table__head">
        <span>Item</span>
        <span>Preço</span>
        <span>Espaço</span>
      </div>
      {groups.map((group) => (
        <div className="origin-item-table__section" key={group.id}>
          <strong>{group.label}</strong>
          {group.items.map((item) => (
            <button
              className={`origin-item-table__row${currentItemId === item.id ? " origin-item-table__row--active" : ""}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <span>{item.nome}</span>
              <span>{formatPrice(item)}</span>
              <span>{formatSpaces(item)}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function filterCraftedItems(items, activeTab, filters) {
  if (activeTab === "weapons") {
    return items.filter((item) => {
      return matchesOptionalFilter(filters.weaponCategory, item.categoriaId)
        && matchesOptionalFilter(filters.weaponGrip, item.arma?.empunhaduraId)
        && matchesOptionalFilter(filters.weaponCombat, getWeaponCombatFilterId(item));
    });
  }
  if (activeTab === "armors") {
    return items.filter((item) => matchesOptionalFilter(filters.armorCategory, item.categoriaId));
  }
  if (activeTab === "shields") {
    return items.filter((item) => matchesOptionalFilter(filters.shieldCategory, item.categoriaId));
  }
  return items.filter((item) => matchesOptionalFilter(filters.generalCategory, item.categoriaId));
}

function filterOptionHasResults(items, activeTab, filters, key, value) {
  const nextFilters = {
    ...filters,
    [key]: [value]
  };
  return filterCraftedItems(items, activeTab, nextFilters).length > 0;
}

function matchesOptionalFilter(selected, value) {
  return !selected?.length || selected.includes(value);
}

function getWeaponCombatFilterId(item) {
  if (item.arma?.combateId === "a_distancia") return "distancia";
  if (item.arma?.combateId === "corpo_a_corpo") return "corpo";
  return item.arma?.combateId;
}

function buildGeneralItemGroups(items) {
  return groupByOrdered(items, (item) => item.categoriaId).map(([categoryId, categoryItems]) => ({
    id: `itens_${categoryId || "outros"}`,
    label: GENERAL_ITEM_CATEGORY_LABELS[categoryId] ?? formatIdLabel(categoryId || "outros"),
    items: categoryItems
  }));
}

function formatOriginPreview(origin) {
  const beneficios = origin.beneficios ?? {};
  const parts = [];
  if (beneficios.pericias?.length) parts.push(`${beneficios.pericias.length} perícias`);
  if (beneficios.poderes?.length) parts.push(`${beneficios.poderes.length} poderes`);
  if (beneficios.poder_unico) parts.push("poder único");
  return parts.join(" | ");
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
