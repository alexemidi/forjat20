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

  return entries.filter((entry) => entryMatchesBooks(entry, selected));
}

export function filterCatalogByBooks(entries, selectedBooks) {
  if (!Array.isArray(entries)) return [];
  if (!selectedBooks?.length) return entries;
  const selected = new Set(selectedBooks);

  return entries
    .filter((entry) => entryMatchesBooks(entry, selected))
    .map((entry) => filterEntryTreeByBooks(entry, selected));
}

export function entryMatchesBooks(entry, selectedBooks) {
  const selected = selectedBooks instanceof Set ? selectedBooks : new Set(selectedBooks ?? []);
  const origins = getBookIds(entry);
  return origins.length === 0 || origins.some((bookId) => selected.has(bookId));
}

function filterEntryTreeByBooks(value, selectedBooks) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !isCatalogObject(item) || entryMatchesBooks(item, selectedBooks))
      .map((item) => filterEntryTreeByBooks(item, selectedBooks));
  }
  if (!isCatalogObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, itemValue]) => [key, filterEntryTreeByBooks(itemValue, selectedBooks)])
  );
}

function isCatalogObject(value) {
  return Boolean(value) && typeof value === "object";
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
