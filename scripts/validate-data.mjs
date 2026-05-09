import fs from "node:fs";

const files = [
  "races_update.json",
  "classes_full.json",
  "origens.json",
  "origem_regional.json",
  "deuses.json",
  "poderes_gerais.json",
  "poderes_classe.json",
  "itens.json",
  "melhorias.json",
  "magias.json"
];

const result = files.map((file) => {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  JSON.parse(text);
  return file;
});

console.log(`JSON validado: ${result.join(", ")}`);
