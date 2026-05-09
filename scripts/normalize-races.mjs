import fs from "node:fs";

const ATTRS = ["for", "des", "con", "int", "sab", "car"];
const files = ["races.json", "races_update.json"];

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const sourceRaces = read("races.json");
const sourceUpdatedRaces = read("races_update.json");
const sourceById = Object.fromEntries(sourceRaces.map((race) => [race.id, race]));
const sourceUpdatedById = Object.fromEntries(sourceUpdatedRaces.map((race) => [race.id, race]));

function line(rawText, label) {
  return rawText
    .split("\n")
    .find((entry) => entry.startsWith(`${label}. `))
    ?.replace(`${label}. `, "")
    .trim();
}

function block(rawText, startLabel, endLabel) {
  const start = rawText.indexOf(`${startLabel}. `);
  const end = endLabel ? rawText.indexOf(`${endLabel}. `, start + startLabel.length) : -1;
  if (start < 0) return "";
  return rawText.slice(start + startLabel.length + 2, end > start ? end : undefined).trim();
}

function bulletOptions(rawText, afterLabel) {
  const section = rawText.slice(rawText.indexOf(afterLabel));
  return section
    .split("\n")
    .filter((entry) => entry.trim().startsWith("• "))
    .map((entry, index) => {
      const text = entry.trim().replace(/^•\s*/, "");
      const [name, ...rest] = text.split(". ");
      return {
        id: slug(name || `opcao_${index + 1}`),
        nome: name,
        descricao: rest.join(". ").trim() || text
      };
    });
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeRace(file, race) {
  switch (race.id) {
    case "duende":
      return normalizeDuende(file, race);
    case "golem_desperto":
      return normalizeGolemDesperto(race);
    case "nagah":
      return normalizeNagah(race);
    case "suraggel":
      return normalizeSuraggel(race);
    case "kobold":
      return normalizeKobold(race);
    default:
      return race;
  }
}

function normalizeDuende(file, race) {
  const rawText = sourceById.duende.raw_text;
  const tabus = bulletOptions(rawText, "Tabus de Duendes").map((tabu, index) => ({
    id: `tabu_${String(index + 1).padStart(2, "0")}`,
    nome: tabu.descricao,
    descricao: tabu.descricao
  }));

  const natureza = [
    {
      id: "animal",
      nome: "Animal",
      descricao: line(rawText, "Animal"),
      atributosFlexiveis: { quantidade: 1, valor: 1, permitirRepetir: false, atributosPermitidos: ATTRS },
      efeitos: [{ tipo: "tipo_criatura", valor: "espirito" }]
    },
    {
      id: "vegetal",
      nome: "Vegetal",
      descricao: line(rawText, "Vegetal"),
      habilidades: [
        { id: "duende_natureza_vegetal", nome: "Natureza Vegetal", descricao: "Você é imune a atordoamento e metamorfose, mas é afetado por efeitos que afetam plantas monstruosas." },
        { id: "duende_florescer_feerico", nome: "Florescer Feérico", descricao: "Uma vez por rodada, pode gastar PM limitado pela Constituição para curar 2d8 PV por PM gasto no início do próximo turno." }
      ],
      efeitos: [{ tipo: "tipo_criatura", valor: "espirito" }]
    },
    {
      id: "mineral",
      nome: "Mineral",
      descricao: line(rawText, "Mineral"),
      efeitos: [
        { tipo: "tipo_criatura", valor: "espirito" },
        { tipo: "imunidade_efeito", efeitos: ["metabolismo"] },
        { tipo: "reducao_dano", tipos: ["corte", "fogo", "perfuracao"], valor: 5 }
      ]
    }
  ];

  const tamanho = [
    { id: "minusculo", nome: "Minúsculo", atributos: { for: -1 }, corpo: { tamanhoId: "minusculo", deslocamentoBase: 6 }, descricao: line(rawText, "Minúsculo") },
    { id: "pequeno", nome: "Pequeno", corpo: { tamanhoId: "pequeno", deslocamentoBase: 6 }, descricao: line(rawText, "Pequeno") },
    { id: "medio", nome: "Médio", corpo: { tamanhoId: "medio", deslocamentoBase: 9 }, descricao: line(rawText, "Médio") },
    { id: "grande", nome: "Grande", atributos: { des: -1 }, corpo: { tamanhoId: "grande", deslocamentoBase: 9 }, descricao: line(rawText, "Grande") }
  ];

  const presentes = [
    {
      id: "Afinidade Elemental",
      nome: "Afinidade Elemental",
      descricao: line(rawText, "Afinidade Elemental"),
      subEscolhas: [
        {
          id: "duende_afinidade_elemental_elemento",
          nome: "Elemento",
          tipo: "escolha_unica",
          obrigatoria: true,
          opcoes: [
            { id: "agua", nome: "Água", descricao: line(rawText, "• Água") },
            { id: "fogo", nome: "Fogo", descricao: line(rawText, "• Fogo") },
            { id: "vegetacao", nome: "Vegetação", descricao: line(rawText, "• Vegetação") }
          ]
        }
      ]
    },
    { id: "Encantar Objetos", nome: "Encantar Objetos", descricao: line(rawText, "Encantar Objetos") },
    { id: "Enfeitiçar", nome: "Enfeitiçar", descricao: line(rawText, "Enfeitiçar") },
    { id: "Invisibilidade", nome: "Invisibilidade", descricao: line(rawText, "Invisibilidade") },
    { id: "Língua da Natureza", nome: "Língua da Natureza", descricao: line(rawText, "Língua da Natureza") },
    {
      id: "Maldição",
      nome: "Maldição",
      descricao: block(rawText, "Maldição", "Mais Lá do que Aqui"),
      subEscolhas: [
        { id: "duende_maldicao_resistencia", nome: "Resistência", tipo: "escolha_unica", opcoes: [{ id: "fortitude", nome: "Fortitude" }, { id: "vontade", nome: "Vontade" }] },
        { id: "duende_maldicao_efeito", nome: "Efeito da Maldição", tipo: "escolha_unica", opcoes: bulletOptions(rawText, "Apatia Profunda") }
      ]
    },
    { id: "Mais Lá do que Aqui", nome: "Mais Lá do que Aqui", descricao: line(rawText, "Mais Lá do que Aqui") },
    { id: "Metamorfose Animal", nome: "Metamorfose Animal", descricao: line(rawText, "Metamorfose Animal"), subEscolhas: [{ id: "duende_metamorfose_forma", nome: "Forma Selvagem", tipo: "escolha_unica", adiarParaEtapa: "poderes", opcoesReferencia: "formas_selvagens_druida" }] },
    { id: "Sonhos Proféticos", nome: "Sonhos Proféticos", descricao: line(rawText, "Sonhos Proféticos") },
    { id: "Velocidade do Pensamento", nome: "Velocidade do Pensamento", descricao: line(rawText, "Velocidade do Pensamento") },
    { id: "Visão Feérica", nome: "Visão Feérica", descricao: line(rawText, "Visão Feérica") },
    { id: "Voo", nome: "Voo", descricao: line(rawText, "Voo") }
  ];

  return {
    ...race,
    ...(file === "races_update.json" ? { livroOrigemId: race.livroOrigemId ?? "herois_de_arton" } : {}),
    atributos: file === "races_update.json" ? { fixos: {}, flexiveis: null } : {},
    is_choice: true,
    corpo: file === "races_update.json" ? { tamanhoId: "medio", deslocamentoBase: 6, alcanceNatural: 1.5 } : race.corpo,
    habilidades: [
      { id: "duende_aversao_a_ferro", nome: "Aversão a Ferro", descricao: block(rawText, "Aversão a Ferro", "Aversão a Sinos") },
      { id: "duende_aversao_a_sinos", nome: "Aversão a Sinos", descricao: block(rawText, "Aversão a Sinos", "Tabu") },
      { id: "duende_tabu", nome: "Tabu", descricao: block(rawText, "Tabu", "Tabus de Duendes") }
    ],
    escolhas: [
      { id: "duende_natureza", passo: 1, nome: "Natureza", tipo: "escolha_unica", obrigatoria: true, opcoes: natureza },
      { id: "duende_tamanho", passo: 2, nome: "Tamanho", tipo: "escolha_unica", obrigatoria: true, opcoes: tamanho },
      { id: "duende_dons", passo: 3, nome: "Dons", tipo: "atributos_flexiveis", obrigatoria: true, quantidade: 2, valor: 1, permitirRepetir: false, atributosPermitidos: ATTRS, regraEspecial: "Se a natureza for Animal, um dos dons pode ser o mesmo atributo escolhido pela natureza." },
      { id: "duende_presentes", passo: 4, nome: "Presentes de Magia e de Caos", tipo: "escolha_multipla", obrigatoria: true, quantidade: 3, opcoes: presentes },
      { id: "duende_tabu", passo: 5, nome: "Tabu", tipo: "tabu_com_penalidade", obrigatoria: true, opcoes: tabus, penalidades: ["Diplomacia", "Iniciativa", "Luta", "Percepção"], descricao: "Escolha um tabu e uma perícia para sofrer -5." }
    ],
    metadados: { ...(race.metadados ?? {}), duende: { passos: [1, 2, 3, 4, 5] } },
    raw_text: rawText
  };
}

function normalizeGolemDesperto(race) {
  const rawText = sourceById.golem_desperto.raw_text ?? "";
  const oldChoice = (race.escolhas ?? []).find((choice) => choice.id.includes("golem_desperto"));
  const fallbackChoice = (sourceUpdatedById.golem_desperto?.escolhas ?? []).find((choice) => choice.id === "golem_desperto_chassi");
  const chassisSource = firstNonEmpty(oldChoice?.chassi, oldChoice?.opcoes, fallbackChoice?.chassi, fallbackChoice?.opcoes);
  const chassis = chassisSource.map((option) => ({ ...option }));
  const fontes = race.metadados?.fontes ?? sourceFontesGolem();
  const tamanhos = race.metadados?.tamanhosGolem ?? sourceTamanhosGolem();

  return {
    ...race,
    escolhas: [
      { id: "golem_desperto_chassi", nome: "Chassi", tipo: "escolha_unica", obrigatoria: true, chassi: chassis },
      { id: "golem_desperto_fonte", nome: "Fonte de Energia", tipo: "escolha_unica", obrigatoria: true, fonte: fontes },
      { id: "golem_desperto_tamanho", nome: "Tamanho", tipo: "escolha_unica", obrigatoria: true, tamanho: tamanhos }
    ],
    metadados: { ...(race.metadados ?? {}), fontes, tamanhosGolem: tamanhos },
    raw_text: rawText || race.raw_text
  };
}

function firstNonEmpty(...values) {
  return values.find((value) => Array.isArray(value) && value.length) ?? [];
}

function sourceFontesGolem() {
  return [
    { id: "alquimica", nome: "Alquímica", descricao: "Você possui um reservatório de poções. Sempre que ingerir um item alquímico de cura ou utilitário, você recupera 1 PM." },
    { id: "elemental", nome: "Elemental", descricao: "Você é ligado a um dos quatro elementos. Você é imune a dano mágico do elemento escolhido e recupera metade do dano em PV." },
    { id: "sagrada", nome: "Sagrada", descricao: "Você pode lançar uma magia de 1º círculo divina a sua escolha, com Sabedoria como atributo-chave." },
    { id: "vapor", nome: "Vapor", descricao: "Você é imune a dano de fogo e pode expelir um jato de vapor escaldante." }
  ];
}

function sourceTamanhosGolem() {
  return [
    { id: "pequeno", nome: "Pequeno", atributos: { des: 1 }, descricao: "Destreza +1." },
    { id: "medio", nome: "Médio", atributos: {}, descricao: "Sem ajustes." },
    { id: "grande", nome: "Grande", atributos: { des: -1 }, descricao: "Destreza -1." }
  ];
}

function normalizeNagah(race) {
  return {
    ...race,
    escolhas: [
      {
        id: "nagah_sexo",
        nome: "Sexo",
        tipo: "sexo",
        obrigatoria: true,
        sexo: [
          { id: "nagah_macho", nome: "Macho", sexo: "masculino", atributos: { for: 1, des: 1, con: 1 }, descricao: "Força +1, Destreza +1, Constituição +1." },
          { id: "nagah_femea", nome: "Fêmea", sexo: "feminino", atributos: { int: 1, sab: 1, car: 1 }, descricao: "Inteligência +1, Sabedoria +1, Carisma +1." }
        ]
      }
    ]
  };
}

function normalizeSuraggel(race) {
  return {
    ...race,
    escolhas: [
      {
        id: "suraggel_linhagem",
        nome: "Linhagem",
        tipo: "linhagem",
        obrigatoria: true,
        linhagem: [
          {
            id: "suraggel_aggelus",
            nome: "Aggelus",
            atributos: { sab: 2, car: 1 },
            descricao: "Sabedoria +2, Carisma +1.",
            habilidades: [{ id: "suraggel_luz_sagrada", nome: "Luz Sagrada", descricao: "Você recebe +2 em Diplomacia e Intuição. Além disso, pode lançar Luz como uma magia divina; atributo-chave Carisma. Caso aprenda novamente essa magia, seu custo diminui em -1 PM." }]
          },
          {
            id: "suraggel_sulfure",
            nome: "Sulfure",
            atributos: { des: 2, int: 1 },
            descricao: "Destreza +2, Inteligência +1.",
            habilidades: [{ id: "suraggel_sombras_profanas", nome: "Sombras Profanas", descricao: "Você recebe +2 em Enganação e Furtividade. Além disso, pode lançar Escuridão como uma magia divina; atributo-chave Inteligência. Caso aprenda novamente essa magia, seu custo diminui em -1 PM." }]
          }
        ]
      }
    ]
  };
}

function normalizeKobold(race) {
  const rawText = sourceById.kobold.raw_text ?? "";
  const talentos = bulletOptions(rawText, "Talentos do Bando");
  return {
    ...race,
    habilidades: [
      ...(race.habilidades ?? []).filter((habilidade) => habilidade.nome !== "Talentos do Bando"),
      { id: "kobold_talentos_do_bando", nome: "Talentos do Bando", descricao: "Escolha dois talentos de grupo." }
    ],
    escolhas: [
      { id: "kobold_talentos_do_bando", nome: "Talentos do Bando", tipo: "escolha_multipla", obrigatoria: true, quantidade: 2, talentos }
    ]
  };
}

for (const file of files) {
  const races = read(file).map((race) => normalizeRace(file, race));
  fs.writeFileSync(file, `${JSON.stringify(races, null, 2)}\n`, "utf8");
}
