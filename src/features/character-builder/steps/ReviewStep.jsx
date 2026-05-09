import { useMemo } from "react";
import { ATRIBUTOS, getRaceFixedAbilities } from "../model/atributos.js";
import { compilarPersonagem } from "../model/compilarPersonagem.js";

export function ReviewStep({ catalogs, draft }) {
  const personagem = useMemo(() => compilarPersonagem(draft, catalogs), [draft, catalogs]);

  const race = catalogs.races.find((e) => e.id === draft.info.racaId);
  const classe = catalogs.classes.find((e) => e.id === draft.info.classeId);
  const origin = catalogs.origins.find((e) => e.id === draft.info.origemId);
  const regionalOrigin = catalogs.regionalOrigins.find((e) => e.id === draft.info.origemRegionalId);
  const god = catalogs.gods.find((e) => e.id === draft.info.deusId);
  const raceAbilities = getRaceFixedAbilities(race);

  function exportarJSON() {
    const json = JSON.stringify(personagem, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${personagem.info.nome || "personagem"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function copiarJSON() {
    navigator.clipboard.writeText(JSON.stringify(personagem, null, 2));
  }

  return (
    <div className="builder-step">
      <header className="builder-step__header">
        <div>
          <h1 className="section-title">Revisão</h1>
          <p className="section-subtitle">Confira a ficha antes de exportar.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn--secondary" onClick={copiarJSON} type="button">
            Copiar JSON
          </button>
          <button className="btn btn--primary" onClick={exportarJSON} type="button">
            Exportar .json
          </button>
        </div>
      </header>

      <div className="review-grid">
        <div className="review-block">
          <h3>Identidade</h3>
          <p><strong>{personagem.info.nome || "Sem nome"}</strong></p>
          {personagem.info.jogador ? <p className="muted">Jogador: {personagem.info.jogador}</p> : null}
          {personagem.info.sexo ? <p className="muted">Sexo: {personagem.info.sexo}</p> : null}
          <p className="muted">Nível {personagem.info.nivel}</p>
        </div>

        <div className="review-block">
          <h3>Base</h3>
          <p>{race?.nome ?? <span className="muted">Raça não escolhida</span>}</p>
          <p>{classe?.nome ?? <span className="muted">Classe não escolhida</span>}</p>
          <p>{origin?.nome ?? <span className="muted">Origem não escolhida</span>}</p>
          {regionalOrigin ? <p className="muted">{regionalOrigin.nome}</p> : null}
          {god ? <p className="muted">{god.nome}</p> : null}
        </div>

        <div className="review-block">
          <h3>Corpo</h3>
          <p>Tamanho: {personagem.corpo.tamanhoId}</p>
          <p>Deslocamento: {personagem.corpo.deslocamentoBase}m</p>
          <p>Alcance: {personagem.corpo.alcanceNatural}m</p>
        </div>
      </div>

      <section className="builder-section">
        <div className="builder-section__header">
          <h2>Atributos Finais</h2>
        </div>
        <div className="attribute-grid">
          {ATRIBUTOS.map((attribute) => {
            const base = personagem.atributosBase[attribute.id];
            const final = personagem.atributosFinais[attribute.id];
            const bonus = final - base;
            return (
              <div className="attribute-box" key={attribute.id}>
                <strong>{attribute.nome}</strong>
                <span className="attribute-final">{final}</span>
                <span className="muted">
                  Base {base > 0 ? `+${base}` : base}
                  {bonus !== 0 ? ` | Raça ${bonus > 0 ? `+${bonus}` : bonus}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {raceAbilities.length ? (
        <section className="builder-section">
          <div className="builder-section__header">
            <h2>Habilidades de {race.nome}</h2>
          </div>
          <div className="data-list">
            {raceAbilities.map((hab) => (
              <div className="data-list__row" key={hab.id ?? hab.nome}>
                <strong>{hab.nome}</strong>
                <span className="muted">{hab.descricao}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="builder-section">
        <div className="builder-section__header">
          <h2>Ficha Gerada</h2>
          <span className="muted">Prévia do JSON exportado</span>
        </div>
        <pre className="code-preview">{JSON.stringify(personagem, null, 2)}</pre>
      </section>
    </div>
  );
}
