import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { useMemo, useState } from "react";
import { creationPages } from "../../data/catalogos.js";
import { filterCatalogByBooks } from "../../shared/lib/catalogFilters.js";
import { Button } from "../../shared/ui/Button.jsx";
import { criarPersonagemDraft } from "./model/personagemDraft.js";
import { DebugPanel } from "./DebugPanel.jsx";
import { RaceAttributesStep, isRaceChoiceComplete } from "./steps/RaceAttributesStep.jsx";
import { ClassStep } from "./steps/ClassStep.jsx";
import { OriginStep } from "./steps/OriginStep.jsx";
import { ChoiceStep } from "./steps/ChoiceStep.jsx";
import { ReviewStep } from "./steps/ReviewStep.jsx";
import "./CharacterBuilder.css";

export function CharacterBuilder({ appContext, onBackHome }) {
  const { catalogs, selectedBooks } = appContext;
  const [draft, setDraft] = useState(() => criarPersonagemDraft());
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(
    () => ({
      races: filterCatalogByBooks(catalogs.races, selectedBooks),
      classes: filterCatalogByBooks(catalogs.classes, selectedBooks),
      origins: filterCatalogByBooks(catalogs.origins, selectedBooks),
      regionalOrigins: filterCatalogByBooks(catalogs.regionalOrigins, selectedBooks),
      gods: filterCatalogByBooks(catalogs.gods, selectedBooks),
      powers: filterCatalogByBooks(catalogs.powers, selectedBooks),
      classPowers: filterCatalogByBooks(catalogs.classPowers, selectedBooks),
      personalStrikeEffects: catalogs.personalStrikeEffects,
      items: filterCatalogByBooks(catalogs.items, selectedBooks),
      improvements: filterCatalogByBooks(catalogs.improvements, selectedBooks),
      specialMaterials: filterCatalogByBooks(catalogs.specialMaterials, selectedBooks),
      spells: filterCatalogByBooks(catalogs.spells, selectedBooks)
    }),
    [catalogs, selectedBooks]
  );

  const activePage = creationPages[activeIndex];

  function updateDraft(path, value) {
    setDraft((current) => setDeepValue(current, path, value));
  }

  function next() {
    setActiveIndex((index) => Math.min(index + 1, creationPages.length - 1));
  }

  function previous() {
    setActiveIndex((index) => Math.max(index - 1, 0));
  }

  // Validar se a página atual permite avançar
  function canAdvanceFromPage() {
    if (activePage.id === "raca-atributos") {
      const selectedRace = filtered.races.find((race) => race.id === draft.info.racaId);
      return isRaceChoiceComplete(selectedRace, draft.escolhas.raca ?? {});
    }
    return true;
  }

  return (
    <main className="app-shell">
      <DebugPanel draft={draft} catalogs={filtered} />
      <header className="app-topbar">
        <div className="brand">
          <strong>Forja T20</strong>
          <span>{activePage.titulo}</span>
        </div>
        <Button variant="secondary" onClick={onBackHome}>
          <Home size={18} />
          Home
        </Button>
      </header>

      <div className="page-frame builder-grid">
        <nav className="builder-nav" aria-label="Etapas da criação">
          {creationPages.map((page, index) => (
            <button
              className={`builder-nav__item ${index === activeIndex ? "builder-nav__item--active" : ""}`}
              key={page.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span>{index + 1}</span>
              {page.titulo}
            </button>
          ))}
        </nav>

        <section className="builder-panel">
          <StepContent
            catalogs={filtered}
            draft={draft}
            pageId={activePage.id}
            updateDraft={updateDraft}
          />

          <footer className="builder-actions">
            <Button disabled={activeIndex === 0} onClick={previous} variant="secondary">
              <ArrowLeft size={18} />
              Voltar
            </Button>
            <Button disabled={activeIndex === creationPages.length - 1 || !canAdvanceFromPage()} onClick={next}>
              Avançar
              <ArrowRight size={18} />
            </Button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function StepContent({ pageId, catalogs, draft, updateDraft }) {
  switch (pageId) {
    case "raca-atributos":
      return <RaceAttributesStep catalogs={catalogs} draft={draft} updateDraft={updateDraft} />;
    case "classe":
      return <ClassStep catalogs={catalogs} draft={draft} updateDraft={updateDraft} />;
    case "origem":
      return <OriginStep catalogs={catalogs} draft={draft} updateDraft={updateDraft} />;
    case "origem-regional":
      return (
        <ChoiceStep
          description="Escolha uma origem regional quando a campanha permitir."
          entries={catalogs.regionalOrigins}
          fieldPath="info.origemRegionalId"
          label="Origem regional"
          title="Origem Regional"
          value={draft.info.origemRegionalId}
          updateDraft={updateDraft}
        />
      );
    case "divindade":
      return (
        <ChoiceStep
          description="Escolha a divindade ou deixe sem devoção."
          entries={catalogs.gods}
          fieldPath="info.deusId"
          label="Divindade"
          title="Divindade"
          value={draft.info.deusId}
          updateDraft={updateDraft}
          allowEmpty
        />
      );
    case "equipamento":
      return (
        <ChoiceStep
          description="Prévia do catálogo filtrado. A escolha detalhada de inventário entra na próxima etapa de lógica."
          entries={catalogs.items}
          fieldPath="escolhas.equipamentoInicialIds.0"
          label="Item inicial"
          title="Equipamento"
          value={draft.escolhas.equipamentoInicialIds[0] ?? ""}
          updateDraft={updateDraft}
          allowEmpty
        />
      );
    case "magias":
      return (
        <ChoiceStep
          description="Escolha inicial de magia. Depois vamos ligar isso às regras de classe e círculo."
          entries={catalogs.spells}
          fieldPath="escolhas.magiasIds.0"
          label="Magia"
          title="Magias"
          value={draft.escolhas.magiasIds[0] ?? ""}
          updateDraft={updateDraft}
          allowEmpty
          nameKey="name"
        />
      );
    default:
      return <ReviewStep catalogs={catalogs} draft={draft} />;
  }
}

function setDeepValue(source, path, value) {
  const parts = path.split(".");
  const copy = structuredClone(source);
  let cursor = copy;

  parts.slice(0, -1).forEach((part, index) => {
    const nextPart = parts[index + 1];
    if (cursor[part] === undefined) cursor[part] = Number.isInteger(Number(nextPart)) ? [] : {};
    cursor = cursor[part];
  });

  cursor[parts.at(-1)] = value;
  return copy;
}
