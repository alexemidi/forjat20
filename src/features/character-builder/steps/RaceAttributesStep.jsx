import { useMemo } from "react";
import { SelectInput, TextInput } from "../../../shared/ui/TextInput.jsx";
import { calcularPatamarParaNivel, criarMontariaParaRaca } from "../../../core/rules/combate.js";
import {
  ATRIBUTOS,
  calcularAtributosComEscolhas,
  calcularBonusRacial,
  calcularCustoAtributos,
  getAllRaceChoices,
  getRaceFlexibleRules,
  getRaceFixedAbilities,
  getRaceSelectedAbilities,
  selecoesFlexiveis
} from "../model/atributos.js";

const ATTRIBUTE_POINT_MIN = -1;
const ATTRIBUTE_POINT_MAX = 4;
const POINT_BUDGET = 10;

const DUENDE_PRESENTES = [
  "Afinidade Elemental",
  "Encantar Objetos",
  "Enfeitiçar",
  "Invisibilidade",
  "Língua da Natureza",
  "Mais Lá do que Aqui",
  "Maldição",
  "Metamorfose Animal",
  "Sonhos Proféticos",
  "Velocidade do Pensamento",
  "Visão Feérica",
  "Voo"
];

const DUENDE_TABUS = [
  "Sempre remenda as roupas de qualquer mortal dormindo no mesmo teto.",
  "Come apenas carne crua.",
  "Nunca pode ouvir um agradecimento.",
  "Sempre entra em qualquer lugar de costas.",
  "Não revela o próprio nome.",
  "Compõe um poema descrevendo a morte de cada um que encontra.",
  "Não pode ver crianças em noites de lua cheia.",
  "Nunca senta em cadeiras.",
  "Carrega um pote fechado dizendo ser seu coração.",
  "Usa sapatos minúsculos e reclama de dor.",
  "Age como paralisado se sal tocar sua pele.",
  "Um dia por semana, usa outro nome e personalidade.",
  "Varre qualquer cômodo onde esteja.",
  "Tem pavor do próprio reflexo.",
  "Nunca aceita favor sem pagar uma moeda.",
  "Cobre os olhos ao passar por templos.",
  "Rouba um garfo de qualquer casa que entre.",
  "Atravessa todos os espinheiros que encontra.",
  "Responde perguntas com outras perguntas.",
  "Não fala a verdade um dia por mês.",
  "Lembra-se de atraso e some por horas.",
  "Não olha pessoas feridas nos olhos."
];

