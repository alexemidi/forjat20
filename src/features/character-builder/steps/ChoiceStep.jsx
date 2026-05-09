import { useMemo, useState } from "react";
import { filterBySearch } from "../../../shared/lib/catalogFilters.js";
import { SelectInput, TextInput } from "../../../shared/ui/TextInput.jsx";

export function ChoiceStep({
  allowEmpty = false,
  description,
  entries,
  fieldPath,
  label,
  nameKey = "nome",
  title,
  updateDraft,
  value
}) {
  const [search, setSearch] = useState("");
  const visibleEntries = useMemo(
    () => filterBySearch(entries, search, [(entry) => entry[nameKey], (entry) => entry.descricao]),
    [entries, nameKey, search]
  );

  return (
    <div className="builder-step">
      <header>
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{description}</p>
      </header>

      <div className="builder-form-grid">
        <SelectInput
          id={fieldPath}
          label={label}
          onChange={(event) => updateDraft(fieldPath, event.target.value)}
          value={value}
        >
          {allowEmpty ? <option value="">Nenhum</option> : <option value="">Selecione</option>}
          {entries.map((entry) => (
            <option key={entry.id ?? entry[nameKey]} value={entry.id ?? entry[nameKey]}>
              {entry[nameKey]}
            </option>
          ))}
        </SelectInput>
        <TextInput
          id={`${fieldPath}-search`}
          label="Buscar"
          onChange={(event) => setSearch(event.target.value)}
          value={search}
        />
      </div>

      <div className="data-list">
        {visibleEntries.slice(0, 12).map((entry) => (
          <div className="data-list__row" key={entry.id ?? entry[nameKey]}>
            <strong>{entry[nameKey]}</strong>
            <span className="muted">{entry.tipo ?? entry.categoria ?? entry.escola ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
