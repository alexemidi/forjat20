import { useEffect, useState } from "react";
import {
  calcularDanoDesarmado,
  calcularPatamarParaNivel,
  calcularPenalidadesCombateMontado,
  estaMontado,
  nomePatamar,
  normalizarEmpunhadura,
  normalizarMontaria,
  obterBeneficiosMontaria
} from "../../core/rules/combate.js";
import { ATRIBUTOS, calcularAtributosComEscolhas, calcularBonusRacial } from "./model/atributos.js";
import { calcularPericiasPersonagem } from "./model/periciasPersonagem.js";
import {
  calcularBonusPericiasRaciais,
  coletarBonusAtaqueRaciais,
  coletarBonusDanoRaciais,
  coletarBonusPmRacial,
  coletarBonusPvRacial,
  coletarHabilidadesAtivas,
  coletarImunidadesRaciais,
  coletarPericiasTreinadasRaciais,
  coletarProficienciasRaciais,
  coletarRDRaciais,
  coletarTipoCriatura,
  coletarVisao
} from "./model/racaEfeitos.js";
import "./DebugPanel.css";

const PERICIAS = [
  { id: "acrobacia",     nome: "Acrobacia",     atributo: "des" },
  { id: "adestramento",  nome: "Adestramento",  atributo: "car" },
  { id: "atletismo",     nome: "Atletismo",     atributo: "for" },
  { id: "atuacao",       nome: "Atuação",       atributo: "car" },
  { id: "cavalgar",      nome: "Cavalgar",      atributo: "des" },
  { id: "conhecimento",  nome: "Conhecimento",  atributo: "int" },
  { id: "cura",          nome: "Cura",          atributo: "sab" },
  { id: "diplomacia",    nome: "Diplomacia",    atributo: "car" },
  { id: "enganacao",     nome: "Enganação",     atributo: "car" },
  { id: "fortitude",     nome: "Fortitude",     atributo: "con" },
  { id: "furtividade",   nome: "Furtividade",   atributo: "des" },
  { id: "guerra",        nome: "Guerra",        atributo: "int" },
  { id: "iniciativa",    nome: "Iniciativa",    atributo: "des" },
  { id: "intimidacao",   nome: "Intimidação",   atributo: "car" },
  { id: "intuicao",      nome: "Intuição",      atributo: "sab" },
  { id: "investigacao",  nome: "Investigação",  atributo: "int" },
  { id: "jogatina",      nome: "Jogatina",      atributo: "car" },
  { id: "ladinagem",     nome: "Ladinagem",     atributo: "des" },
  { id: "luta",          nome: "Luta",          atributo: "for" },
  { id: "misticismo",    nome: "Misticismo",    atributo: "int" },
  { id: "nobreza",       nome: "Nobreza",       atributo: "int" },
  { id: "oficio",        nome: "Ofício",        atributo: "int" },
  { id: "percepcao",     nome: "Percepção",     atributo: "sab" },
  { id: "pilotagem",     nome: "Pilotagem",     atributo: "des" },
  { id: "pontaria",      nome: "Pontaria",      atributo: "des" },
  { id: "reflexos",      nome: "Reflexos",      atributo: "des" },
  { id: "religiao",      nome: "Religião",      atributo: "sab" },
  { id: "sobrevivencia", nome: "Sobrevivência", atributo: "sab" },
  { id: "vontade",       nome: "Vontade",       atributo: "sab" }
];

const PERICIAS_SOMENTE_TREINADAS = new Set([
  "adestramento",
  "atuacao",
  "conhecimento",
  "cura",
  "guerra",
  "ladinagem",
  "misticismo",
  "nobreza",
  "oficio",
  "pilotagem",
  "religiao"
]);