export function RaceAttributesStep({ catalogs, draft, updateDraft }) {
  const selectedRace = catalogs.races.find((race) => race.id === draft.info.racaId);
  const raceChoices = draft.escolhas.raca ?? {};
  const finalAttributes = useMemo(
    () => calcularAtributosComEscolhas(draft.atributosBase, selectedRace, raceChoices),
    [draft.atributosBase, selectedRace, raceChoices]
  );
  const cost = calcularCustoAtributos(draft.atributosBase);
  const remainingPoints = POINT_BUDGET - cost;

  function setBaseAttribute(attributeId, nextValue) {
    const value = clamp(nextValue, ATTRIBUTE_POINT_MIN, ATTRIBUTE_POINT_MAX);
    updateDraft(`atributosBase.${attributeId}`, value);
  }

  function setRaceChoice(path, value) {
    updateDraft(`escolhas.raca.${path}`, value);
  }

  function setSex(value) {
    updateDraft("info.sexo", value);
    if (selectedRace?.id === "nagah") {
      updateDraft("escolhas.raca.opcoes.nagah_sexo", value === "feminino" ? "nagah_femea" : "nagah_macho");
    }
  }

  function setLevel(value) {
    const nivel = Number(value);
    updateDraft("info.nivel", nivel);
    updateDraft("info.patamarId", calcularPatamarParaNivel(nivel));
  }

  function selectRace(raceId) {
    const race = catalogs.races.find((r) => r.id === raceId);
    const corpo = {
      tamanhoId: race?.corpo?.tamanhoId ?? "medio",
      deslocamentoBase: race?.corpo?.deslocamentoBase ?? 9,
      alcanceNatural: race?.corpo?.alcanceNatural ?? 1.5
    };

    updateDraft("info.racaId", raceId);
    updateDraft("escolhas.raca", { opcoes: {}, flexiveis: {}, duende: {}, golem: {} });
    updateDraft("corpo", {
      ...corpo,
      montaria: criarMontariaParaRaca(raceId, corpo)
    });
    if (raceId === "nagah") {
      const sexo = draft.info.sexo === "feminino" ? "feminino" : "masculino";
      updateDraft("info.sexo", sexo);
      updateDraft("escolhas.raca.opcoes.nagah_sexo", sexo === "feminino" ? "nagah_femea" : "nagah_macho");
    }
  }

  function toggleFlex(scope, attributeId, rules) {
    const current = selecoesFlexiveis(raceChoices, scope);
    const isSelected = current.includes(attributeId);
    const limit = Number(rules?.quantidade ?? 0);
    const allowRepeat = Boolean(rules?.permitirRepetir);
    let next;

    if (isSelected) {
      next = current.filter((id) => id !== attributeId);
    } else if (!allowRepeat && current.length >= limit) {
      next = [...current.slice(1), attributeId];
    } else {
      next = [...current, attributeId];
    }

    setRaceChoice(`flexiveis.${scope}`, next);
  }

  function toggleDuendeArray(path, value, limit) {
    const current = raceChoices.duende?.[path] ?? [];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : current.length >= limit
        ? [...current.slice(1), value]
        : [...current, value];
    setRaceChoice(`duende.${path}`, next);
  }

  function selectRandomDuende() {
    const naturezaChoice = getRaceChoice(selectedRace, "duende_natureza");
    const tamanhoChoice = getRaceChoice(selectedRace, "duende_tamanho");
    const presentesChoice = getRaceChoice(selectedRace, "duende_presentes");
    const tabuChoice = getRaceChoice(selectedRace, "duende_tabu");
    const afinidadeChoice = getSubChoice(
      getChoiceOption(presentesChoice, "Afinidade Elemental"),
      "duende_afinidade_elemental_elemento"
    );
    const naturezas = optionIds(naturezaChoice, ["animal", "vegetal", "mineral"]);
    const tamanhos = optionIds(tamanhoChoice, ["minusculo", "pequeno", "medio", "grande"]);
    const atributos = ATRIBUTOS.map((attribute) => attribute.id);
    const presentes = shuffle(optionIds(presentesChoice, DUENDE_PRESENTES)).slice(0, 3);

    updateDraft("escolhas.raca.duende", {
      natureza: pick(naturezas),
      naturezaAtributo: pick(atributos),
      tamanho: pick(tamanhos),
      dons: shuffle(atributos).slice(0, 2),
      presentes,
      afinidade: presentes.includes("Afinidade Elemental") ? pick(optionIds(afinidadeChoice, ["agua", "fogo", "vegetacao"])) : "",
      tabu: pick(optionIds(tabuChoice, DUENDE_TABUS)),
      tabuPenalidade: pick(tabuChoice?.penalidades ?? ["Diplomacia", "Iniciativa", "Luta", "Percepção"]),
      aleatorio: true
    });
  }

  return (
    <div className="builder-step">
      <header className="builder-step__header">
        <div>
          <h1 className="section-title">Raça e Atributos</h1>
          <p className="section-subtitle">
            Defina identidade, raça, escolhas raciais e distribuição de pontos.
          </p>
        </div>
        <span className={`pill ${remainingPoints < 0 ? "pill--danger" : ""}`}>
          {remainingPoints} pontos
        </span>
      </header>

      <div className="builder-form-grid builder-form-grid--identity">
        <TextInput
          id="character-name"
          label="Nome do personagem *"
          onChange={(event) => updateDraft("info.nome", event.target.value)}
          value={draft.info.nome}
        />
        <TextInput
          id="player-name"
          label="Nome do jogador"
          onChange={(event) => updateDraft("info.jogador", event.target.value)}
          value={draft.info.jogador}
        />
        <SelectInput
          id="character-sex"
          label="Sexo"
          onChange={(event) => setSex(event.target.value)}
          value={draft.info.sexo}
        >
          {selectedRace?.id !== "nagah" ? <option value="">Não definido</option> : null}
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
          {selectedRace?.id !== "nagah" ? <option value="outro">Outro</option> : null}
        </SelectInput>
        <TextInput
          id="character-level"
          label="Nível"
          min="1"
          onChange={(event) => setLevel(event.target.value)}
          type="number"
          value={draft.info.nivel}
        />
        <SelectInput
          id="character-race"
          label="Raça"
          onChange={(event) => selectRace(event.target.value)}
          value={draft.info.racaId}
        >
          <option value="">Selecione</option>
          {catalogs.races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.nome}
            </option>
          ))}
        </SelectInput>
      </div>

      <section className="builder-section">
        <div className="builder-section__header">
          <h2>Atributos Base</h2>
          <span className="muted">Custo usado: {cost}/10</span>
        </div>
        <div className="attribute-grid attribute-grid--builder">
          {ATRIBUTOS.map((attribute) => {
            const baseValue = Number(draft.atributosBase[attribute.id] ?? 0);
            const racialBonus = calcularBonusRacial(selectedRace, raceChoices, attribute.id);
            const canIncrease =
              baseValue < ATTRIBUTE_POINT_MAX &&
              calcularCustoAtributos({ ...draft.atributosBase, [attribute.id]: baseValue + 1 }) <= POINT_BUDGET;

            return (
              <div className="attribute-box attribute-box--builder" key={attribute.id}>
                <strong>{attribute.nome}</strong>
                <div className="attribute-stepper">
                  <button
                    onClick={() => setBaseAttribute(attribute.id, baseValue - 1)}
                    disabled={baseValue <= ATTRIBUTE_POINT_MIN}
                    type="button"
                  >
                    -
                  </button>
                  <span>{baseValue}</span>
                  <button
                    onClick={() => setBaseAttribute(attribute.id, baseValue + 1)}
                    disabled={!canIncrease}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <span className="muted">Raça {formatSigned(racialBonus)}</span>
                <span className="attribute-final">{finalAttributes[attribute.id]}</span>
              </div>
            );
          })}
        </div>
        <p className={`points-note ${remainingPoints < 0 ? "points-note--danger" : ""}`}>
          Use até 10 pontos. Reduzir um atributo para -1 devolve 1 ponto. A raça é somada à direita.
        </p>
      </section>

      {selectedRace ? (
        <section className="builder-section">
          <div className="builder-section__header">
            <h2>{selectedRace.nome}</h2>
          </div>
          <RaceAttributesSummary race={selectedRace} raceChoices={raceChoices} />
          <RaceChoiceControls
            race={selectedRace}
            raceChoices={raceChoices}
            setRaceChoice={setRaceChoice}
            updateDraft={updateDraft}
            toggleFlex={toggleFlex}
          />
          {selectedRace.id === "duende" ? (
            <DuendeControls
              race={selectedRace}
              choices={raceChoices.duende ?? {}}
              setRaceChoice={setRaceChoice}
              toggleDuendeArray={toggleDuendeArray}
              selectRandomDuende={selectRandomDuende}
            />
          ) : null}
          {selectedRace.id === "golem_desperto" ? (
            <GolemDespertoControls
              race={selectedRace}
              choices={raceChoices.golem ?? {}}
              raceChoices={raceChoices}
              setRaceChoice={setRaceChoice}
              toggleFlex={toggleFlex}
            />
          ) : null}
          {selectedRace.id === "humano" ? (
            <p className="muted">
              Versátil fica registrado aqui; perícias e poder geral serão escolhidos nas etapas próprias.
            </p>
          ) : null}
          <RaceAbilities race={selectedRace} />
        </section>
      ) : null}
    </div>
  );
}

