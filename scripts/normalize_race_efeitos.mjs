import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "races_update.json");
const races = JSON.parse(readFileSync(filePath, "utf-8"));

function findHab(race, id) {
  return race.habilidades?.find((h) => h.id === id);
}

function addEf(hab, ...efeitos) {
  if (!hab) return;
  if (!hab.efeitos) hab.efeitos = [];
  hab.efeitos.push(...efeitos);
}

function ensureEf(hab, ...efeitos) {
  if (!hab || hab.efeitos) return;
  hab.efeitos = [...efeitos];
}

for (const race of races) {
  switch (race.id) {
    // ── Hynne ──────────────────────────────────────────────────────────────
    case "hynne":
      ensureEf(findHab(race, "hynne_pequeno_e_rechonchudo"),
        { tipo: "definir_tamanho", tamanhoId: "pequeno" },
        { tipo: "definir_deslocamento_base", valor: 6 },
        { tipo: "bonus_pericia", pericias: ["enganacao"], valor: 2 }
      );
      break;

    // ── Kobold ─────────────────────────────────────────────────────────────
    case "kobold":
      ensureEf(findHab(race, "kobold_praga_monstruosa"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["sobrevivencia"], valor: 2 }
      );
      break;

    // ── Minauro ────────────────────────────────────────────────────────────
    case "minauro":
      ensureEf(findHab(race, "minauro_mente_aberta"),
        { tipo: "bonus_pericia", pericias: ["diplomacia", "investigacao"], valor: 2 }
      );
      break;

    // ── Meduza ─────────────────────────────────────────────────────────────
    case "meduza":
      ensureEf(findHab(race, "meduza_cria_de_megalokk"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" }
      );
      break;

    // ── Sílfide ────────────────────────────────────────────────────────────
    case "silfide":
      ensureEf(findHab(race, "silfide_espirito_da_natureza"),
        { tipo: "tipo_criatura", valor: "espirito" },
        { tipo: "visao", valor: "penumbra" }
      );
      break;

    // ── Trog ───────────────────────────────────────────────────────────────
    case "trog":
      ensureEf(findHab(race, "trog_reptiliano"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_defesa", valor: 1 }
      );
      break;

    // ── Trog Anão ──────────────────────────────────────────────────────────
    case "trog_anao":
      ensureEf(findHab(race, "trog_anao_quase_anao"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "definir_deslocamento_base", valor: 6 }
      );
      break;

    // ── Sátiro ─────────────────────────────────────────────────────────────
    case "satiro":
      ensureEf(findHab(race, "satiro_festeiro_feerico"),
        { tipo: "tipo_criatura", valor: "espirito" },
        { tipo: "visao", valor: "penumbra" },
        { tipo: "bonus_pericia", pericias: ["atuacao", "fortitude"], valor: 2 }
      );
      ensureEf(findHab(race, "satiro_pernas_caprinas"),
        { tipo: "definir_deslocamento_base", valor: 12 }
      );
      break;

    // ── Meio-Orc ───────────────────────────────────────────────────────────
    case "meio_orc":
      ensureEf(findHab(race, "meio_orc_adaptavel"),
        { tipo: "bonus_pericia", pericias: ["intimidacao"], valor: 2 }
      );
      ensureEf(findHab(race, "meio_orc_criatura_das_profundezas"),
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["percepcao", "sobrevivencia"], valor: 2, condicao: "subterraneo" }
      );
      break;

    // ── Orc ────────────────────────────────────────────────────────────────
    case "orc":
      ensureEf(findHab(race, "orc_vigor_brutal"),
        { tipo: "bonus_pericia", pericias: ["fortitude"], valor: 2 }
      );
      ensureEf(findHab(race, "orc_habitante_das_cavernas"),
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["percepcao", "sobrevivencia"], valor: 2, condicao: "subterraneo" }
      );
      break;

    // ── Ogro ───────────────────────────────────────────────────────────────
    case "ogro":
      ensureEf(findHab(race, "ogro_quanto_maior_o_tamanho"),
        { tipo: "tipo_criatura", valor: "humanoide_gigante" },
        { tipo: "definir_tamanho", tamanhoId: "grande" },
        { tipo: "visao", valor: "penumbra" }
      );
      ensureEf(findHab(race, "ogro_camada_de_ingenuidade"),
        { tipo: "penalidade_pericia", pericias: ["intuicao", "vontade"], valor: -5 }
      );
      break;

    // ── Velocis ────────────────────────────────────────────────────────────
    case "velocis":
      ensureEf(findHab(race, "velocis_sentidos_selvagens"),
        { tipo: "bonus_pericia", pericias: ["sobrevivencia"], valor: 2 },
        { tipo: "visao", valor: "penumbra" },
        { tipo: "sentido_especial", valor: "faro" }
      );
      ensureEf(findHab(race, "velocis_atraves_de_espinheiros"),
        { tipo: "reducao_dano", tipos: ["corte", "perfuracao"], valor: 2 }
      );
      ensureEf(findHab(race, "velocis_velocista_da_planicie"),
        { tipo: "definir_deslocamento_base", valor: 12 }
      );
      break;

    // ── Voracis ────────────────────────────────────────────────────────────
    case "voracis":
      ensureEf(findHab(race, "voracis_sentidos_selvagens"),
        { tipo: "bonus_pericia", pericias: ["sobrevivencia"], valor: 2 },
        { tipo: "visao", valor: "penumbra" },
        { tipo: "sentido_especial", valor: "faro" }
      );
      ensureEf(findHab(race, "voracis_rainha_da_selva"),
        { tipo: "bonus_pericia", pericias: ["atletismo"], valor: 2 }
      );
      break;

    // ── Eiradaan ───────────────────────────────────────────────────────────
    case "eiradaan":
      ensureEf(findHab(race, "eiradaan_essencia_feerica"),
        { tipo: "tipo_criatura", valor: "espirito" },
        { tipo: "visao", valor: "penumbra" }
      );
      break;

    // ── Galokk ─────────────────────────────────────────────────────────────
    case "galokk":
      ensureEf(findHab(race, "galokk_meio_gigante"),
        { tipo: "tipo_criatura", valor: "humanoide_gigante" },
        { tipo: "definir_tamanho", tamanhoId: "grande" }
      );
      break;

    // ── Meio-Elfo ──────────────────────────────────────────────────────────
    case "meio_elfo":
      ensureEf(findHab(race, "meio_elfo_entre_dois_mundos"),
        { tipo: "bonus_pericia", pericias: ["adestramento", "atuacao", "diplomacia", "enganacao", "intimidacao", "jogatina"], valor: 1 }
      );
      ensureEf(findHab(race, "meio_elfo_sangue_0lfico"),
        { tipo: "visao", valor: "penumbra" }
      );
      break;

    // ── Tengu ──────────────────────────────────────────────────────────────
    case "tengu":
      ensureEf(findHab(race, "tengu_espirito_corvino"),
        { tipo: "tipo_criatura", valor: "espirito" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["percepcao"], valor: 2 }
      );
      break;

    // ── Finntroll ──────────────────────────────────────────────────────────
    case "finntroll":
      ensureEf(findHab(race, "finntroll_corpo_vegetal"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" }
      );
      ensureEf(findHab(race, "finntroll_presenca_arcana"),
        { tipo: "bonus_pericia", pericias: ["misticismo"], valor: 2 }
      );
      break;

    // ── Harpia ─────────────────────────────────────────────────────────────
    case "harpia":
      ensureEf(findHab(race, "harpia_cria_de_masmorra"),
        { tipo: "tipo_criatura", valor: "monstro" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["intimidacao", "sobrevivencia"], valor: 2 }
      );
      break;

    // ── Hobgoblin ──────────────────────────────────────────────────────────
    case "hobgoblin":
      ensureEf(findHab(race, "hobgoblin_arte_da_guerra"),
        { tipo: "pericia_treinada", periciaId: "guerra" }
      );
      ensureEf(findHab(race, "hobgoblin_taticas_de_guerrilha"),
        { tipo: "visao", valor: "escuro" },
        { tipo: "bonus_pericia", pericias: ["furtividade"], valor: 2 }
      );
      break;

    // ── Kaijin ─────────────────────────────────────────────────────────────
    case "kaijin":
      ensureEf(findHab(race, "kaijin_cria_da_tormenta"),
        { tipo: "tipo_criatura", valor: "monstro" }
      );
      ensureEf(findHab(race, "kaijin_couraca_rubra"),
        { tipo: "reducao_dano", tipos: ["fisico"], valor: 2 }
      );
      break;

    // ── Kallyanach ─────────────────────────────────────────────────────────
    case "kallyanach": {
      const habHeranca = findHab(race, "kallyanach_heranca_draconica");
      if (habHeranca) {
        if (!habHeranca.efeitos) {
          habHeranca.efeitos = [{ tipo: "tipo_criatura", valor: "monstro" }];
        }
        if (habHeranca.escolha?.opcoes) {
          for (const opt of habHeranca.escolha.opcoes) {
            if (!opt.efeitos) {
              opt.efeitos = [{ tipo: "reducao_dano", tipos: [opt.id], valor: 5 }];
            }
          }
        }
      }
      const habBencao = findHab(race, "kallyanach_bencao_de_kallyadranoch");
      if (habBencao?.escolha?.opcoes) {
        const escamas = habBencao.escolha.opcoes.find((o) => o.id === "escamas_elementais");
        if (escamas && !escamas.efeitos) {
          escamas.efeitos = [
            { tipo: "bonus_defesa", valor: 2 },
            { tipo: "upgrade_reducao_dano_heranca", valor: 10 }
          ];
        }
        const sentidos = habBencao.escolha.opcoes.find((o) => o.id === "sentidos_draconicos");
        if (sentidos && !sentidos.efeitos) {
          sentidos.efeitos = [
            { tipo: "sentido_especial", valor: "faro" },
            { tipo: "visao", valor: "escuro" }
          ];
        }
      }
      break;
    }

    // ── Qareen ─────────────────────────────────────────────────────────────
    case "qareen": {
      const habResist = findHab(race, "qareen_resistencia_elemental");
      if (habResist?.escolha?.opcoes) {
        for (const opt of habResist.escolha.opcoes) {
          if (!opt.efeitos) {
            opt.efeitos = [{ tipo: "reducao_dano", tipos: [opt.id], valor: 10 }];
          }
        }
      }
      break;
    }

    // ── Suraggel ───────────────────────────────────────────────────────────
    case "suraggel": {
      const linhagem = race.escolhas?.find((e) => e.id === "suraggel_linhagem");
      if (linhagem?.linhagem) {
        const aggelus = linhagem.linhagem.find((l) => l.id === "suraggel_aggelus");
        if (aggelus) {
          const habLuz = aggelus.habilidades?.find((h) => h.id === "suraggel_luz_sagrada");
          if (habLuz && !habLuz.efeitos) {
            habLuz.efeitos = [
              { tipo: "bonus_pericia", pericias: ["diplomacia", "intuicao"], valor: 2 }
            ];
          }
        }
        const sulfure = linhagem.linhagem.find((l) => l.id === "suraggel_sulfure");
        if (sulfure) {
          const habSombras = sulfure.habilidades?.find((h) => h.id === "suraggel_sombras_profanas");
          if (habSombras && !habSombras.efeitos) {
            habSombras.efeitos = [
              { tipo: "bonus_pericia", pericias: ["enganacao", "furtividade"], valor: 2 }
            ];
          }
        }
      }
      break;
    }

    // ── Golem Desperto ────────────────────────────────────────────────────
    case "golem_desperto": {
      // Base: Criatura Artificial
      ensureEf(findHab(race, "golem_desperto_criatura_artificial"),
        { tipo: "tipo_criatura", valor: "construto" },
        { tipo: "visao", valor: "escuro" },
        { tipo: "imunidade_condicao", condicoes: ["cansaco", "metabolico", "veneno"] }
      );
      // Chassi-level immunity/RD efeitos
      const chassiEscolha = race.escolhas?.find((e) => e.id === "golem_desperto_chassi");
      if (chassiEscolha?.chassi) {
        for (const opt of chassiEscolha.chassi) {
          if (opt.efeitos) continue;
          if (opt.id === "golem_desperto_carne") {
            opt.efeitos = [
              { tipo: "imunidade_condicao", condicoes: ["metamorfose"] },
              { tipo: "imunidade_dano_tipo", tipos: ["trevas"] },
              { tipo: "definir_deslocamento_base", valor: 6 }
            ];
          } else if (opt.id === "golem_desperto_gelo_eterno") {
            opt.efeitos = [
              { tipo: "imunidade_dano_tipo", tipos: ["frio"] },
              { tipo: "reducao_dano", tipos: ["fogo"], valor: 10 },
              { tipo: "definir_deslocamento_base", valor: 6 }
            ];
          } else if (opt.id === "golem_desperto_pedra") {
            opt.efeitos = [
              { tipo: "reducao_dano", tipos: ["corte", "fogo", "perfuracao"], valor: 5 },
              { tipo: "definir_deslocamento_base", valor: 6 }
            ];
          } else if (opt.id === "golem_desperto_ferro") {
            opt.efeitos = [
              { tipo: "bonus_defesa", valor: 2 },
              { tipo: "definir_deslocamento_base", valor: 6 }
            ];
          }
        }
      }
      break;
    }

    // ── Duende — adiciona imunidades às naturezas ─────────────────────────
    case "duende": {
      const naturezaEscolha = race.escolhas?.find((e) => e.id === "duende_natureza");
      if (naturezaEscolha?.opcoes) {
        for (const opt of naturezaEscolha.opcoes) {
          if (opt.id === "vegetal") {
            const habVegetal = opt.habilidades?.find((h) => h.id === "duende_natureza_vegetal");
            if (habVegetal && !habVegetal.efeitos) {
              habVegetal.efeitos = [
                { tipo: "imunidade_condicao", condicoes: ["atordoamento", "metamorfose"] }
              ];
            }
          }
        }
      }
      break;
    }

    // ── Moreau ─────────────────────────────────────────────────────────────
    case "moreau": {
      const variacaoEscolha = race.escolhas?.find((e) => e.id === "moreau_variacao");
      if (variacaoEscolha?.opcoes) {
        const moreauEfeitos = {
          moreau_coruja: [
            { tipo: "visao", valor: "escuro" },
            { tipo: "bonus_pericia", pericias: ["percepcao", "vontade"], valor: 2 }
          ],
          moreau_hiena: [
            { tipo: "sentido_especial", valor: "faro" }
          ],
          moreau_raposa: [
            { tipo: "visao", valor: "penumbra" },
            { tipo: "definir_deslocamento_base", valor: 12 }
          ],
          moreau_serpente: [
            { tipo: "visao", valor: "escuro" },
            { tipo: "bonus_pericia", pericias: ["furtividade", "diplomacia"], valor: 2 }
          ],
          moreau_bufalo: [
            { tipo: "sentido_especial", valor: "faro" }
          ],
          moreau_coelho: [
            { tipo: "visao", valor: "penumbra" },
            { tipo: "bonus_pericia", pericias: ["percepcao", "reflexos"], valor: 2 }
          ],
          moreau_crocodilo: [
            { tipo: "bonus_defesa", valor: 1 },
            { tipo: "bonus_pericia", pericias: ["furtividade"], valor: 2 }
          ],
          moreau_gato: [
            { tipo: "visao", valor: "penumbra" },
            { tipo: "bonus_pericia", pericias: ["furtividade", "percepcao"], valor: 2 }
          ],
          moreau_leao: [
            { tipo: "visao", valor: "penumbra" },
            { tipo: "bonus_pericia", pericias: ["intimidacao", "percepcao"], valor: 2 }
          ],
          moreau_lobo: [
            { tipo: "sentido_especial", valor: "faro" }
          ],
          moreau_morcego: [
            { tipo: "visao", valor: "escuro" },
            { tipo: "bonus_pericia", pericias: ["furtividade", "percepcao"], valor: 2 }
          ],
          moreau_urso: [
            { tipo: "sentido_especial", valor: "faro" }
          ]
        };
        for (const opt of variacaoEscolha.opcoes) {
          if (!opt.efeitos && moreauEfeitos[opt.id]) {
            opt.efeitos = moreauEfeitos[opt.id];
          }
        }
      }
      break;
    }
  }
}

writeFileSync(filePath, JSON.stringify(races, null, 2), "utf-8");
console.log("✓ races_update.json normalizado com efeitos.");