export function DebugPanel({ draft, catalogs }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "F12") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  const race   = catalogs.races.find((r) => r.id === draft.info.racaId);
  const classe = catalogs.classes.find((c) => c.id === draft.info.classeId);
  const origem = catalogs.origins.find((o) => getCatalogEntryValue(o) === draft.info.origemId);
  const deus   = catalogs.gods.find((d) => d.id === draft.info.deusId);

  const nivel       = Number(draft.info.nivel ?? 1);
  const patamarId   = calcularPatamarParaNivel(nivel);
  const raceChoices = draft.escolhas.raca ?? {};

  const attrs = calcularAtributosComEscolhas(draft.atributosBase, race, raceChoices);

  // PV / PM
  const pvCfg = classe?.caracteristicas?.pv;
  const pmCfg = classe?.caracteristicas?.pm;
  const pvRacial = race ? coletarBonusPvRacial(race, raceChoices, nivel) : 0;
  const pmRacial = race ? coletarBonusPmRacial(race, raceChoices, nivel) : 0;
  const pvClasse = pvCfg
    ? (pvCfg.inicial ?? 0) +
      (pvCfg.porNivel ?? 0) * (nivel - 1) +
      (pvCfg.somaConstituicao ? (attrs.con ?? 0) * nivel : 0)
    : null;
  const pmClasse = pmCfg ? (pmCfg.porNivel ?? 0) * nivel : null;
  const pv = pvClasse !== null ? pvClasse + pvRacial : null;
  const pm = pmClasse !== null ? pmClasse + pmRacial : null;

  // Tamanho → modificadores de Furtividade e Manobra
  const tamanho = draft.corpo?.tamanhoId ?? "medio";
  const SIZE_MANOBRA     = { minusculo: -5, pequeno: -2, medio: 0, grande: 2, enorme: 5, colossal: 10 };
  const SIZE_FURTIVIDADE = { minusculo:  5, pequeno:  2, medio: 0, grande: -2, enorme: -5, colossal: -10 };
  const bonusTamanhoManobra    = SIZE_MANOBRA[tamanho]     ?? 0;
  const bonusTamanhoFurtividade = SIZE_FURTIVIDADE[tamanho] ?? 0;

  // Combate
  const defesa      = 10 + (attrs.des ?? 0);
  const cargaMax    = (attrs.for ?? 0) * 5;
  const deslocamento = draft.corpo?.deslocamentoBase ?? 9;
  const personagemCombate = { ...draft, info: { ...draft.info, racaId: race?.id ?? draft.info.racaId } };
  const empunhadura = normalizarEmpunhadura(draft.combate?.empunhadura);
  const montaria = normalizarMontaria(draft.corpo?.montaria, race?.id ?? draft.info.racaId, draft.corpo);
  const penalidadesMontado = calcularPenalidadesCombateMontado(personagemCombate);
  const beneficiosMontaria = obterBeneficiosMontaria(montaria);
  const danoDesarmado = calcularDanoDesarmado(personagemCombate);

  // Manobra
  const lutaBonus = (attrs.for ?? 0);
  const manobra = lutaBonus + bonusTamanhoManobra;

  // Perícias: classe fixa + racial bonus + tamanho + racial treinada
  const periciasCalculadas = calcularPericiasPersonagem(draft, catalogs, {
    race,
    classe,
    raceChoices,
    attrs,
    bonusTamanhoFurtividade
  });
  const pericias = periciasCalculadas.pericias;
  const bonusNivelPericia = periciasCalculadas.bonusNivelPericia;
  /* legacy pericias calculation moved to calcularPericiasPersonagem.
  const pericias = PERICIAS.map((p) => {
    const treinada  =
      fixasClasse.has(p.id) ||
      fixasEscolhidasClasse.has(p.id) ||
      periciasEscolhidasRaca.has(p.id) ||
      periciasEscolhidasClasse.has(p.id) ||
      periciasInteligenciaClasse.has(p.id) ||
      treinadasRaciais.has(p.id);
    const attrVal   = attrs[p.atributo] ?? 0;
    const racial    = bonusRacial[p.id] ?? 0;
    const sizeBon   = p.id === "furtividade" ? bonusTamanhoFurtividade : 0;
    const bonusDiversos = racial + sizeBon;
    const bonusTreino = calcularBonusTreinamentoPericia(nivel, treinada);
    const bloqueada = PERICIAS_SOMENTE_TREINADAS.has(p.id) && !treinada;
    const total = bloqueada ? bonusDiversos : calcularTotalPericia({ atributo: attrVal, nivel, treinada, bonusDiversos });
    const bonusGeral = bonusTreino + bonusDiversos;
    return { ...p, treinada, racial, sizeBon, bonusDiversos, bonusGeral, bonusNivel: bonusNivelPericia, bonusTreino, total, attrVal, bloqueada };
  });

  // Proficiências
  */
  const proficiencias = classe?.caracteristicas?.proficiencias ?? [];
  const proficienciasRaciais = race ? coletarProficienciasRaciais(race, raceChoices) : [];
  const bonusAtaqueRaciais = race ? coletarBonusAtaqueRaciais(race, raceChoices) : [];
  const bonusDanoRaciais = race ? coletarBonusDanoRaciais(race, raceChoices) : [];
  const mochila = montarMochilaDebug(draft, catalogs, origem, pericias);
  const autoEquipamentoArma = getAutoEquippedWeaponSlot(mochila, empunhadura);
  const armaAutoDireita = autoEquipamentoArma?.mao === "maoDireita" || autoEquipamentoArma?.duasMaos ? autoEquipamentoArma.arma : null;
  const armaAutoEsquerda = autoEquipamentoArma?.mao === "maoEsquerda" || autoEquipamentoArma?.duasMaos ? autoEquipamentoArma.arma : null;

  // Redução de dano (structured)
  const rds = race ? coletarRDRaciais(race, raceChoices) : [];

  // Imunidades (structured)
  const { condicoes: imuneCondicoes, tiposDano: imuneDano } = race
    ? coletarImunidadesRaciais(race, raceChoices)
    : { condicoes: [], tiposDano: [] };

  // Tipo criatura + visão
  const tipoCriatura = race ? coletarTipoCriatura(race, raceChoices) : null;
  const visoes       = race ? coletarVisao(race, raceChoices) : [];

  // Habilidades raciais ativas
  const habsAtivas = race ? coletarHabilidadesAtivas(race, raceChoices) : [];

  return (
    <div className="dbg">
      <div className="dbg__bar">
        <span>⚙ Debug — Ficha</span>
        <button onClick={() => setOpen(false)} type="button">✕</button>
      </div>

      <div className="dbg__body">

        <DbgSection title="Identidade">
          <DbgRow label="Nome"      value={draft.info.nome    || "—"} />
          <DbgRow label="Jogador"   value={draft.info.jogador || "—"} />
          <DbgRow label="Sexo"      value={draft.info.sexo    || "—"} />
          <DbgRow label="Nível"     value={nivel} />
          <DbgRow label="Patamar"   value={nomePatamar(patamarId)} sub={patamarId} />
          <DbgRow label="Raça"      value={race?.nome    ?? "—"} />
          <DbgRow label="Classe"    value={classe?.nome  ?? "—"} />
          <DbgRow label="Origem"    value={origem?.nome  ?? "—"} />
          <DbgRow label="Divindade" value={deus?.nome    ?? "—"} />
          {tipoCriatura && <DbgRow label="Tipo"   value={tipoCriatura} />}
          {visoes.length > 0 && <DbgRow label="Visão" value={visoes.join(", ")} />}
        </DbgSection>

        <DbgSection title="Atributos">
          {ATRIBUTOS.map((a) => {
            const base   = draft.atributosBase[a.id] ?? 0;
            const racial = calcularBonusRacial(race, raceChoices, a.id);
            const final  = attrs[a.id] ?? 0;
            return (
              <DbgRow
                key={a.id}
                label={a.nome}
                value={signed(final)}
                sub={racial !== 0 ? `base ${signed(base)} + raça ${signed(racial)}` : `base ${signed(base)}`}
              />
            );
          })}
        </DbgSection>

        <DbgSection title="Combate">
          <DbgRow label="PV"           value={pv ?? "—"}   sub={pvCfg ? `${pvCfg.inicial} + ${pvCfg.porNivel}×(nív-1)${pvCfg.somaConstituicao ? " + CON×nív" : ""}${pvRacial ? ` + ${pvRacial} raça` : ""}` : "sem classe"} />
          <DbgRow label="PM"           value={pm ?? "—"}   sub={pmCfg ? `${pmCfg.porNivel}×nível${pmRacial ? ` + ${pmRacial} raça` : ""}` : "sem classe"} />
          <DbgRow label="Defesa"       value={defesa}      sub="10 + DES" />
          <DbgRow label="Deslocamento" value={`${deslocamento}m`} />
          <DbgRow label="Tamanho"      value={tamanho} />
          <DbgRow label="Carga máx."   value={`${cargaMax} kg`} sub="FOR × 5" />
          <DbgRow label="Manobra" value={signed(manobra)} sub={`Luta ${signed(lutaBonus)}${bonusTamanhoManobra !== 0 ? ` + tam ${signed(bonusTamanhoManobra)}` : ""}`} />
          <DbgRow
            label="Mão Direita"
            value={empunhadura.maoDireita.itemInventarioId || armaAutoDireita ? "Ocupada" : "Livre"}
            sub={empunhadura.maoDireita.itemInventarioId ? describeHand(empunhadura.maoDireita, draft, catalogs, danoDesarmado) : describeAutoHand(armaAutoDireita, danoDesarmado)}
          />
          <DbgRow
            label="Mão Esquerda"
            value={empunhadura.maoEsquerda.itemInventarioId || armaAutoEsquerda ? "Ocupada" : "Livre"}
            sub={empunhadura.maoEsquerda.itemInventarioId ? describeHand(empunhadura.maoEsquerda, draft, catalogs, danoDesarmado) : describeAutoHand(armaAutoEsquerda, danoDesarmado)}
          />
          {empunhadura.usandoDuasMaos ? (
            <DbgRow
              label="Duas Mãos"
              value="Ativa"
              sub={empunhadura.itemDuasMaosId ? `Item: ${resolveInventoryItemName(empunhadura.itemDuasMaosId, draft, catalogs)}` : "Item ocupa ambas as mãos"}
            />
          ) : null}
          <DbgRow
            label="Montado"
            value={estaMontado(personagemCombate) ? "Sim" : "Não"}
            sub={montaria.montado ? describeMounted(montaria, penalidadesMontado, beneficiosMontaria) : "A pé"}
          />
          {montaria.montado ? (
            <>
              <DbgRow label="Montaria" value={montaria.montariaId ?? "natural"} />
              <DbgRow label="Cavalgar" value={montaria.natural || montaria.treinadoEmCavalgar ? "Automático" : "Teste necessário"} sub={penalidadesMontado.testeGuia ?? "Sem teste para receber benefícios"} />
            </>
          ) : null}
        </DbgSection>

        <DbgSection title="Mochila">
          <DbgInventoryWeapons items={mochila.armas} pericias={pericias} catalogs={catalogs} />
          <DbgInventoryDefenses items={mochila.defesas} catalogs={catalogs} />
          <DbgInventoryGeneral items={mochila.gerais} total={mochila} />
        </DbgSection>

        <DbgSection title="Proficiências">
          {proficiencias.length || proficienciasRaciais.length || bonusAtaqueRaciais.length || bonusDanoRaciais.length
            ? proficiencias.map((p, i) => <div key={i} className="dbg__tag">{p}</div>)
            : <span className="dbg__none">{classe ? "Nenhuma" : "Sem classe selecionada"}</span>}
          {proficienciasRaciais.map((p, i) => <div key={`r-${i}`} className="dbg__tag">{p.descricao}</div>)}
          {bonusAtaqueRaciais.map((bonus, i) => (
            <div key={`b-${i}`} className="dbg__ability">
              <strong>{bonus.descricao}</strong>
              {bonus.fonte ? <small> — {bonus.fonte}</small> : null}
            </div>
          ))}
          {bonusDanoRaciais.map((bonus, i) => (
            <div key={`d-${i}`} className="dbg__ability">
              <strong>{bonus.descricao}</strong>
              {bonus.condicao ? <em> ({bonus.condicao})</em> : null}
              {bonus.fonte ? <small> — {bonus.fonte}</small> : null}
            </div>
          ))}
        </DbgSection>

        <DbgSection title="Perícias">
          <p className="dbg__note">
            Total = atributo + bônus por nível + treino, se treinada, + bônus. X indica perícia que exige treino.
          </p>
          <div className="dbg__skill-table">
            <div className="dbg__skill-head">
              <span>Perícia</span><span>ATR</span><span>Nív</span><span>Bôn</span><span>Total</span>
            </div>
            {pericias.map((p) => (
              <div className={`dbg__skill-row${p.treinada ? " dbg__skill-row--t" : ""}${p.bonusDiversos !== 0 ? " dbg__skill-row--r" : ""}${p.bloqueada ? " dbg__skill-row--blocked" : ""}`} key={p.id}>
                <span>{p.nome}</span>
                <span>{p.atributo.toUpperCase()}</span>
                <span>{p.bloqueada ? "X" : plainNumber(p.bonusNivel)}</span>
                <span>{plainNumber(p.bonusGeral)}</span>
                <span>{plainNumber(p.total)}</span>
              </div>
            ))}
          </div>
        </DbgSection>

        <DbgSection title="Redução de Dano">
          {rds.length
            ? rds.map((rd, i) => (
                <div key={i} className="dbg__ability">
                  <strong>{rd.tipos.join("/")}</strong> {rd.valor}
                  {rd.condicao ? <em> ({rd.condicao})</em> : null}
                  {rd.fonte ? <small> — {rd.fonte}</small> : null}
                </div>
              ))
            : <span className="dbg__none">{race ? "Nenhuma" : "Sem raça selecionada"}</span>}
        </DbgSection>

        <DbgSection title="Imunidades">
          {imuneCondicoes.length === 0 && imuneDano.length === 0
            ? <span className="dbg__none">{race ? "Nenhuma" : "Sem raça selecionada"}</span>
            : <>
                {imuneCondicoes.map((c) => <div key={c} className="dbg__tag">{c}</div>)}
                {imuneDano.map((t) => <div key={t} className="dbg__tag">dano {t}</div>)}
              </>}
        </DbgSection>

        <DbgSection title="Habilidades Raciais">
          {habsAtivas.length
            ? habsAtivas.map((h, i) => (
                <div key={i} className="dbg__ability">
                  <strong>{h.nome}.</strong> {h.descricao}
                </div>
              ))
            : <span className="dbg__none">{race ? "Nenhuma registrada" : "Sem raça selecionada"}</span>}
        </DbgSection>

      </div>
    </div>
  );
}