function RaceAttributesSummary({ race, raceChoices }) {
  const bonuses = ATRIBUTOS
    .map((a) => ({ ...a, bonus: calcularBonusRacial(race, raceChoices, a.id) }))
    .filter((a) => a.bonus !== 0);
  if (!bonuses.length) return null;
  return (
    <p className="race-attributes-summary">
      {bonuses.map((a) => `${a.nome} ${formatSigned(a.bonus)}`).join(", ")}.
    </p>
  );
}

function RaceChoiceControls({ race, raceChoices, setRaceChoice, updateDraft, toggleFlex }) {
  if (race.id === "duende" || race.id === "golem_desperto") return null;

  const hasRaceFlex = Boolean(race.atributos?.flexiveis);
  const raceFlexRules = getRaceFlexibleRules(race, raceChoices);
  const visibleChoices = getAllRaceChoices(race).filter((choice) => choiceOptions(choice).length);

  if (!hasRaceFlex && visibleChoices.length === 0) return null;

  return (
    <div className="race-choice-stack">
      {hasRaceFlex ? (
        <>
          {race.id === "kallyanach" ? (
            <SimpleSegment
              label="Distribuição dos atributos"
              value={raceChoices.distribuicaoAtributos ?? "dois_atributos_1"}
              options={["dois_atributos_1", "um_atributo_2"]}
              labels={{
                dois_atributos_1: "+1 em dois atributos",
                um_atributo_2: "+2 em um atributo"
              }}
              onChange={(value) => {
                setRaceChoice("distribuicaoAtributos", value);
                setRaceChoice("flexiveis.raca", []);
              }}
            />
          ) : null}
          <FlexibleAttributes
            label="Atributos flexíveis da raça"
            rules={raceFlexRules}
            selected={selecoesFlexiveis(raceChoices, "raca")}
            onToggle={(attributeId) => toggleFlex("raca", attributeId, raceFlexRules)}
          />
        </>
      ) : null}

      {visibleChoices.map((choice) => {
        const selectedId = raceChoices.opcoes?.[choice.id] ?? "";
        const selectedIds = Array.isArray(selectedId) ? selectedId : [];
        const options = choiceOptions(choice);
        const selectedOption = options.find((option) => option.id === selectedId);
        const isMultiple = choice.tipo === "escolha_multipla";
        const limit = Number(choice.quantidade ?? 1);

        const selectedOptionObjects = isMultiple
          ? options.filter((option) => selectedIds.includes(option.id))
          : selectedOption ? [selectedOption] : [];

        return (
          <div className="choice-panel" key={choice.id}>
            <label className="choice-label">{choice.nome ?? formatChoiceLabel(choice.id)}</label>
            {choice.descricao ? (
              <p className="choice-panel__description">{choice.descricao}</p>
            ) : null}
            <div className="choice-grid">
              {options.map((option) => {
                const active = isMultiple ? selectedIds.includes(option.id) : selectedId === option.id;
                return (
                <button
                  className={`choice-card ${active ? "choice-card--active" : ""}`}
                  key={option.id}
                  onClick={() => {
                    if (isMultiple) {
                      setRaceChoice(`opcoes.${choice.id}`, toggleSelection(selectedIds, option.id, limit));
                    } else {
                      setRaceChoice(`opcoes.${choice.id}`, option.id);
                    }
                    if (race.id === "nagah") {
                      updateDraft("info.sexo", option.id === "nagah_femea" ? "feminino" : "masculino");
                    }
                  }}
                  type="button"
                >
                  <strong>{option.nome ?? formatChoiceLabel(option.id)}</strong>
                  {formatOptionSummary(option) ? <span>{formatOptionSummary(option)}</span> : null}
                </button>
              );
              })}
            </div>
            {selectedOption?.atributosFlexiveis ? (
              <FlexibleAttributes
                label={`Atributos de ${selectedOption.nome}`}
                rules={selectedOption.atributosFlexiveis}
                selected={selecoesFlexiveis(raceChoices, choice.id)}
                onToggle={(attributeId) => toggleFlex(choice.id, attributeId, selectedOption.atributosFlexiveis)}
              />
            ) : null}
            {selectedOptionObjects.map((opt) => {
              const description = cleanSelectedOptionDescription(race, opt);
              const title = shouldHideSelectedOptionTitle(opt) ? null : opt.nome ?? formatChoiceLabel(opt.id);
              return description || (opt.habilidades ?? []).length ? (
                <ChoiceDescription title={title} key={opt.id}>
                  {description}
                  {(opt.habilidades ?? []).map((h) => (
                    <p key={h.id ?? h.nome} className="choice-description__subtext">
                      <strong>{h.nome}.</strong> {h.descricao}
                    </p>
                  ))}
                </ChoiceDescription>
              ) : null
            })}
          </div>
        );
      })}
    </div>
  );
}

