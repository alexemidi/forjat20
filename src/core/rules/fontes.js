function normalizarLivroOrigemId(valor) {
  if (!valor) return null;

  return String(valor)
    .replace(/Ã¡/g, "a")
    .replace(/Ã©/g, "e")
    .replace(/Ã­/g, "i")
    .replace(/Ã³/g, "o")
    .replace(/Ãº/g, "u")
    .replace(/Ã£/g, "a")
    .replace(/Ãµ/g, "o")
    .replace(/Ã§/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function obterLivroOrigemId(item) {
  return item.livroOrigemId ?? normalizarLivroOrigemId(item["Livro de Origem"]);
}

function filtrarPorLivrosPermitidos(itens, livrosPermitidosIds) {
  if (!livrosPermitidosIds || livrosPermitidosIds.length === 0) {
    return itens;
  }

  const permitidos = new Set(livrosPermitidosIds);

  return itens.filter((item) => {
    const livroOrigemId = obterLivroOrigemId(item);
    return livroOrigemId ? permitidos.has(livroOrigemId) : true;
  });
}

if (typeof module !== "undefined") {
  module.exports = {
    normalizarLivroOrigemId,
    obterLivroOrigemId,
    filtrarPorLivrosPermitidos
  };
}
