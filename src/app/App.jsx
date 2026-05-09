import { useEffect, useMemo, useState } from "react";
import { HomePage } from "../features/home/HomePage.jsx";
import { CharacterBuilder } from "../features/character-builder/CharacterBuilder.jsx";
import { books, loadCatalogs } from "../data/catalogos.js";

export function App() {
  const [catalogs, setCatalogs] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState(["basico"]);
  const [builderStarted, setBuilderStarted] = useState(false);

  useEffect(() => {
    let active = true;

    loadCatalogs().then((loadedCatalogs) => {
      if (active) setCatalogs(loadedCatalogs);
    });

    return () => {
      active = false;
    };
  }, []);

  const appContext = useMemo(
    () => ({
      books,
      catalogs,
      selectedBooks,
      setSelectedBooks
    }),
    [catalogs, selectedBooks]
  );

  if (!catalogs) {
    return (
      <main className="app-shell">
        <header className="app-topbar">
          <div className="brand">
            <strong>Forja T20</strong>
            <span>Carregando catálogos</span>
          </div>
        </header>
        <div className="page-frame">
          <p className="section-subtitle">Preparando a base de dados.</p>
        </div>
      </main>
    );
  }

  if (!builderStarted) {
    return <HomePage appContext={appContext} onStart={() => setBuilderStarted(true)} />;
  }

  return <CharacterBuilder appContext={appContext} onBackHome={() => setBuilderStarted(false)} />;
}