function DuendeControls({ race, choices, setRaceChoice, toggleDuendeArray, selectRandomDuende }) {
  const naturezaChoice = getRaceChoice(race, "duende_natureza");
  const tamanhoChoice = getRaceChoice(race, "duende_tamanho");
  const donsChoice = getRaceChoice(race, "duende_dons");
  const presentesChoice = getRaceChoice(race, "duende_presentes");
  const tabuChoice = getRaceChoice(race, "duende_tabu");
  const naturezaOption = getChoiceOption(naturezaChoice, choices.natureza);
  const tamanhoOption = getChoiceOption(tamanhoChoice, choices.tamanho);
  const presentesOptions = presentesChoice?.opcoes ?? DUENDE_PRESENTES.map((nome) => ({ id: nome, nome }));
  const afinidadeChoice = getSubChoice(
    getChoiceOption(presentesChoice, "Afinidade Elemental"),
    "duende_afinidade_elemental_elemento"
  );
  const afinidadeOption = getChoiceOption(afinidadeChoice, choices.afinidade);

  return (
    <div className="race-choice-stack">
      <button className="choice-card choice-card--wide" onClick={selectRandomDuende} type="button">
        <strong>Criação Aleatória de Nimb</strong>
        <span>Preenche natureza, tamanho, dons, presentes e tabu.</span>
      </button>

      <SimpleSegment
        label="1. Natureza"
        value={choices.natureza ?? ""}
        options={optionIds(naturezaChoice, ["animal", "vegetal", "mineral"])}
        labels={optionLabels(naturezaChoice)}
        onChange={(value) => setRaceChoice("duende.natureza", value)}
      />
      {naturezaOption ? (
        <ChoiceDescription title={naturezaOption.nome}>
          {naturezaOption.descricao}
        </ChoiceDescription>
      ) : null}
      {choices.natureza === "animal" ? (
        <FlexibleAttributes
          label="Atributo da natureza animal"
          rules={naturezaOption?.atributosFlexiveis ?? { quantidade: 1, valor: 1 }}
          selected={choices.naturezaAtributo ? [choices.naturezaAtributo] : []}
          onToggle={(attributeId) => setRaceChoice("duende.naturezaAtributo", attributeId)}
        />
      ) : null}

      <SimpleSegment
        label="2. Tamanho"
        value={choices.tamanho ?? ""}
        options={optionIds(tamanhoChoice, ["minusculo", "pequeno", "medio", "grande"])}
        labels={optionLabels(tamanhoChoice)}
        onChange={(value) => setRaceChoice("duende.tamanho", value)}
      />
      {tamanhoOption ? (
        <ChoiceDescription title={tamanhoOption.nome}>
          {tamanhoOption.descricao}
        </ChoiceDescription>
      ) : null}

      <FlexibleAttributes
        label={`3. Dons (+1 em ${donsChoice?.quantidade ?? 2} atributos)`}
        rules={donsChoice ?? { quantidade: 2, valor: 1 }}
        selected={choices.dons ?? []}
        onToggle={(attributeId) => toggleDuendeArray("dons", attributeId, donsChoice?.quantidade ?? 2)}
      />

      <ChoiceButtons
        label={`4. Presentes (escolha ${presentesChoice?.quantidade ?? 3})`}
        options={presentesOptions.map((option) => option.id)}
        labels={Object.fromEntries(presentesOptions.map((option) => [option.id, option.nome]))}
        selected={choices.presentes ?? []}
        onToggle={(value) => toggleDuendeArray("presentes", value, presentesChoice?.quantidade ?? 3)}
      />
      {(choices.presentes ?? []).map((presente) => {
        const presenteOption = getChoiceOption(presentesChoice, presente) ?? { id: presente, nome: presente };
        return (
        <ChoiceDescription title={presenteOption.nome} key={presente}>
          {presenteOption.descricao}
          {presente === "Afinidade Elemental" ? (
            <>
              <SimpleSegment
                label="Elemento"
                value={choices.afinidade ?? ""}
                options={optionIds(afinidadeChoice, ["agua", "fogo", "vegetacao"])}
                labels={optionLabels(afinidadeChoice)}
                onChange={(value) => setRaceChoice("duende.afinidade", value)}
              />
              {afinidadeOption ? (
                <p className="choice-description__subtext">
                  <strong>{afinidadeOption.nome}.</strong> {afinidadeOption.descricao}
                </p>
              ) : null}
            </>
          ) : null}
        </ChoiceDescription>
      );
      })}

      <SelectInput
        id="duende-tabu"
        label="5. Tabu"
        onChange={(event) => setRaceChoice("duende.tabu", event.target.value)}
        value={choices.tabu ?? ""}
      >
        <option value="">Selecione um tabu</option>
        {(tabuChoice?.opcoes ?? DUENDE_TABUS.map((nome) => ({ id: nome, nome }))).map((tabu) => (
          <option key={tabu.id} value={tabu.id}>
            {tabu.nome}
          </option>
        ))}
      </SelectInput>
      <SimpleSegment
        label="Penalidade do Tabu"
        value={choices.tabuPenalidade ?? ""}
        options={tabuChoice?.penalidades ?? ["Diplomacia", "Iniciativa", "Luta", "Percepção"]}
        onChange={(value) => setRaceChoice("duende.tabuPenalidade", value)}
      />
    </div>
  );
}

