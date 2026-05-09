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
  const origem = catalogs.origins.find((o) => o.id === draft.info.origemId);
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
            value={empunhadura.maoDireita.itemInventarioId ? "Ocupada" : "Livre"}
            sub={describeHand(empunhadura.maoDireita, draft, catalogs, danoDesarmado)}
          />
          <DbgRow
            label="Mão Esquerda"
            value={empunhadura.maoEsquerda.itemInventarioId ? "Ocupada" : "Livre"}
            sub={describeHand(empunhadura.maoEsquerda, draft, catalogs, danoDesarmado)}
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

function DbgSection({ title, children }) {
  return (
    <div className="dbg__section">
      <div className="dbg__section-title">{title}</div>
      {children}
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