const INITIAL_BACKPACK_ITEM_IDS = ["mochila", "saco_de_dormir", "traje_de_viajante"];

const OFICIO_LABELS = {
  alquimista: "alquimista",
  armeiro: "armeiro",
  artesao: "artes\u00e3o",
  cozinheiro: "cozinheiro",
  engenhoqueiro: "engenhoqueiro",
  escriba: "escriba",
  fazendeiro: "fazendeiro",
  pescador: "pescador",
  mercador: "mercador",
  minerador: "minerador",
  alvenaria: "alvenaria",
  carpinteiro: "carpinteiro",
  joalheiro: "joalheiro",
  estalajadeiro: "estalajadeiro",
  escultor: "escultor",
  pintor: "pintor"
};

function montarMochilaDebug(draft, catalogs, origem, pericias = []) {
  const entries = new Map();
  const selectedOriginItems = draft.escolhas?.origem?.itens ?? {};
  const defaultOficioId = pericias.find((pericia) => String(pericia.id).startsWith("oficio:"))?.id?.slice("oficio:".length) ?? "";

  function addItem(itemId, quantidade = 1, nomeOverride = "", melhoriaIds = []) {
    if (!itemId) return;
    const catalogItem = catalogs.items.find((item) => item.id === itemId);
    const nome = nomeOverride || catalogItem?.nome || itemId;
    const espacosUnitarios = Number(catalogItem?.espacos ?? 0);
    const key = `${itemId}:${nome}`;
    const current = entries.get(key) ?? { key, itemId, catalogItem, nome, melhoriaIds, quantidade: 0, espacosTotal: 0 };
    current.quantidade += quantidade;
    current.espacosTotal += espacosUnitarios * quantidade;
    entries.set(key, current);
  }

  function addInstrumentosOficio(oficioId) {
    const label = oficioId ? ` (${OFICIO_LABELS[oficioId] ?? oficioId})` : "";
    addItem("instrumentos_de_oficio", 1, `Instrumentos de Of\u00edcio${label}`);
  }

  INITIAL_BACKPACK_ITEM_IDS.forEach((itemId) => addItem(itemId));

  (origem?.itens ?? []).forEach((itemText, index) => {
    const slotId = `item_${index}`;
    const selectedItemId = selectedOriginItems[slotId];

    if (isDebugOficioInstrumentChoice(itemText)) {
      addInstrumentosOficio(selectedItemId || defaultOficioId);
      return;
    }

    if (selectedItemId === "instrumentos_de_oficio") {
      addInstrumentosOficio(selectedOriginItems[`${slotId}:oficio`] || defaultOficioId);
      return;
    }

    if (selectedItemId) {
      addItem(selectedItemId);
      return;
    }

    const fixedItem = catalogs.items.find((item) => normalizeDebugText(item.nome) === normalizeDebugText(itemText));
    if (fixedItem) addItem(fixedItem.id);
  });

  const prototipo = draft.escolhas?.classe?.prototipo ?? {};
  if (prototipo.itemSuperior?.itemId) {
    const selectedImprovementIds = getDebugPrototypeImprovementIds(prototipo.itemSuperior);
    const improvementNames = selectedImprovementIds
      .map((id) => catalogs.improvements.find((improvement) => improvement.id === id)?.nome)
      .filter(Boolean);
    const item = catalogs.items.find((catalogItem) => catalogItem.id === prototipo.itemSuperior.itemId);
    const suffix = improvementNames.length ? ` (${improvementNames.join(", ")})` : "";
    addItem(prototipo.itemSuperior.itemId, 1, item ? `${item.nome}${suffix}` : "", selectedImprovementIds);
  }
  (prototipo.alquimicos ?? []).forEach((itemId) => addItem(itemId));
  (draft.escolhas?.equipamentoInicialIds ?? []).forEach((itemId) => addItem(itemId));
  (draft.inventario?.itens ?? []).forEach((item) => addItem(item.itemId, Number(item.quantidade ?? 1) || 1));

  const itens = [...entries.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const armas = itens.filter((item) => item.catalogItem?.tipo === "arma");
  const defesas = itens.filter((item) => item.catalogItem?.tipo === "armadura" || item.catalogItem?.tipo === "escudo");
  const gerais = itens.filter((item) => item.catalogItem?.tipo !== "arma" && item.catalogItem?.tipo !== "armadura" && item.catalogItem?.tipo !== "escudo");
  return {
    itens,
    armas,
    defesas,
    gerais,
    quantidadeTotal: itens.reduce((total, item) => total + item.quantidade, 0),
    espacosTotal: itens.reduce((total, item) => total + item.espacosTotal, 0)
  };
}

function isDebugOficioInstrumentChoice(itemText) {
  const normalized = normalizeDebugText(itemText);
  return normalized.includes("instrumentos de oficio") && normalized.includes("qualquer");
}

function getDebugPrototypeImprovementIds(itemSuperior) {
  if (Array.isArray(itemSuperior?.melhoriaIds)) return itemSuperior.melhoriaIds.filter(Boolean);
  return itemSuperior?.melhoriaId ? [itemSuperior.melhoriaId] : [];
}

function normalizeDebugText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatInventorySpaces(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function getCatalogEntryValue(entry) {
  return entry?.id ?? entry?.nome;
}

function DbgSection({ title, children }) {
  return (
    <div className="dbg__section">
      <div className="dbg__section-title">{title}</div>
      {children}
    </div>
  );
}

function DbgInventoryWeapons({ items, pericias, catalogs }) {
  if (!items.length) return null;
  const lutaTotal = pericias.find((pericia) => pericia.id === "luta")?.total ?? 0;
  return (
    <div className="dbg__inventory-block">
      <div className="dbg__inventory-subtitle">Armas</div>
      <div className="dbg__inventory-table dbg__inventory-table--weapons">
        <div className="dbg__inventory-head">
          <span>Nome</span><span>TA</span><span>Dn</span><span>Crt</span><span>Esp</span>
        </div>
        {items.map((item) => {
          const mods = getDebugImprovementModifiers(item, catalogs);
          return (
            <div className="dbg__inventory-row" key={item.key}>
              <span>{formatInventoryName(item)}</span>
              <span>{plainNumber(lutaTotal + mods.ataque)}</span>
              <span>{formatDebugWeaponDamage(item.catalogItem, mods.dano)}</span>
              <span>{formatDebugWeaponCritical(item.catalogItem, mods)}</span>
              <span>{formatInventorySpaces(item.espacosTotal)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DbgInventoryDefenses({ items, catalogs }) {
  if (!items.length) return null;
  return (
    <div className="dbg__inventory-block">
      <div className="dbg__inventory-subtitle">Armaduras e Escudos</div>
      <div className="dbg__inventory-table dbg__inventory-table--defenses">
        <div className="dbg__inventory-head">
          <span>Nome</span><span>Def</span><span>Pen</span><span>Esp</span>
        </div>
        {items.map((item) => {
          const mods = getDebugImprovementModifiers(item, catalogs);
          return (
            <div className="dbg__inventory-row" key={item.key}>
              <span>{formatInventoryName(item)}</span>
              <span>{formatBonus(getDebugDefenseValue(item.catalogItem) + mods.defesa)}</span>
              <span>{formatNumberOrDash(getDebugArmorPenalty(item.catalogItem) + mods.penalidade)}</span>
              <span>{formatInventorySpaces(item.espacosTotal)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DbgInventoryGeneral({ items, total }) {
  return (
    <div className="dbg__inventory-block">
      <div className="dbg__inventory-subtitle">Itens Gerais</div>
      <div className="dbg__inventory-table dbg__inventory-table--general">
        <div className="dbg__inventory-head">
          <span>Nome</span><span>Qtd</span><span>Esp</span>
        </div>
        {items.map((item) => (
          <div className="dbg__inventory-row" key={item.key}>
            <span>{item.nome}</span>
            <span>{item.quantidade}</span>
            <span>{formatInventorySpaces(item.espacosTotal)}</span>
          </div>
        ))}
        <div className="dbg__inventory-total">
          <span>Total</span><span>{total.quantidadeTotal}</span><span>{formatInventorySpaces(total.espacosTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function DbgRow({ label, value, sub }) {
  return (
    <div className="dbg__row">
      <span className="dbg__label">{label}</span>
      <span className="dbg__value">
        {value}
        {sub ? <small>{sub}</small> : null}
      </span>
    </div>
  );
}

function describeHand(mao, draft, catalogs, danoDesarmado) {
  if (!mao?.itemInventarioId) return `Ataque desarmado ${danoDesarmado}, impacto, não letal`;
  return `Item: ${resolveInventoryItemName(mao.itemInventarioId, draft, catalogs)}`;
}

function describeAutoHand(armaAutoEquipada, danoDesarmado) {
  if (!armaAutoEquipada) return `Ataque desarmado ${danoDesarmado}, impacto, não letal`;
  return `Item: ${armaAutoEquipada.nome}`;
}

function getAutoEquippedWeaponSlot(mochila, empunhadura) {
  if (empunhadura.usandoDuasMaos) return null;
  const arma = mochila.armas[0];
  if (!arma) return null;

  const direitaLivre = !empunhadura.maoDireita.itemInventarioId;
  const esquerdaLivre = !empunhadura.maoEsquerda.itemInventarioId;
  const duasMaos = getDebugWeaponHands(arma.catalogItem) === 2;

  if (duasMaos) return direitaLivre && esquerdaLivre ? { arma, duasMaos: true } : null;
  if (direitaLivre) return { arma, mao: "maoDireita" };
  if (esquerdaLivre) return { arma, mao: "maoEsquerda" };
  return null;
}

function getDebugWeaponHands(item) {
  return item?.arma?.empunhaduraId === "duas_maos" || item?.equipamento?.slotsPermitidos?.includes("duas_maos") ? 2 : 1;
}

function formatInventoryName(item) {
  return item.quantidade > 1 ? `${item.nome} x${item.quantidade}` : item.nome;
}

function getDebugImprovementModifiers(item, catalogs) {
  const modifiers = {
    ataque: 0,
    dano: 0,
    defesa: 0,
    penalidade: 0,
    margem: 0,
    multiplicador: 0
  };
  getDebugImprovements(item, catalogs).forEach((improvement) => {
    (improvement.efeitos ?? []).forEach((effect) => {
      if (effect.tipo === "bonus_ataque_arma") modifiers.ataque += Number(effect.bonus ?? 0);
      if (effect.tipo === "bonus_dano_arma") modifiers.dano += Number(effect.bonus ?? 0);
      if (effect.tipo === "bonus_defesa_item") modifiers.defesa += Number(effect.bonus ?? 0);
      if (effect.tipo === "reduzir_penalidade_armadura_item") modifiers.penalidade += Number(effect.valor ?? 0);
      if (effect.tipo === "aumentar_penalidade_armadura_item") modifiers.penalidade -= Number(effect.valor ?? 0);
      if (effect.tipo === "bonus_margem_ameaca") modifiers.margem += Number(effect.bonus ?? 0);
      if (effect.tipo === "bonus_multiplicador_critico") modifiers.multiplicador += Number(effect.bonus ?? 0);
    });
  });
  return modifiers;
}

function getDebugImprovements(item, catalogs) {
  const ids = item.melhoriaIds ?? [];
  return ids.map((id) => catalogs.improvements.find((improvement) => improvement.id === id)).filter(Boolean);
}

function formatDebugWeaponDamage(item, bonusDano) {
  const damage = item?.arma?.dano?.texto ?? item?.arma?.dano?.principal ?? "—";
  return bonusDano ? `${damage}${bonusDano > 0 ? "+" : ""}${bonusDano}` : damage;
}

function formatDebugWeaponCritical(item, modifiers) {
  if (item?.arma?.critico?.texto && !modifiers.margem && !modifiers.multiplicador) return item.arma.critico.texto;
  const baseMargem = Number(item?.arma?.critico?.margem ?? 20);
  const baseMultiplicador = Number(item?.arma?.critico?.multiplicador ?? 2);
  const margem = Math.max(1, baseMargem - modifiers.margem);
  const multiplicador = baseMultiplicador + modifiers.multiplicador;
  return margem !== 20 ? `${margem}/x${multiplicador}` : `x${multiplicador}`;
}

function getDebugDefenseValue(item) {
  if (item?.tipo === "armadura") return Number(item.armadura?.defesa ?? 0);
  if (item?.tipo === "escudo") return Number(item.escudo?.bonusDefesa ?? 0);
  return 0;
}

function getDebugArmorPenalty(item) {
  if (item?.tipo === "armadura") return Number(item.armadura?.penalidade ?? 0);
  if (item?.tipo === "escudo") return Number(item.escudo?.penalidade ?? 0);
  return 0;
}

function formatBonus(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number > 0 ? `+${number}` : String(number);
}

function formatNumberOrDash(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "—";
}

function resolveInventoryItemName(itemInventarioId, draft, catalogs) {
  const itemInventario = (draft.inventario?.itens ?? []).find((item) => item.id === itemInventarioId);
  const itemCatalogo = catalogs.items.find((item) => item.id === itemInventario?.itemId);
  return itemCatalogo?.nome ?? itemInventario?.itemId ?? itemInventarioId;
}

function describeMounted(montaria, penalidades, beneficios) {
  if (montaria.natural) return montaria.observacoes || "Montado naturalmente";

  const partes = [];
  if (montaria.tamanhoId) partes.push(`tamanho ${montaria.tamanhoId}`);
  if (beneficios?.deslocamentoBase) partes.push(`desloc. ${beneficios.deslocamentoBase}m`);
  if (beneficios?.deslocamentoVoo) partes.push(`voo ${beneficios.deslocamentoVoo}m`);
  if (beneficios?.acoesMovimentoExtras) partes.push(`+${beneficios.acoesMovimentoExtras} mov.`);
  if (penalidades.penalidadeAtaqueDistancia) partes.push(`${penalidades.penalidadeAtaqueDistancia} ataque distância`);
  if (penalidades.condicaoMagia !== "normal") partes.push(`magia ${penalidades.condicaoMagia}`);
  return partes.length ? partes.join("; ") : "Sem benefício registrado";
}

function signed(v) {
  const n = Number(v);
  return n >= 0 ? `+${n}` : String(n);
}

function plainNumber(v) {
  return String(Number(v ?? 0));
}
