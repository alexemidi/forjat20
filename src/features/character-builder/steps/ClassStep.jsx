import { useEffect, useRef, useState } from "react";
import { calcularTotalPericia } from "../../../core/rules/pericias.js";
import { PERICIAS, nomePericia } from "../../../core/rules/periciasCatalogo.js";
import { SelectInput, TextInput } from "../../../shared/ui/TextInput.jsx";
import { calcularAtributosComEscolhas } from "../model/atributos.js";
import { calcularPatamarParaNivel } from "../../../core/rules/combate.js";
import {
  calcularBonusPericiasRaciais,
  coletarBonusPmRacial,
  coletarBonusPvRacial,
  coletarPericiasTreinadasRaciais,
  coletarQuantidadePericiasRaciaisEscolhiveis,
  detalharBonusPmRacial,
  detalharBonusPvRacial
} from "../model/racaEfeitos.js";
import { calcularInfoMagiaPersonagem } from "../model/magiasPersonagem.js";

export function ClassStep({ catalogs, draft, updateDraft }) {
  const selectedClass = catalogs.classes.find((classe) => classe.id === draft.info.classeId);
  const race = catalogs.races.find((raca) => raca.id === draft.info.racaId);
  const nivel = Number(draft.info.nivel ?? 1);
  const raceChoices = draft.escolhas.raca ?? {};
  const classChoices = draft.escolhas.classe ?? {};
  const attrs = calcularAtributosComEscolhas(draft.atributosBase, race, raceChoices);

  const recursos = calcularRecursos(selectedClass, race, raceChoices, attrs, nivel);
  const magiaInfo = calcularInfoMagiaPersonagem(draft, selectedClass, attrs);
  const periciasInfo = calcularPericias(selectedClass, race, raceChoices, classChoices, attrs, nivel);
  const classPowerOptions = (catalogs.classPowers ?? [])
    .filter((power) => power.classeId === selectedClass?.id)
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  const selectedClassPowerIds = classChoices.poderesClasse ?? [];
  const classPowerLimit = calcularQuantidadePoderesClasse(selectedClass, nivel);
  const shouldShowIntSkills = periciasInfo.intChoiceLimit > 0 && periciasInfo.classChoicesComplete;
  const intSkillsRef = useRef(null);
  const wasShowingIntSkillsRef = useRef(false);
  const habilidadesAtivas = (selectedClass?.habilidades ?? [])
    .filter((habilidade) => Number(habilidade.nivel ?? 1) <= nivel)
    .sort((a, b) => Number(a.nivel ?? 1) - Number(b.nivel ?? 1) || String(a.nome).localeCompare(String(b.nome)));

  useEffect(() => {
    if (shouldShowIntSkills && !wasShowingIntSkillsRef.current) {
      intSkillsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasShowingIntSkillsRef.current = shouldShowIntSkills;
  }, [shouldShowIntSkills]);

  function handleClassChange(classeId) {
    updateDraft("info.classeId", classeId);
    updateDraft("escolhas.classe", {
      periciasFixas: {},
      periciasRaca: [],
      periciasClasse: [],
      periciasInteligencia: [],
      oficiosFixos: {},
      poderesClasse: [],
      arcanista: {
        caminhoId: "",
        linhagemId: "",
        tipoDanoDraconico: "",
        deusMaiorId: ""
      },
      prototipo: {
        modo: "",
        itemSuperior: {
          itemId: "",
          melhoriaId: "",
          melhoriaIds: []
        },
        alquimicos: []
      }
    });
  }

  function setLevel(value) {
    const nivel = Number(value);
    updateDraft("info.nivel", nivel);
    updateDraft("info.patamarId", calcularPatamarParaNivel(nivel));
  }

  function setFixedChoice(choiceKey, periciaId) {
    updateDraft(`escolhas.classe.periciasFixas.${choiceKey}`, periciaId);
  }

  function toggleList(path, current, periciaId, limit, blockedIds = new Set()) {
    if (current.includes(periciaId)) {
      updateDraft(path, current.filter((id) => id !== periciaId));
      return;
    }
    if (current.length >= limit || blockedIds.has(periciaId)) return;
    updateDraft(path, [...current, periciaId]);
  }

  function toggleOficio(path, current, oficioId, limit) {
    const entryId = oficioSelectionId(oficioId);
    if (current.includes(entryId)) {
      updateDraft(path, current.filter((id) => id !== entryId));
      return;
    }
    if (current.length >= limit) return;
    updateDraft(path, [...current, entryId]);
  }

  function changeOficio(path, current, currentOficioId, nextOficioId, limit) {
    const nextEntryId = oficioSelectionId(nextOficioId);
    if (currentOficioId) {
      updateDraft(path, current.map((id) => (id === oficioSelectionId(currentOficioId) ? nextEntryId : id)));
      return;
    }
    if (current.length >= limit) return;
    updateDraft(path, [...current, nextEntryId]);
  }

  function setFixedOficio(slotKey, oficioId) {
    updateDraft(`escolhas.classe.oficiosFixos.${slotKey}`, oficioId);
  }

  function toggleClassPower(power) {
    const current = selectedClassPowerIds;
    const selectedCount = current.filter((id) => id === power.id).length;
    const hasPower = selectedCount > 0;

    if (!power.repetivel && hasPower) {
      updateDraft("escolhas.classe.poderesClasse", current.filter((id) => id !== power.id));
      return;
    }

    if (power.repetivel && hasPower && current.length >= classPowerLimit) {
      updateDraft("escolhas.classe.poderesClasse", removeOne(current, power.id));
      return;
    }

    const prereq = avaliarPreRequisitosPoder(power, {
      attrs,
      nivel,
      periciasTreinadas: periciasInfo.treinadas,
      poderesSelecionados: current
    });
    if (!prereq.ok || current.length >= classPowerLimit) return;
    if (!power.repetivel && hasPower) return;
    updateDraft("escolhas.classe.poderesClasse", [...current, power.id]);
  }

  function removeClassPower(powerId) {
    updateDraft("escolhas.classe.poderesClasse", removeOne(selectedClassPowerIds, powerId));
  }

  return (
    <div className="builder-step">
      <header>
        <h1 className="section-title">Classe</h1>
        <p className="section-subtitle">Confira recursos, habilidades por nivel e pericias treinadas da classe.</p>
      </header>

      <div className="class-selector-grid">
        <SelectInput
          id="character-class"
          label="Classe"
          onChange={(event) => handleClassChange(event.target.value)}
          value={draft.info.classeId}
        >
          <option value="">Selecione</option>
          {catalogs.classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nome}
            </option>
          ))}
        </SelectInput>
        <TextInput
          id="class-level"
          label="Nível"
          min="1"
          onChange={(event) => setLevel(event.target.value)}
          type="number"
          value={draft.info.nivel}
        />
      </div>

      {selectedClass ? (
        <>
          <section className="class-dashboard">
            <ResourceCard
              label="PV"
              value={recursos.pv ?? "-"}
              formula={recursos.pvFormula ?? "sem classe"}
              extra={recursos.pvBonusFormula}
            />
            <ResourceCard
              label="PM"
              value={recursos.pm ?? "-"}
              formula={recursos.pmFormula ?? "sem classe"}
              extra={recursos.pmBonusFormula}
            />
            <ResourceCard
              label="Nivel"
              value={nivel}
              formula={`${habilidadesAtivas.length} habilidade${habilidadesAtivas.length === 1 ? "" : "s"} ativa${habilidadesAtivas.length === 1 ? "" : "s"}`}
            />
            {magiaInfo ? (
              <ResourceCard
                label="Magia"
                value={`CD ${magiaInfo.cd}`}
                formula={`${magiaInfo.atributoNome} (${magiaInfo.atributoId.toUpperCase()})`}
                extra={magiaInfo.formula}
              />
            ) : null}
          </section>

          {classPowerLimit > 0 ? (
            <section className="builder-section">
              <div className="builder-section__header">
                <h2>Poderes de classe</h2>
                <span className="pill">{selectedClassPowerIds.length}/{classPowerLimit}</span>
              </div>
              <ClassPowerPicker
                attrs={attrs}
                limit={classPowerLimit}
                nivel={nivel}
                onRemove={removeClassPower}
                onToggle={toggleClassPower}
                options={classPowerOptions}
                periciasTreinadas={periciasInfo.treinadas}
                selected={selectedClassPowerIds}
              />
            </section>
          ) : null}

          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Pericias da classe</h2>
              <span className="pill">{periciasInfo.treinadas.size} treinadas</span>
            </div>

            <ClassGrantedSkills
              fixedEntries={selectedClass.caracteristicas?.pericias?.fixas ?? []}
              classChoices={classChoices}
              trainedIds={periciasInfo.treinadas}
              selectedOficios={periciasInfo.selectedOficios}
              onFixedChoice={setFixedChoice}
              onSetOficio={setFixedOficio}
            />

            {false && periciasInfo.raceChoiceLimit > 0 ? (
              <SkillPicker
                title="Perícias de raça"
                description="Escolha as perícias concedidas pela raça."
                limit={periciasInfo.raceChoiceLimit}
                selected={periciasInfo.selectedRaceSkills}
                options={periciasInfo.intChoiceOptions}
                blockedIds={periciasInfo.blockedForRaceChoices}
                onToggle={(periciaId) =>
                  toggleList(
                    "escolhas.classe.periciasRaca",
                    periciasInfo.selectedRaceSkills,
                    periciaId,
                    periciasInfo.raceChoiceLimit,
                    periciasInfo.blockedForRaceChoices
                  )
                }
                onToggleOficio={(oficioId) =>
                  toggleOficio("escolhas.classe.periciasInteligencia", periciasInfo.selectedIntSkills, oficioId, periciasInfo.intChoiceLimit)
                }
                selectedOficios={periciasInfo.selectedOficios}
              />
            ) : null}

            {false && periciasInfo.raceChoiceLimit > 0 ? (
              <SkillPicker
                title={`Escolha mais ${periciasInfo.raceChoiceLimit} ${periciasInfo.raceChoiceLimit === 1 ? "perícia" : "perícias"} da raça ${race?.nome ?? ""}`}
                description="Escolha as perícias concedidas pela raça."
                limit={periciasInfo.raceChoiceLimit}
                selected={periciasInfo.selectedRaceSkills}
                options={periciasInfo.raceChoiceOptions}
                blockedIds={periciasInfo.blockedForRaceChoices}
                onToggle={(periciaId) =>
                  toggleList(
                    "escolhas.classe.periciasRaca",
                    periciasInfo.selectedRaceSkills,
                    periciaId,
                    periciasInfo.raceChoiceLimit,
                    periciasInfo.blockedForRaceChoices
                  )
                }
                onToggleOficio={(oficioId) =>
                  toggleOficio("escolhas.classe.periciasRaca", periciasInfo.selectedRaceSkills, oficioId, periciasInfo.raceChoiceLimit)
                }
                selectedOficios={periciasInfo.selectedOficios}
              />
            ) : null}

            {periciasInfo.classChoiceLimit > 0 ? (
              <SkillPicker
                title={`Escolha mais ${periciasInfo.classChoiceLimit} perícias de classe`}
                description="Escolha dentro da lista restrita da classe."
                limit={periciasInfo.classChoiceLimit}
                selected={periciasInfo.selectedClassSkills}
                options={periciasInfo.classChoiceOptions}
                blockedIds={periciasInfo.blockedForClassChoices}
                onToggle={(periciaId) =>
                  toggleList(
                    "escolhas.classe.periciasClasse",
                    periciasInfo.selectedClassSkills,
                    periciaId,
                    periciasInfo.classChoiceLimit,
                    periciasInfo.blockedForClassChoices
                  )
                }
                onToggleOficio={(oficioId) =>
                  toggleOficio("escolhas.classe.periciasClasse", periciasInfo.selectedClassSkills, oficioId, periciasInfo.classChoiceLimit)
                }
                onChangeOficio={(currentOficioId, nextOficioId) =>
                  changeOficio("escolhas.classe.periciasClasse", periciasInfo.selectedClassSkills, currentOficioId, nextOficioId, periciasInfo.classChoiceLimit)
                }
                selectedOficios={periciasInfo.selectedOficios}
              />
            ) : null}

            {shouldShowIntSkills ? (
              <div ref={intSkillsRef}>
                <SkillPicker
                  title="Perícias de inteligência"
                  description="Escolha perícias adicionais por Inteligência positiva."
                  limit={periciasInfo.intChoiceLimit}
                  selected={periciasInfo.selectedIntSkills}
                  options={periciasInfo.intChoiceOptions}
                  blockedIds={periciasInfo.blockedForIntChoices}
                  onToggle={(periciaId) =>
                    toggleList(
                      "escolhas.classe.periciasInteligencia",
                      periciasInfo.selectedIntSkills,
                      periciaId,
                      periciasInfo.intChoiceLimit,
                      periciasInfo.blockedForIntChoices
                    )
                  }
                  onToggleOficio={(oficioId) =>
                    toggleOficio("escolhas.classe.periciasInteligencia", periciasInfo.selectedIntSkills, oficioId, periciasInfo.intChoiceLimit)
                  }
                  onChangeOficio={(currentOficioId, nextOficioId) =>
                    changeOficio("escolhas.classe.periciasInteligencia", periciasInfo.selectedIntSkills, currentOficioId, nextOficioId, periciasInfo.intChoiceLimit)
                  }
                  selectedOficios={periciasInfo.selectedOficios}
                />
              </div>
            ) : null}

            {periciasInfo.raceChoiceLimit > 0 ? (
              <SkillPicker
                title={`Escolha mais ${periciasInfo.raceChoiceLimit} ${periciasInfo.raceChoiceLimit === 1 ? "perícia" : "perícias"} da raça ${race?.nome ?? ""}`}
                description="Escolha as perícias concedidas pela raça."
                limit={periciasInfo.raceChoiceLimit}
                selected={periciasInfo.selectedRaceSkills}
                options={periciasInfo.raceChoiceOptions}
                blockedIds={periciasInfo.blockedForRaceChoices}
                onToggle={(periciaId) =>
                  toggleList(
                    "escolhas.classe.periciasRaca",
                    periciasInfo.selectedRaceSkills,
                    periciaId,
                    periciasInfo.raceChoiceLimit,
                    periciasInfo.blockedForRaceChoices
                  )
                }
                onToggleOficio={(oficioId) =>
                  toggleOficio("escolhas.classe.periciasRaca", periciasInfo.selectedRaceSkills, oficioId, periciasInfo.raceChoiceLimit)
                }
                onChangeOficio={(currentOficioId, nextOficioId) =>
                  changeOficio("escolhas.classe.periciasRaca", periciasInfo.selectedRaceSkills, currentOficioId, nextOficioId, periciasInfo.raceChoiceLimit)
                }
                selectedOficios={periciasInfo.selectedOficios}
              />
            ) : null}
          </section>

          <section className="builder-section">
            <div className="builder-section__header">
              <h2>Habilidades ate o nivel {nivel}</h2>
              <span className="pill">{habilidadesAtivas.length}</span>
            </div>
            <div className="class-ability-list">
              {habilidadesAtivas.map((ability) => (
                <article className="class-ability" key={ability.id ?? `${ability.nivel}-${ability.nome}`}>
                  <div className="class-ability__header">
                    <strong>{ability.nome}</strong>
                    <span>Nivel {ability.nivel ?? 1}</span>
                  </div>
                  {ability.descricao ? <p>{ability.descricao}</p> : <p className="muted">Sem descricao registrada.</p>}
                  {ability.id === "arcanista_caminho_do_arcanista" ? (
                    <ArcanistPathChoice ability={ability} catalogs={catalogs} classChoices={classChoices} attrs={attrs} nivel={nivel} updateDraft={updateDraft} />
                  ) : null}
                  {ability.id === "inventor_prototipo" ? (
                    <InventorPrototypeChoice catalogs={catalogs} classChoices={classChoices} updateDraft={updateDraft} />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function ClassPowerPicker({ attrs, limit, nivel, onRemove, onToggle, options, periciasTreinadas, selected }) {
  if (!options.length) {
    return <p className="muted">Nenhum poder de classe registrado para esta classe.</p>;
  }

  return (
    <div className="class-power-grid">
      {options.map((power) => {
        const selectedCount = selected.filter((id) => id === power.id).length;
        const prereq = avaliarPreRequisitosPoder(power, {
          attrs,
          nivel,
          periciasTreinadas,
          poderesSelecionados: selected
        });
        const canAdd = prereq.ok && selected.length < limit && (power.repetivel || selectedCount === 0);
        return (
          <article
            className={`class-power-card${selectedCount > 0 ? " class-power-card--active" : ""}${!prereq.ok ? " class-power-card--locked" : ""}`}
            key={power.id}
          >
            <div className="class-power-card__header">
              <strong>{power.nome}</strong>
              {selectedCount > 0 ? <span>{selectedCount}x</span> : null}
            </div>
            <p>{power.descricao}</p>
            {power.id === "guerreiro_golpe_pessoal" ? (
              <small>Os efeitos do Golpe Pessoal usam limite de PM por rodada igual ao nível.</small>
            ) : null}
            {!prereq.ok ? <small className="class-power-card__req">Requer: {prereq.motivos.join("; ")}</small> : null}
            <div className="class-power-card__actions">
              <button disabled={!canAdd} onClick={() => onToggle(power)} type="button">
                {selectedCount > 0 && power.repetivel ? "Escolher novamente" : selectedCount > 0 ? "Selecionado" : "Escolher"}
              </button>
              {selectedCount > 0 ? (
                <button onClick={() => onRemove(power.id)} type="button">
                  Remover
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ArcanistPathChoice({ ability, catalogs, classChoices, attrs, nivel, updateDraft }) {
  const choices = classChoices.arcanista ?? {};
  const caminhoOptions = (ability.escolhas ?? []).map((option) => ({
    ...option,
    id: slugArcanistOption(option.nome)
  }));
  const selectedPath = caminhoOptions.find((option) => option.id === choices.caminhoId);
  const lineageOptions = selectedPath?.id === "feiticeiro"
    ? (selectedPath.escolhas_secundarias ?? []).map((option) => ({ ...option, id: option.id ?? slugArcanistOption(option.nome) }))
    : [];
  const selectedLineage = lineageOptions.find((option) => option.id === choices.linhagemId);
  const magicAttr = selectedPath?.id === "feiticeiro" ? "car" : selectedPath?.id === "bruxo" || selectedPath?.id === "mago" ? "int" : "";
  const magicCd = magicAttr ? 10 + Math.floor(Number(nivel ?? 1) / 2) + Number(attrs[magicAttr] ?? 0) : null;

  function selectPath(pathId) {
    updateDraft("escolhas.classe.arcanista", {
      caminhoId: pathId,
      linhagemId: "",
      tipoDanoDraconico: "",
      deusMaiorId: ""
    });
  }

  function selectLineage(lineageId) {
    updateDraft("escolhas.classe.arcanista", {
      ...choices,
      caminhoId: "feiticeiro",
      linhagemId: lineageId,
      tipoDanoDraconico: "",
      deusMaiorId: ""
    });
  }

  return (
    <div className="class-choice-panel">
      <SimpleSegment
        label="1. Caminho do Arcanista"
        value={choices.caminhoId ?? ""}
        options={caminhoOptions.map((option) => option.id)}
        labels={Object.fromEntries(caminhoOptions.map((option) => [option.id, option.nome]))}
        onChange={selectPath}
      />

      {selectedPath ? (
        <ChoiceDescription title={selectedPath.nome}>
          {selectedPath.descricao}
          <p className="choice-description__subtext">
            Atributo-chave: <strong>{magicAttr === "car" ? "Carisma" : "Inteligência"}</strong>. CD de magia: <strong>{magicCd}</strong>.
          </p>
        </ChoiceDescription>
      ) : null}

      {lineageOptions.length ? (
        <SimpleSegment
          label="2. Linhagem Sobrenatural"
          value={choices.linhagemId ?? ""}
          options={lineageOptions.map((option) => option.id)}
          labels={Object.fromEntries(lineageOptions.map((option) => [option.id, option.nome]))}
          onChange={selectLineage}
        />
      ) : null}

      {selectedLineage ? (
        <ChoiceDescription title={selectedLineage.nome}>
          {selectedLineage.estagios?.find((stage) => stage.id === "basica")?.descricao ?? selectedLineage.descricao}
        </ChoiceDescription>
      ) : null}

      {selectedLineage?.id === "linhagem_draconica" ? (
        <SimpleSegment
          label="3. Tipo de dano dracônico"
          options={[
            "acido",
            "eletricidade",
            "fogo",
            "frio"
          ]}
          labels={{
            acido: "Ácido",
            eletricidade: "Eletricidade",
            fogo: "Fogo",
            frio: "Frio"
          }}
          value={choices.tipoDanoDraconico}
          onChange={(value) => updateDraft("escolhas.classe.arcanista.tipoDanoDraconico", value)}
        />
      ) : null}

      {selectedLineage?.id === "linhagem_abencoada" ? (
        <div className="choice-panel">
          <SelectInput
            id="arcanist-blessed-god"
            label="3. Deus maior da linhagem abençoada"
            onChange={(event) => updateDraft("escolhas.classe.arcanista.deusMaiorId", event.target.value)}
            value={choices.deusMaiorId ?? ""}
          >
            <option value="">Selecione</option>
            {catalogs.gods.map((god) => {
              const value = getCatalogEntryValue(god);
              return (
                <option key={value} value={value}>
                  {god.nome}
                </option>
              );
            })}
          </SelectInput>
        </div>
      ) : null}
    </div>
  );
}

function SimpleSegment({ label, value, options, labels = {}, onChange }) {
  return (
    <div className="choice-panel">
      <label className="choice-label">{label}</label>
      <div className="choice-button-grid">
        {options.map((option) => (
          <button
            className={`choice-button${value === option ? " choice-button--active" : ""}`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {labels[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceDescription({ title, children }) {
  return (
    <div className="choice-description">
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

function slugArcanistOption(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^linhagem_?/, "linhagem_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getCatalogEntryValue(entry) {
  return entry?.id ?? entry?.nome;
}

function ResourceCard({ label, value, formula, extra }) {
  return (
    <div className="class-resource-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{formula}</p>
      {extra ? <p>{extra}</p> : null}
    </div>
  );
}

const PROTOTYPE_PRICE_LIMIT = 500;
const PROTOTYPE_BASE_ITEM_LIMIT = 200;
const IMPROVEMENT_PRICE_BY_COUNT = {
  1: 300,
  2: 3000,
  3: 9000,
  4: 18000
};

const PROTOTYPE_SHOP_GENERAL_CATEGORIES = new Set([
  "equipamento_aventura",
  "ferramenta",
  "vestuario",
  "esoterico",
  "alquimico_preparado",
  "alquimico_catalisador",
  "alquimico_venenoso"
]);

function InventorPrototypeChoice({ catalogs, classChoices, updateDraft }) {
  const [openSuperiorShop, setOpenSuperiorShop] = useState(false);
  const [openImprovementShop, setOpenImprovementShop] = useState(false);
  const choice = classChoices.prototipo ?? {};
  const selectedSuperior = choice.itemSuperior ?? {};
  const shopItems = getPrototypeShopItems(catalogs.items);
  const selectedItem = shopItems.find((item) => item.id === selectedSuperior.itemId);
  const improvementOptions = selectedItem ? getCompatiblePrototypeImprovements(selectedItem, catalogs.improvements) : [];
  const selectedImprovementIds = getPrototypeImprovementIds(selectedSuperior)
    .filter((id) => improvementOptions.some((improvement) => improvement.id === id));
  const selectedImprovements = selectedImprovementIds
    .map((id) => improvementOptions.find((improvement) => improvement.id === id))
    .filter(Boolean);
  const selectedImprovementLabel = formatPrototypeImprovementsSummary(selectedImprovements);
  const selectedImprovementCount = selectedImprovementIds.length;

  function setSuperiorItem(itemId) {
    updateDraft("escolhas.classe.prototipo", {
      modo: "item_superior",
      itemSuperior: { itemId, melhoriaId: "", melhoriaIds: [] },
      alquimicos: []
    });
    setOpenSuperiorShop(false);
    setOpenImprovementShop(false);
  }

  function toggleSuperiorImprovement(melhoriaId) {
    const nextIds = selectedImprovementIds.includes(melhoriaId)
      ? selectedImprovementIds.filter((id) => id !== melhoriaId)
      : [...selectedImprovementIds, melhoriaId];
    updateDraft("escolhas.classe.prototipo.itemSuperior", {
      ...selectedSuperior,
      itemId: selectedSuperior.itemId ?? "",
      melhoriaId: nextIds[0] ?? "",
      melhoriaIds: nextIds
    });
  }

  return (
    <div className="class-prototype-choice">
      <div className="origin-item-list">
        <div className={`origin-item-row class-prototype-row${openSuperiorShop || openImprovementShop ? " origin-item-row--active" : ""}`}>
          <div>
            <strong>{selectedItem?.nome ?? "Um item superior de até T$ 500"}</strong>
            {selectedItem ? (
              <span>
                {formatPrototypePrice(getPrototypeTotalPrice(selectedItem, selectedImprovementCount))}
                {selectedImprovementLabel ? ` | ${selectedImprovementLabel}` : ""}
              </span>
            ) : null}
          </div>
          <>
            <button
              className="origin-item-select-button"
              onClick={(event) => {
                event.stopPropagation();
                setOpenSuperiorShop((open) => !open);
              }}
              type="button"
            >
              {selectedItem ? "Trocar item" : "Escolher item"}
            </button>
            {openSuperiorShop ? (
              <PrototypeSuperiorItemShop
                items={shopItems}
                onClose={() => setOpenSuperiorShop(false)}
                onSelect={setSuperiorItem}
                selectedItemId={selectedSuperior.itemId ?? ""}
              />
            ) : null}
            <button
              className="origin-item-select-button"
              disabled={!selectedItem}
              onClick={(event) => {
                event.stopPropagation();
                if (!selectedItem) return;
                setOpenImprovementShop((open) => !open);
              }}
              type="button"
            >
              {selectedImprovementLabel || "Escolher melhoria"}
            </button>
            {openImprovementShop && selectedItem ? (
              <PrototypeImprovementShop
                improvements={improvementOptions}
                item={selectedItem}
                onClose={() => setOpenImprovementShop(false)}
                onToggle={toggleSuperiorImprovement}
                selectedImprovementIds={selectedImprovementIds}
              />
            ) : null}
          </>
        </div>
      </div>
    </div>
  );
}

function getSuperiorPrototypeOptions(catalogs) {
  return (catalogs.items ?? [])
    .filter((item) => getSuperiorItemCategory(item))
    .map((item) => ({
      item: {
        ...item,
        price: getItemPrice(item)
      },
      totalPrice: getItemPrice(item) + IMPROVEMENT_PRICE_BY_COUNT[1]
    }))
    .filter((option) => option.totalPrice <= PROTOTYPE_PRICE_LIMIT)
    .filter((option) => option.item.price <= PROTOTYPE_BASE_ITEM_LIMIT)
    .filter((option) => getAffordablePrototypeImprovements(option.item, catalogs.improvements).length)
    .sort((a, b) => a.item.nome.localeCompare(b.item.nome));
}

function getPrototypeShopItems(items) {
  return (items ?? [])
    .filter((item) => ["arma", "armadura", "escudo", "item_geral"].includes(item.tipo))
    .filter((item) => item.tipo !== "item_geral" || PROTOTYPE_SHOP_GENERAL_CATEGORIES.has(item.categoriaId))
    .filter((item) => getItemPrice(item) <= PROTOTYPE_BASE_ITEM_LIMIT)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function getCompatiblePrototypeImprovements(item, improvements) {
  const category = getSuperiorItemCategory(item);
  return (improvements ?? [])
    .filter((improvement) => improvement.categoriasIds?.includes(category))
    .filter((improvement) => improvement.id !== "material_especial")
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function getAffordablePrototypeImprovements(item, improvements) {
  return getCompatiblePrototypeImprovements(item, improvements)
    .filter((improvement) => !(improvement.preRequisitos ?? []).length)
    .filter(() => getPrototypeTotalPrice(item, 1) <= PROTOTYPE_PRICE_LIMIT);
}

function getPrototypeImprovementIds(itemSuperior) {
  if (Array.isArray(itemSuperior?.melhoriaIds)) return itemSuperior.melhoriaIds.filter(Boolean);
  return itemSuperior?.melhoriaId ? [itemSuperior.melhoriaId] : [];
}

function getPrototypeTotalPrice(item, improvementCount) {
  if (!improvementCount) return getItemPrice(item);
  return getItemPrice(item) + (IMPROVEMENT_PRICE_BY_COUNT[improvementCount] ?? Number.POSITIVE_INFINITY);
}

function formatPrototypeImprovementsSummary(improvements) {
  if (!improvements.length) return "";
  return improvements.map((improvement) => improvement.nome).join(", ");
}

function getImprovementBlockedReason(improvement, selectedIds, item) {
  const isSelected = selectedIds.includes(improvement.id);
  if (isSelected) return "";

  const nextCount = selectedIds.length + 1;
  if (!IMPROVEMENT_PRICE_BY_COUNT[nextCount]) return "Limite de 4 melhorias";

  const missingPrereq = (improvement.preRequisitos ?? []).find((req) => {
    if (req.tipo === "melhoria") return !selectedIds.includes(req.melhoriaId);
    if (req.tipo === "uma_das_melhorias") return !(req.melhoriasIds ?? []).some((id) => selectedIds.includes(id));
    return false;
  });
  if (missingPrereq) return "Pré-requisito não atendido";

  if (getPrototypeTotalPrice(item, nextCount) > PROTOTYPE_PRICE_LIMIT) return `Passa de T$ ${PROTOTYPE_PRICE_LIMIT}`;

  return "";
}

function getSuperiorItemCategory(item) {
  if (["arma", "armadura", "escudo"].includes(item?.tipo)) return item.tipo;
  if (item?.tipo === "item_geral" && ["esoterico", "ferramenta", "vestuario"].includes(item.categoriaId)) {
    return item.categoriaId;
  }
  return "";
}

function getPrototypeAlchemyItems(items) {
  return (items ?? [])
    .filter((item) => item.tipo === "item_geral" && String(item.categoriaId ?? "").startsWith("alquimico_"))
    .filter((item) => getItemPrice(item) <= PROTOTYPE_PRICE_LIMIT)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function getItemPrice(item) {
  const value = Number(item?.preco?.valor);
  return Number.isFinite(value) ? value : 0;
}

function formatPrototypePrice(value) {
  return `T$ ${String(value).replace(".", ",")}`;
}

const PROTOTYPE_SHOP_TABS = [
  { id: "weapons", label: "Armas" },
  { id: "armors", label: "Armaduras" },
  { id: "shields", label: "Escudos" },
  { id: "general", label: "Itens gerais" }
];

function PrototypeSuperiorItemShop({ items, selectedItemId, onClose, onSelect }) {
  const catalog = {
    weapons: items.filter((item) => item.tipo === "arma"),
    armors: items.filter((item) => item.tipo === "armadura"),
    shields: items.filter((item) => item.tipo === "escudo"),
    general: items.filter((item) => item.tipo === "item_geral")
  };
  const tabs = PROTOTYPE_SHOP_TABS.filter((tab) => catalog[tab.id].length);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "weapons");
  const [filters, setFilters] = useState({
    weaponCategory: [],
    weaponGrip: [],
    weaponCombat: [],
    armorCategory: [],
    shieldCategory: [],
    generalCategory: []
  });
  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;
  const tabItems = catalog[currentTab] ?? [];
  const visibleItems = filterPrototypeShopItems(tabItems, currentTab, filters);

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
    <div className="origin-item-dialog class-prototype-shop" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="false" aria-label="Escolher item superior">
      <div className="origin-item-dialog__header">
        <div>
          <strong>Escolher item</strong>
          <span>Até T$ {PROTOTYPE_BASE_ITEM_LIMIT}</span>
        </div>
        <button className="icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <div className="origin-item-tabs">
        {tabs.map((tab) => (
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
      <PrototypeShopFilters activeTab={currentTab} filters={filters} items={tabItems} onToggle={toggleFilter} />
      <PrototypeShopTable activeTab={currentTab} currentItemId={selectedItemId} items={visibleItems} onSelect={onSelect} />
    </div>
  );
}

function PrototypeImprovementShop({ improvements, item, selectedImprovementIds, onClose, onToggle }) {
  const selectedCount = selectedImprovementIds.length;
  const totalPrice = getPrototypeTotalPrice(item, selectedCount);
  return (
    <div className="origin-item-dialog class-prototype-shop" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="false" aria-label="Escolher melhoria">
      <div className="origin-item-dialog__header">
        <div>
          <strong>Escolher melhoria</strong>
          <span>{selectedCount ? `${selectedCount} melhoria(s) | ${formatPrototypePrice(totalPrice)}` : "Escolha uma melhoria"}</span>
        </div>
        <button className="icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <div className="origin-item-table origin-item-table--improvements">
        <div className="origin-item-table__head">
          <span>Melhoria</span>
          <span>Benefício</span>
          <span>Status</span>
        </div>
        <div className="origin-item-table__section">
          <strong>Disponíveis</strong>
          {improvements.map((improvement) => {
            const active = selectedImprovementIds.includes(improvement.id);
            const blockedReason = getImprovementBlockedReason(improvement, selectedImprovementIds, item);
            return (
              <button
                className={`origin-item-table__row${active ? " origin-item-table__row--active" : ""}`}
                disabled={Boolean(blockedReason)}
                key={improvement.id}
                onClick={() => onToggle(improvement.id)}
                type="button"
              >
                <span>{improvement.nome}</span>
                <span>{improvement.resumo ?? "—"}</span>
                <span>{active ? "Selecionada" : blockedReason || "Disponível"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrototypeShopFilters({ activeTab, filters, items, onToggle }) {
  if (activeTab === "weapons") {
    const categoryIds = new Set(items.map((item) => item.categoriaId).filter(Boolean));
    const gripIds = new Set(items.map((item) => item.arma?.empunhaduraId).filter(Boolean));
    const combatIds = new Set(items.map((item) => getWeaponCombatFilterId(item)).filter(Boolean));
    return (
      <div className="origin-item-filter-grid">
        {[
          ["weaponCategory", "simples", "Armas Simples", categoryIds],
          ["weaponCategory", "marcial", "Armas Marciais", categoryIds],
          ["weaponCategory", "exotica", "Armas Exóticas", categoryIds],
          ["weaponCategory", "fogo", "Armas de Fogo", categoryIds],
          ["weaponGrip", "leve", "Leve", gripIds],
          ["weaponGrip", "uma_mao", "Uma Mão", gripIds],
          ["weaponGrip", "duas_maos", "Duas Mãos", gripIds],
          ["weaponCombat", "corpo", "Corpo a Corpo", combatIds],
          ["weaponCombat", "distancia", "À Distância", combatIds]
        ].filter(([, value, , available]) => available.has(value)).map(([key, value, label]) => {
          const active = filters[key].includes(value);
          const disabled = !active && !prototypeFilterOptionHasResults(items, activeTab, filters, key, value);
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
    const categoryIds = new Set(items.map((item) => item.categoriaId).filter(Boolean));
    const options = activeTab === "armors" ? [["leve", "Leve"], ["pesada", "Pesada"]] : [["leve", "Leve"], ["pesado", "Pesado"]];
    return (
      <div className="origin-item-filter-grid origin-item-filter-grid--short">
        {options.filter(([value]) => categoryIds.has(value)).map(([value, label]) => {
          const active = filters[key].includes(value);
          const disabled = !active && !prototypeFilterOptionHasResults(items, activeTab, filters, key, value);
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
    <div className="origin-item-filter-grid origin-item-filter-grid--short">
      {[
        ["equipamento_aventura", "Equipamento de Aventura"],
        ["ferramenta", "Ferramentas"],
        ["vestuario", "Vestuário"],
        ["esoterico", "Esotéricos"],
        ["alquimico_preparado", "Alquímicos Preparados"],
        ["alquimico_catalisador", "Catalisadores Alquímicos"],
        ["alquimico_venenoso", "Venenos"]
      ].filter(([categoryId]) => items.some((item) => item.categoriaId === categoryId)).map(([categoryId, label]) => {
        const active = filters.generalCategory.includes(categoryId);
        return (
          <button
            className={`origin-item-filter${active ? " origin-item-filter--active" : ""}`}
            key={categoryId}
            onClick={() => onToggle("generalCategory", categoryId)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PrototypeShopTable({ activeTab, currentItemId, items, onSelect }) {
  if (activeTab === "weapons") {
    const groups = buildPrototypeWeaponGroups(items);
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
                  <PrototypeShopRow currentItemId={currentItemId} item={item} key={item.id} onSelect={onSelect}>
                    <span>{item.nome}</span>
                    <span>{formatPrototypePrice(getItemPrice(item))}</span>
                    <span>{formatWeaponDamage(item)}</span>
                    <span>{formatWeaponCritical(item)}</span>
                    <span>{formatWeaponDamageType(item)}</span>
                    <span>{formatItemSpaces(item)}</span>
                  </PrototypeShopRow>
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
            <PrototypeShopRow currentItemId={currentItemId} item={item} key={item.id} onSelect={onSelect}>
              <span>{item.nome}</span>
              <span>{formatPrototypePrice(getItemPrice(item))}</span>
              <span>{formatDefenseBonus(item)}</span>
              <span>{formatArmorPenalty(item)}</span>
              <span>{formatItemSpaces(item)}</span>
            </PrototypeShopRow>
          ))}
        </div>
      </div>
    );
  }

  const groups = groupByOrdered(items, (item) => item.categoriaId).map(([categoryId, categoryItems]) => ({
    id: categoryId,
    label: PROTOTYPE_GENERAL_LABELS[categoryId] ?? categoryId,
    items: categoryItems
  }));
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
            <PrototypeShopRow currentItemId={currentItemId} item={item} key={item.id} onSelect={onSelect}>
              <span>{item.nome}</span>
              <span>{formatPrototypePrice(getItemPrice(item))}</span>
              <span>{formatItemSpaces(item)}</span>
            </PrototypeShopRow>
          ))}
        </div>
      ))}
    </div>
  );
}

function PrototypeShopRow({ children, currentItemId, item, onSelect }) {
  return (
    <button
      className={`origin-item-table__row${currentItemId === item.id ? " origin-item-table__row--active" : ""}`}
      onClick={() => onSelect(item.id)}
      type="button"
    >
      {children}
    </button>
  );
}

function filterPrototypeShopItems(items, activeTab, filters) {
  if (activeTab === "weapons") {
    return items.filter((item) => matchesOptionalFilter(filters.weaponCategory, item.categoriaId)
      && matchesOptionalFilter(filters.weaponGrip, item.arma?.empunhaduraId)
      && matchesOptionalFilter(filters.weaponCombat, getWeaponCombatFilterId(item)));
  }
  if (activeTab === "armors") return items.filter((item) => matchesOptionalFilter(filters.armorCategory, item.categoriaId));
  if (activeTab === "shields") return items.filter((item) => matchesOptionalFilter(filters.shieldCategory, item.categoriaId));
  return items.filter((item) => matchesOptionalFilter(filters.generalCategory, item.categoriaId));
}

function prototypeFilterOptionHasResults(items, activeTab, filters, key, value) {
  return filterPrototypeShopItems(items, activeTab, { ...filters, [key]: [value] }).length > 0;
}

function matchesOptionalFilter(selected, value) {
  return !selected?.length || selected.includes(value);
}

function buildPrototypeWeaponGroups(items) {
  return groupByOrdered(items, (item) => item.categoriaId).map(([categoryId, categoryItems]) => ({
    id: `armas_${categoryId}`,
    label: `Armas ${WEAPON_CATEGORY_LABELS[categoryId] ?? categoryId}`,
    items: groupByOrdered(categoryItems, getWeaponSubgroupId).map(([subgroupId, subgroupItems]) => ({
      id: subgroupId,
      label: WEAPON_SUBGROUP_LABELS[subgroupId] ?? subgroupId,
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

function getWeaponCombatFilterId(item) {
  if (item.arma?.combateId === "a_distancia") return "distancia";
  if (item.arma?.combateId === "corpo_a_corpo") return "corpo";
  return item.arma?.combateId;
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

function formatWeaponDamageType(item) {
  const types = item.arma?.tipoDanoIds ?? [];
  return types.length ? types.map((type) => DAMAGE_TYPE_LABELS[type] ?? type).join(", ") : "—";
}

function formatDefenseBonus(item) {
  if (item.tipo === "armadura") return formatBonus(item.armadura?.defesa);
  if (item.tipo === "escudo") return formatBonus(item.escudo?.bonusDefesa);
  return "—";
}

function formatArmorPenalty(item) {
  if (item.tipo === "armadura") return formatNumberOrDash(item.armadura?.penalidade);
  if (item.tipo === "escudo") return formatNumberOrDash(item.escudo?.penalidade);
  return "—";
}

function formatBonus(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number > 0 ? `+${number}` : String(number);
}

function formatNumberOrDash(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "—";
}

function formatItemSpaces(item) {
  return item.espacos === null || item.espacos === undefined ? "—" : String(item.espacos).replace(".", ",");
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

const DAMAGE_TYPE_LABELS = {
  acido: "Ácido",
  corte: "Corte",
  impacto: "Impacto",
  perfuracao: "Perfuração"
};

const PROTOTYPE_GENERAL_LABELS = {
  equipamento_aventura: "Equipamento de Aventura",
  esoterico: "Esotéricos",
  ferramenta: "Ferramentas",
  vestuario: "Vestuário",
  alquimico_preparado: "Alquímicos Preparados",
  alquimico_catalisador: "Catalisadores Alquímicos",
  alquimico_venenoso: "Venenos"
};

function ClassGrantedSkills({ fixedEntries, classChoices, trainedIds, selectedOficios = [], onFixedChoice, onSetOficio }) {
  const [openOficioSlot, setOpenOficioSlot] = useState(null);
  const [oficioAnchor, setOficioAnchor] = useState(null);
  if (!fixedEntries.length) return null;

  return (
    <div className="class-granted-skills">
      <div className="class-granted-skills__grid">
        {fixedEntries.map((entry, index) => {
          if (entry.tipo === "escolha") {
            const choiceKey = `fixa_${index}`;
            const selected = classChoices.periciasFixas?.[choiceKey] ?? "";
            return (
              <div className="class-skill-choice-inline" key={choiceKey}>
                {(entry.opcoes ?? []).map((option, optionIndex) => (
                  <span className="class-skill-choice-inline__item" key={`${choiceKey}-${option.id}`}>
                    {optionIndex > 0 ? <span className="class-skill-choice-inline__or">ou</span> : null}
                    <button
                  className={`choice-button${selected === option.id ? " choice-button--active" : ""}`}
                  onClick={() => onFixedChoice(choiceKey, option.id)}
                  type="button"
                >
                  {nomePericia(option.id)}
                </button>
                  </span>
                ))}
              </div>
            );
          }

          return (
            <button
              className={`choice-button${trainedIds.has(entry.id) ? " choice-button--active" : ""}`}
              disabled={entry.id !== "oficio"}
              key={entry.id}
              onClick={entry.id === "oficio" ? (event) => {
                setOpenOficioSlot(`fixa_${index}`);
                setOficioAnchor(event.currentTarget.getBoundingClientRect());
              } : undefined}
              type="button"
            >
              {entry.id === "oficio" && classChoices.oficiosFixos?.[`fixa_${index}`]
                ? `Ofício (${getOficioLabel(classChoices.oficiosFixos[`fixa_${index}`]).toLowerCase()})`
                : entry.id === "oficio" ? "Escolha o Ofício" : nomePericia(entry.id)}
            </button>
          );
        })}
      </div>
      {openOficioSlot ? (
        <OficioPopover
          currentOficioId={classChoices.oficiosFixos?.[openOficioSlot] ?? ""}
          anchorRect={oficioAnchor}
          onClose={() => setOpenOficioSlot(null)}
          onSelect={(oficioId) => {
            onSetOficio(openOficioSlot, oficioId);
            setOpenOficioSlot(null);
          }}
          selectedOficios={selectedOficios}
        />
      ) : null}
    </div>
  );
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

function OficioPicker({ selected, onSelect }) {
  return (
    <div className="class-skill-block">
      <div className="builder-section__header">
        <div>
          <h3>Ofício</h3>
          <p>Escolha a profissão treinada.</p>
        </div>
      </div>
      <div className="choice-button-grid choice-button-grid--compact">
        {OFICIOS.map((oficio) => (
          <button
            className={`choice-button${selected === oficio.id ? " choice-button--active" : ""}`}
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

function OficioOptions({ selectedOficios = [], onToggleOficio }) {
  const selectedSet = new Set(selectedOficios);
  return (
    <div className="class-oficio-options">
      <div className="choice-button-grid choice-button-grid--compact">
        {OFICIOS.map((oficio) => (
          <button
            className={`choice-button${selectedSet.has(oficio.id) ? " choice-button--active" : ""}`}
            key={oficio.id}
            onClick={() => onToggleOficio?.(oficio.id)}
            type="button"
          >
            {oficio.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OficioPopover({ currentOficioId = "", disableNew = false, selectedOficios = [], anchorRect, onClose, onSelect }) {
  const selectedSet = new Set(selectedOficios);
  const popoverWidth = 620;
  const style = anchorRect && typeof window !== "undefined"
    ? {
        left: Math.max(12, Math.min(anchorRect.left, window.innerWidth - popoverWidth - 12)),
        top: anchorRect.bottom + 8,
        width: `min(${popoverWidth}px, calc(100vw - 24px))`
      }
    : undefined;

  return (
    <div className="class-oficio-popover" role="dialog" aria-modal="false" aria-label="Escolher oficio" style={style}>
      <div className="class-oficio-popover__header">
        <strong>Ofício</strong>
        <button className="icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>

      <div className="choice-button-grid choice-button-grid--compact">
        {OFICIOS.filter((oficio) => {
          const active = currentOficioId === oficio.id;
          return active || !selectedSet.has(oficio.id);
        }).map((oficio) => {
          const active = currentOficioId === oficio.id;
          // Se estamos selecionando novo (currentOficioId === ""), desabilita os já selecionados
          const alreadySelectedElsewhere = false;
          return (
            <button
              className={`choice-button${active ? " choice-button--active" : ""}`}
              disabled={!active && disableNew}
              key={oficio.id}
              onClick={() => onSelect(oficio.id)}
              title={alreadySelectedElsewhere ? "Já selecionado em outra perícia" : ""}
              type="button"
            >
              {oficio.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SkillPicker({ title, description, limit, selected, options, blockedIds, onToggle, onToggleOficio, onChangeOficio, selectedOficios = [] }) {
  const [oficioSlot, setOficioSlot] = useState(null);
  const [oficioAnchor, setOficioAnchor] = useState(null);
  const selectedSet = new Set(selected);
  const currentOficiosSet = new Set(
    selected
      .filter((id) => String(id).startsWith("oficio:"))
      .map((id) => String(id).slice("oficio:".length))
  );

  // Construir lista combinada: perícias + ofício genérico + ofícios selecionados em ordem alfabética
  const allItems = [];
  
  // Adicionar perícias normais
  options.forEach((option) => {
    if (option.id !== "oficio") {
      allItems.push({
        type: "pericia",
        id: option.id,
        nome: nomePericia(option.id),
        selected: selectedSet.has(option.id),
        blocked: blockedIds.has(option.id) && !selectedSet.has(option.id)
      });
    }
  });

  // Adicionar botão genérico "Ofício"
  allItems.push({
    type: "oficio-generic",
    id: "oficio",
    nome: "Escolha o Ofício",
    selected: false
  });

  // Adicionar ofícios selecionados como botões especiais
  [...currentOficiosSet].forEach((oficioId) => {
    allItems.push({
      type: "oficio-selected",
      id: `oficio:${oficioId}`,
      nome: `Ofício (${getOficioLabel(oficioId).toLowerCase()})`,
      oficioId,
      selected: true
    });
  });

  // Ordenar alfabeticamente, mantendo Ofício (...) imediatamente antes do botão Ofício.
  allItems.sort(compareSkillItems);

  return (
    <div className="class-skill-block">
      <div className="builder-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="pill">
          {selected.length}/{limit}
        </span>
      </div>

      <div className="choice-button-grid">
        {allItems.map((item) => {
          if (item.type === "oficio-selected") {
            return (
              <button
                className="choice-button choice-button--active choice-button--oficio-selected"
                key={item.id}
                onClick={(event) => {
                  setOficioSlot(item.oficioId);
                  setOficioAnchor(event.currentTarget.getBoundingClientRect());
                }}
                type="button"
              >
                <span className="choice-button__text">{item.nome}</span>
                <button
                  className="choice-button__close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOficio?.(item.oficioId);
                  }}
                  type="button"
                  title="Remover ofício"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </button>
            );
          }

          if (item.type === "oficio-generic") {
            const disabled = selected.length >= limit && limit > 0;
            return (
              <button
                className="choice-button"
                disabled={disabled}
                key={item.id}
                onClick={(event) => {
                  setOficioSlot("__novo__");
                  setOficioAnchor(event.currentTarget.getBoundingClientRect());
                }}
                type="button"
              >
                {item.nome}
              </button>
            );
          }

          // Perícia normal
          const disabled = item.blocked || (!item.selected && selected.length >= limit && limit > 0);
          return (
            <button
              className={`choice-button${item.selected ? " choice-button--active" : ""}`}
              disabled={disabled}
              key={item.id}
              onClick={() => onToggle(item.id)}
              type="button"
            >
              {item.nome}
            </button>
          );
        })}
      </div>

      {oficioSlot && options.some((option) => option.id === "oficio") ? (
        <OficioPopover
          currentOficioId={oficioSlot === "__novo__" ? "" : oficioSlot}
          anchorRect={oficioAnchor}
          disableNew={oficioSlot === "__novo__" && selected.length >= limit}
          onClose={() => setOficioSlot(null)}
          onSelect={(oficioId) => {
            if (oficioSlot === "__novo__") {
              onToggleOficio?.(oficioId);
            } else {
              onChangeOficio?.(oficioSlot, oficioId);
            }
            setOficioSlot(null);
          }}
          selectedOficios={selectedOficios}
          currentSectionOficios={[...currentOficiosSet]}
        />
      ) : null}
    </div>
  );
}

function calcularRecursos(classe, race, raceChoices, attrs, nivel) {
  const pvCfg = classe?.caracteristicas?.pv;
  const pmCfg = classe?.caracteristicas?.pm;
  if (!classe) return {};

  const pvRacial = race ? coletarBonusPvRacial(race, raceChoices, nivel) : 0;
  const pmRacial = race ? coletarBonusPmRacial(race, raceChoices, nivel) : 0;
  const pvRacialDetalhes = race ? detalharBonusPvRacial(race, raceChoices, nivel).detalhes : [];
  const pmRacialDetalhes = race ? detalharBonusPmRacial(race, raceChoices, nivel).detalhes : [];
  const pvClasse = pvCfg
    ? (pvCfg.inicial ?? 0) + (pvCfg.porNivel ?? 0) * Math.max(0, nivel - 1) + (pvCfg.somaConstituicao ? (attrs.con ?? 0) * nivel : 0)
    : null;
  const pmClasse = pmCfg ? (pmCfg.porNivel ?? 0) * nivel : null;

  return {
    pv: pvClasse !== null ? pvClasse + pvRacial : null,
    pm: pmClasse !== null ? pmClasse + pmRacial : null,
    pvFormula: pvCfg ? formatPvBaseFormula(pvCfg) : null,
    pmFormula: pmCfg ? `${pmCfg.porNivel ?? 0} por nível` : null,
    pvBonusFormula: formatPvBonusFormula(pvRacialDetalhes),
    pmBonusFormula: formatPmBonusFormula(pmRacialDetalhes)
  };
}

function formatPvBaseFormula(pvCfg) {
  const parts = [`${pvCfg.inicial ?? 0} inicial`, `${pvCfg.porNivel ?? 0} por nível`];
  if (pvCfg.somaConstituicao) parts.push("CON por nível");
  return parts.join(" + ");
}

function formatPvBonusFormula(detalhes) {
  const parts = [];
  for (const detalhe of detalhes) {
    if (detalhe.inicial) parts.push(`+${detalhe.inicial} PV bonus inicial`);
    if (detalhe.porNivelApos1) parts.push(`+${detalhe.porNivelApos1} PV bonus por nível`);
  }
  return parts.join(" + ");
}

function formatPmBonusFormula(detalhes) {
  const parts = [];
  for (const detalhe of detalhes) {
    if (detalhe.porNivel) parts.push(`+${detalhe.porNivel} PM bonus por nível`);
  }
  return parts.join(" + ");
}

function calcularPericias(classe, race, raceChoices, classChoices, attrs, nivel) {
  const fixedDirect = new Set();
  const fixedChoices = new Set(Object.values(classChoices.periciasFixas ?? {}).filter(Boolean).map(getPericiaBaseId));
  const fixedChoiceEntries = (classe?.caracteristicas?.pericias?.fixas ?? []).filter((entry) => entry.tipo === "escolha");
  for (const entry of classe?.caracteristicas?.pericias?.fixas ?? []) {
    if (entry.id && entry.id !== "oficio") fixedDirect.add(entry.id);
  }

  const selectedRaceSkills = sanitizeSelection(classChoices.periciasRaca, PERICIAS);
  const selectedClassSkills = sanitizeSelection(classChoices.periciasClasse, classe?.caracteristicas?.pericias?.escolhas?.opcoes ?? []);
  const selectedIntSkills = sanitizeSelection(classChoices.periciasInteligencia, PERICIAS);
  const selectedOficios = getSelectedOficios(classChoices);
  const classChoiceGrantedSkills = getClassChoiceGrantedSkills(classChoices);
  const treinadasRaciais = race ? coletarPericiasTreinadasRaciais(race, raceChoices) : new Set();
  const bonusRacial = race ? calcularBonusPericiasRaciais(race, raceChoices) : {};

  const treinadas = new Set([...fixedDirect, ...fixedChoices, ...selectedRaceSkills.map(getPericiaBaseId), ...selectedClassSkills.map(getPericiaBaseId), ...selectedIntSkills.map(getPericiaBaseId), ...classChoiceGrantedSkills, ...treinadasRaciais]);
  if (selectedOficios.length > 0) treinadas.add("oficio");
  const raceChoiceLimit = race ? coletarQuantidadePericiasRaciaisEscolhiveis(race, raceChoices) : 0;
  const classChoiceLimit = classe?.caracteristicas?.pericias?.escolhas?.quantidade ?? 0;
  const intChoiceLimit = Math.max(0, Number(attrs.int ?? 0));
  const blockedForClassChoices = new Set([...fixedDirect, ...fixedChoices, ...treinadasRaciais]);
  const blockedForIntChoices = new Set([...fixedDirect, ...fixedChoices, ...selectedClassSkills.map(getPericiaBaseId), ...treinadasRaciais]);
  const blockedForRaceChoices = new Set([...fixedDirect, ...fixedChoices, ...selectedClassSkills.map(getPericiaBaseId), ...selectedIntSkills.map(getPericiaBaseId), ...treinadasRaciais]);
  const fixedChoicesComplete = fixedChoiceEntries.every((_, index) => Boolean(classChoices.periciasFixas?.[`fixa_${index}`]));
  const classChoicesComplete = fixedChoicesComplete && selectedClassSkills.length >= classChoiceLimit;
  const classChoiceOptions = filterSkillOptions(classe?.caracteristicas?.pericias?.escolhas?.opcoes ?? [], blockedForClassChoices, selectedClassSkills, selectedOficios);
  const intChoiceOptions = filterSkillOptions(PERICIAS, blockedForIntChoices, selectedIntSkills, selectedOficios);
  const raceChoiceOptions = filterSkillOptions(PERICIAS, blockedForRaceChoices, selectedRaceSkills, selectedOficios);

  const pericias = PERICIAS.map((pericia) => {
    const treinada = treinadas.has(pericia.id);
    const attrVal = attrs[pericia.atributo] ?? 0;
    const racial = bonusRacial[pericia.id] ?? 0;
    const bonusTreino = treinada ? bonusTreinoPorNivel(nivel) : 0;
    const total = calcularTotalPericia({ atributo: attrVal, nivel, treinada, bonusDiversos: racial });
    return {
      ...pericia,
      treinada,
      attrVal,
      bonusTreino,
      total,
      bloqueada: Boolean(pericia.requerTreinamento && !treinada)
    };
  });

  return {
    treinadas,
    pericias,
    raceChoiceLimit,
    classChoiceLimit,
    intChoiceLimit,
    selectedRaceSkills,
    selectedClassSkills,
    selectedIntSkills,
    selectedOficios,
    classChoiceOptions,
    intChoiceOptions,
    raceChoiceOptions,
    blockedForRaceChoices,
    blockedForClassChoices,
    blockedForIntChoices,
    classChoicesComplete
  };
}

function getClassChoiceGrantedSkills(classChoices = {}) {
  const granted = [];
  if (classChoices.arcanista?.linhagemId === "linhagem_feerica") granted.push("enganacao");
  return granted;
}

function sanitizeSelection(selection = [], options = []) {
  const allowed = new Set(options.map((option) => option.id));
  return Array.isArray(selection) ? selection.filter((id) => allowed.has(getPericiaBaseId(id))) : [];
}

function getPericiaBaseId(periciaId) {
  return String(periciaId ?? "").startsWith("oficio:") ? "oficio" : periciaId;
}

function oficioSelectionId(oficioId) {
  return `oficio:${oficioId}`;
}

function getOficioLabel(oficioId) {
  return OFICIOS.find((oficio) => oficio.id === oficioId)?.label ?? oficioId;
}

function compareSkillItems(a, b) {
  const aName = a.type?.startsWith("oficio") ? "Ofício" : a.nome;
  const bName = b.type?.startsWith("oficio") ? "Ofício" : b.nome;
  const base = aName.localeCompare(bName);
  if (base !== 0) return base;
  if (a.type === "oficio-selected" && b.type === "oficio-generic") return -1;
  if (a.type === "oficio-generic" && b.type === "oficio-selected") return 1;
  return a.nome.localeCompare(b.nome);
}

function getSelectedOficios(classChoices = {}) {
  // Ofícios fixos vêm com IDs simples (ex: "alquimista")
  const fixed = Array.isArray(classChoices.oficiosFixos)
    ? classChoices.oficiosFixos
    : Object.values(classChoices.oficiosFixos ?? {});
  
  // Ofícios de perícias vêm com "oficio:" prefix (ex: "oficio:alquimista")
  const fromSelections = [
    ...(classChoices.periciasClasse ?? []),
    ...(classChoices.periciasInteligencia ?? []),
    ...(classChoices.periciasRaca ?? [])
  ]
    .filter((id) => String(id).startsWith("oficio:"))
    .map((id) => String(id).slice("oficio:".length));
  
  // Combinar e deduplica
  return [...new Set([...fixed.filter(Boolean), ...fromSelections])];
}

function filterSkillOptions(options, blockedIds, selectedIds, selectedOficios) {
  const selectedBaseIds = new Set(selectedIds.map(getPericiaBaseId));
  const hasOficioAvailable = selectedOficios.length < OFICIOS.length;
  return options.filter((option) => {
    if (option.id === "oficio") return hasOficioAvailable || selectedBaseIds.has("oficio");
    return selectedBaseIds.has(option.id) || !blockedIds.has(option.id);
  });
}

function bonusTreinoPorNivel(nivel) {
  if (nivel >= 15) return 6;
  if (nivel >= 7) return 4;
  return 2;
}

function calcularQuantidadePoderesClasse(classe, nivel) {
  let total = 0;
  for (const habilidade of classe?.habilidades ?? []) {
    for (const efeito of habilidade.efeitos ?? []) {
      if (efeito.tipo !== "escolha_poder_classe") continue;
      const nivelInicial = Number(efeito.nivelInicial ?? habilidade.nivel ?? 1);
      if (nivel < nivelInicial) continue;
      if (efeito.frequencia === "todo_nivel") {
        total += nivel - nivelInicial + 1;
      } else {
        total += 1;
      }
    }
  }
  return total;
}

function avaliarPreRequisitosPoder(power, { attrs, nivel, periciasTreinadas, poderesSelecionados }) {
  const req = power.preRequisitos ?? {};
  const motivos = [];

  if (req.nivelClasse && nivel < Number(req.nivelClasse)) {
    motivos.push(`${req.nivelClasse}º nível de guerreiro`);
  }

  for (const [atributo, valor] of Object.entries(req.atributos ?? {})) {
    if (Number(attrs[atributo] ?? 0) < Number(valor)) {
      motivos.push(`${atributo.toUpperCase()} ${valor}`);
    }
  }

  for (const periciaId of req.periciasTreinadas ?? []) {
    if (!periciasTreinadas.has(periciaId)) {
      motivos.push(`${nomePericia(periciaId)} treinada`);
    }
  }

  for (const poderId of req.poderes ?? []) {
    if (!poderesSelecionados.includes(poderId)) {
      motivos.push(nomePoderSelecionado(poderId));
    }
  }

  return { ok: motivos.length === 0, motivos };
}

function nomePoderSelecionado(poderId) {
  const nomes = {
    guerreiro_especializacao_em_arma: "Especialização em Arma"
  };
  return nomes[poderId] ?? poderId;
}

function removeOne(items, target) {
  const index = items.indexOf(target);
  if (index < 0) return items;
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

function formatSigned(value) {
  const number = Number(value ?? 0);
  return number > 0 ? `+${number}` : String(number);
}