function GolemDespertoControls({ race, choices, raceChoices, setRaceChoice, toggleFlex }) {
  const raceSelectedAbilities = getRaceSelectedAbilities(race);
  const chassiChoice = raceSelectedAbilities.find((c) => c.id === "golem_desperto_chassi");
  const fonteChoice = raceSelectedAbilities.find((c) => c.id === "golem_desperto_fonte");
  const tamanhoChoice = raceSelectedAbilities.find((c) => c.id === "golem_desperto_tamanho");

  const chassiOptions = choiceOptions(chassiChoice);
  const fonteOptions = choiceOptions(fonteChoice);
  const tamanhoOptions = choiceOptions(tamanhoChoice);

  const selectedChassi = chassiOptions.find((c) => c.id === choices.chassi);

  const fontesExcluidas =
    choices.chassi === "golem_desperto_carne"
      ? ["Elemental", "Vapor"]
      : choices.chassi === "golem_desperto_gelo_eterno"
      ? ["Vapor"]
      : [];
  const fontesFiltradas = fonteOptions.filter((f) => !fontesExcluidas.includes(f.nome));

  function selectChassi(chassiId) {
    setRaceChoice("golem.chassi", chassiId);
    const excluidas =
      chassiId === "golem_desperto_carne"
        ? ["Elemental", "Vapor"]
        : chassiId === "golem_desperto_gelo_eterno"
        ? ["Vapor"]
        : [];
    if (excluidas.includes(choices.fonte)) {
      setRaceChoice("golem.fonte", "");
      setRaceChoice("golem.elemento", "");
    }
  }

  return (
    <div className="race-choice-stack">
      <div className="choice-panel">
        <label className="choice-label">Chassi</label>
        <div className="choice-grid">
          {chassiOptions.map((opt) => (
            <button
              className={`choice-card ${choices.chassi === opt.id ? "choice-card--active" : ""}`}
              key={opt.id}
              onClick={() => selectChassi(opt.id)}
              type="button"
            >
              <strong>{opt.nome}</strong>
            </button>
          ))}
        </div>
        {selectedChassi ? (
          <ChoiceDescription title={selectedChassi.nome}>
            {selectedChassi.descricao}
            <p className="choice-description__subtext">
              <strong>Obs.</strong> Os atributos do chassi se acumulam com Força +1, Carisma -1 da raça.
              Alterações de tamanho também podem modificar Destreza.
            </p>
          </ChoiceDescription>
        ) : null}
        {selectedChassi?.atributosFlexiveis ? (
          <FlexibleAttributes
            label={`Atributos de ${selectedChassi.nome}`}
            rules={selectedChassi.atributosFlexiveis}
            selected={selecoesFlexiveis(raceChoices, "golem_desperto_chassi")}
            onToggle={(attrId) => toggleFlex("golem_desperto_chassi", attrId, selectedChassi.atributosFlexiveis)}
          />
        ) : null}
      </div>

      <div className="choice-panel">
        <label className="choice-label">Fonte de Energia</label>
        {fontesExcluidas.length ? (
          <p className="choice-panel__description">
            Com chassi {selectedChassi?.nome ?? "selecionado"},{" "}
            {fontesExcluidas.join(" e ")} não {fontesExcluidas.length > 1 ? "estão" : "está"} disponível.
          </p>
        ) : null}
        <div className="choice-grid">
          {fontesFiltradas.map((fonte) => (
            <button
              className={`choice-card ${choices.fonte === fonte.nome ? "choice-card--active" : ""}`}
              key={fonte.nome}
              onClick={() => setRaceChoice("golem.fonte", fonte.nome)}
              type="button"
            >
              <strong>{fonte.nome}</strong>
            </button>
          ))}
        </div>
        {choices.fonte ? (
          <ChoiceDescription title={choices.fonte}>
            {fonteOptions.find((f) => f.nome === choices.fonte)?.descricao}
          </ChoiceDescription>
        ) : null}
      </div>

      {choices.fonte === "Elemental" ? (
        <SimpleSegment
          label="Elemento da Fonte"
          value={choices.elemento ?? ""}
          options={
            choices.chassi === "golem_desperto_gelo_eterno"
              ? ["agua", "ar", "terra"]
              : ["agua", "ar", "fogo", "terra"]
          }
          onChange={(value) => setRaceChoice("golem.elemento", value)}
        />
      ) : null}

      <div className="choice-panel">
        <label className="choice-label">Tamanho</label>
        <div className="choice-grid">
          {tamanhoOptions.map((opt) => (
            <button
              className={`choice-card ${choices.tamanho === opt.nome ? "choice-card--active" : ""}`}
              key={opt.nome}
              onClick={() => setRaceChoice("golem.tamanho", opt.nome)}
              type="button"
            >
              <strong>{formatOption(opt.nome)}</strong>
            </button>
          ))}
        </div>
        {choices.tamanho ? (
          <ChoiceDescription title={formatOption(choices.tamanho)}>
            {tamanhoOptions.find((t) => t.nome === choices.tamanho)?.descricao}
          </ChoiceDescription>
        ) : null}
      </div>
    </div>
  );
}

