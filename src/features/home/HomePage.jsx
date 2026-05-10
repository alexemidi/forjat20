import { BookOpen, Play, ScrollText } from "lucide-react";
import { Button } from "../../shared/ui/Button.jsx";
import { filterCatalogByBooks } from "../../shared/lib/catalogFilters.js";
import "./HomePage.css";

export function HomePage({ appContext, onStart }) {
  const { books, catalogs, selectedBooks, setSelectedBooks } = appContext;
  const counts = {
    "raças": filterCatalogByBooks(catalogs.races, selectedBooks).length,
    classes: filterCatalogByBooks(catalogs.classes, selectedBooks).length,
    origens: filterCatalogByBooks(catalogs.origins, selectedBooks).length,
    poderes: filterCatalogByBooks(catalogs.powers, selectedBooks).length,
    itens: filterCatalogByBooks(catalogs.items, selectedBooks).length,
    magias: filterCatalogByBooks(catalogs.spells, selectedBooks).length
  };

  function toggleBook(bookId) {
    setSelectedBooks((current) => {
      if (current.includes(bookId)) {
        const next = current.filter((id) => id !== bookId);
        return next.length ? next : current;
      }
      return [...current, bookId];
    });
  }

  return (
    <main className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <strong>Forja T20</strong>
          <span>Criador de personagens</span>
        </div>
        <Button onClick={onStart}>
          <Play size={18} />
          Criar ficha
        </Button>
      </header>

      <div className="page-frame home-grid">
        <section className="home-main">
          <div>
            <h1 className="home-title">Escolha os livros da criaÃ§Ã£o</h1>
            <p className="section-subtitle">
              Os catÃ¡logos do criador serÃ£o filtrados por essa seleÃ§Ã£o.
            </p>
          </div>

          <div className="book-grid">
            {books.map((book) => {
              const checked = selectedBooks.includes(book.id);
              return (
                <button
                  className={`book-option ${checked ? "book-option--selected" : ""}`}
                  key={book.id}
                  onClick={() => toggleBook(book.id)}
                  type="button"
                >
                  <BookOpen size={18} />
                  <span>{book.nome}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="home-side">
          <div className="summary-heading">
            <ScrollText size={18} />
            <h2>Dados disponÃ­veis</h2>
          </div>
          <div className="summary-grid">
            {Object.entries(counts).map(([label, count]) => (
              <div className="summary-item" key={label}>
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
