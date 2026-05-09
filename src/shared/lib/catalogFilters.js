import { cleanText, normalizeSearch } from "./text.js";

export function getBookIds(entry) {
  if (!entry) return [];
  if (Array.isArray(entry.livrosOrigemIds)) return entry.livrosOrigemIds.filter(Boolean);
  if (typeof entry.livrosOrigemIds === "string") return [entry.livrosOrigemIds];
  if (entry.livroOrigemId) return [entry.livroOrigemId];
  if (entry["Livro de Origem"]) return [slug(cleanText(entry["Livro de Origem"]))];
  return [];
}

export function filterByBooks(entries, selectedBooks) {
  if (!Array.isArray(entries)) return [];
  if (!selectedBooks?.length) return entries;
  const selected = new Set(selectedBooks);

  return entries.filter((entry) => {
    const origins = getBookIds(entry);
    return origins.length === 0 || origins.some((bookId) => selected.has(bookId));
  });
}

export function filterBySearch(entries, search, selectors = [(entry) => entry.nome ?? entry.name ?? ""]) {
  if (!Array.isArray(entries)) return [];
  if (!search) return entries;
  const query = normalizeSearch(search);

  return entries.filter((entry) => {
    return selectors.some((selector) => normalizeSearch(selector(entry) ?? "").includes(query));
  });
}

export function slug(value) {
  return cleanText(String(value))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