function RaceAbilities({ race }) {
  if (!race) return null;
  const skills = getRaceFixedAbilities(race).filter((h) => !h.escolha && h.id !== "duende_tabu");
  if (!skills.length) return null;
  return (
    <div className="race-abilities">
      <h3 className="race-abilities__title">Habilidades de {race.nome}</h3>
      {skills.map((skill) => (
        <p key={skill.id ?? skill.nome}>
          <strong>{skill.nome}.</strong> {skill.descricao}
        </p>
      ))}
    </div>
  );
}

function ChoiceDescription({ title, children }) {
  if (!children) return null;

  return (
    <div className="choice-description">
      {title ? <strong>{title}.</strong> : null}
      <div>{children}</div>
    </div>
  );
}

function shouldHideSelectedOptionTitle(option) {
  return Boolean(option?.atributos || option?.atributosFlexiveis);
}

function cleanSelectedOptionDescription(race, option) {
  if (!option?.descricao) return "";
  if (race?.id === "golem_desperto") return option.descricao;

  const withoutAttributeSummary = option.descricao.replace(
    /^(?:Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)\s+[+-]\d+(?:,\s*(?:Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)\s+[+-]\d+)*\.\s*/i,
    ""
  );

  return withoutAttributeSummary.trim();
}

function FlexibleAttributes({ label, rules, selected, onToggle }) {
  const allowed = rules?.atributosPermitidos ?? ATRIBUTOS.map((attribute) => attribute.id);
  return (
    <ChoiceButtons
      label={`${label} (${selected.length}/${rules?.quantidade ?? 0})`}
      options={allowed}
      labels={Object.fromEntries(ATRIBUTOS.map((attribute) => [attribute.id, attribute.nome]))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function SimpleSegment({ label, value, options, labels = {}, onChange }) {
  return (
    <ChoiceButtons
      label={label}
      options={options}
      labels={labels}
      selected={value ? [value] : []}
      onToggle={(nextValue) => onChange(nextValue)}
    />
  );
}

function ChoiceButtons({ label, options, labels = {}, selected, onToggle }) {
  return (
    <div className="choice-panel">
      <label className="choice-label">{label}</label>
      <div className="choice-button-grid">
        {options.map((option) => (
          <button
            className={`choice-button ${selected.includes(option) ? "choice-button--active" : ""}`}
            key={option}
            onClick={() => onToggle(option)}
            type="button"
          >
            {labels[option] ?? formatOption(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function getRaceChoice(race, choiceId) {
  return getRaceSelectedAbilities(race).find((choice) => choice.id === choiceId);
}

function getChoiceOption(choice, optionId) {
  return choiceOptions(choice).find((option) => option.id === optionId);
}

function getSubChoice(option, choiceId) {
  return (option?.subEscolhas ?? []).find((choice) => choice.id === choiceId);
}

function optionIds(choice, fallback = []) {
  const options = choiceOptions(choice);
  return options.length ? options.map((option) => option.id) : fallback;
}

function optionLabels(choice) {
  return Object.fromEntries(choiceOptions(choice).map((option) => [option.id, option.nome ?? option.id]));
}

function choiceOptions(choice) {
  return choice?.opcoes ?? choice?.chassi ?? choice?.sexo ?? choice?.linhagem ?? choice?.talentos ?? choice?.fonte ?? choice?.tamanho ?? [];
}

function toggleSelection(current, value, limit) {
  if (current.includes(value)) return current.filter((entry) => entry !== value);
  if (current.length >= limit) return [...current.slice(1), value];
  return [...current, value];
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatChoiceLabel(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bVariacao\b/i, "Variação");
}

function formatOption(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function formatOptionSummary(option) {
  if (option.periciasTreinadas && option.poderGeral) {
    return `${option.periciasTreinadas} perícia + ${option.poderGeral} poder geral`;
  }
  if (option.periciasTreinadas) return `${option.periciasTreinadas} perícias treinadas`;
  return "";
}

function pick(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function shuffle(values) {
  return [...values].sort(() => 0.5 - Math.random());
}

export function isRaceChoiceComplete(race, raceChoices) {
  if (!race) return false;

  const allChoices = getAllRaceChoices(race);
  if (!allChoices.length) return true;

  if (race.id === "golem_desperto") {
    const golem = raceChoices.golem ?? {};
    return Boolean(golem.chassi && golem.fonte && golem.tamanho);
  }

  if (race.id === "duende") {
    const duendeChoices = getRaceSelectedAbilities(race);
    return duendeChoices.every((choice) => {
      if (!choice.obrigatoria) return true;
      if (choice.id === "duende_natureza") return Boolean(raceChoices.duende?.natureza);
      if (choice.id === "duende_tamanho") return Boolean(raceChoices.duende?.tamanho);
      if (choice.id === "duende_dons") return (raceChoices.duende?.dons?.length ?? 0) >= 2;
      if (choice.id === "duende_presentes") return (raceChoices.duende?.presentes?.length ?? 0) >= 3;
      return true;
    });
  }

  return allChoices.every((choice) => {
    if (!choice.obrigatoria) return true;
    if (choice.tipo === "atributos_flexiveis") return selecoesFlexiveis(raceChoices, choice.id).length >= Number(choice.quantidade ?? 1);
    const value = raceChoices.opcoes?.[choice.id];
    if (Array.isArray(value)) return value.length >= Number(choice.quantidade ?? 1);
    return Boolean(value);
  });
}
