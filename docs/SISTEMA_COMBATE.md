# Sistema de Combate

## Patamares

O patamar e calculado pelo nivel do personagem:

- Iniciante: niveis 1 a 4.
- Veterano: niveis 5 a 10.
- Campeao: niveis 11 a 16.
- Lenda: niveis 17 a 20.

O campo `personagem.info.patamarId` fica no modelo e tambem aparece no Debug F12, dentro de Identidade.

## Maos e Empunhadura

Cada mao e um slot generico. Ela pode estar livre ou ocupada por qualquer item equipado na mao: arma, escudo, foco, varinha, cajado ou outro item geral.

Estrutura:

```js
personagem.combate.empunhadura = {
  maoDireita: { itemInventarioId: null },
  maoEsquerda: { itemInventarioId: null },
  usandoDuasMaos: false,
  itemDuasMaosId: null
};
```

Mao livre usa ataque desarmado. Ataque desarmado e uma unica arma leve corpo a corpo do proprio corpo, causa impacto nao letal e dano base `1d3` para criaturas Pequenas e Medias.

Itens de duas maos ocupam as duas maos. Ao equipar item de uma mao enquanto existe item de duas maos equipado, o item de duas maos e removido das maos e volta a ficar apenas no inventario. Armas adaptaveis podem ser tratadas pela UI como uma ou duas maos ao chamar a regra.

## Passos de Dano

O dano desarmado usa a tabela de passos em `src/core/rules/combate.js`.

Base:

- Minusculo: `1d2`
- Pequeno/Medio: `1d3`
- Grande/Enorme: `1d4`
- Colossal: `1d6`

Isso segue a regra de tamanho: criaturas Grandes e Enormes usam armas aumentadas, com +1 passo; Colossais usam armas gigantes, com +2 passos.

## Montaria

Estrutura:

```js
personagem.corpo.montaria = {
  montado: false,
  natural: false,
  montariaId: null,
  tamanhoId: null,
  nivelMontaria: "iniciante",
  treinadoEmCavalgar: false,
  possuiGinete: false,
  observacoes: ""
};
```

Quando montado em uma montaria real, o personagem usa o tamanho da montaria para espaco ocupado e modificador de Furtividade. Sem treino em Cavalgar, precisa guiar a montaria com acao de movimento e teste de Cavalgar CD 10; tambem sofre -2 em ataques a distancia e condicao ruim para magias. Treino em Cavalgar ou Ginete remove esses custos/penalidades conforme a regra.

Centauro e caso especial: `montaria.natural = true`, `montado = true`, `montariaId = "centauro"`. Ele e considerado montado para investidas e beneficios de armas, mas nao recebe beneficios de uma montaria externa.

## Debug F12

O Debug mostra:

- Identidade: patamar.
- Combate: mao direita, mao esquerda, estado montado, dano desarmado quando a mao esta livre, e dados basicos de montaria.
- Pericias: atributo-chave + metade do nivel + bonus de treinamento + bonus diversos.

## Pericias

Toda pericia soma:

```txt
atributo-chave + bonus de nivel + bonus de treinamento + bonus diversos
```

Bonus de nivel e metade do nivel arredondada para baixo. Assim, todo nivel par adiciona +1 em todas as pericias.

Bonus de treinamento so entra em pericias treinadas:

- Nivel 1 a 6: +2.
- Nivel 7 a 14: +4.
- Nivel 15 em diante: +6.

Bonus diversos sao somados no mesmo bloco, independentemente da origem: raca, origem, classe, item, tamanho ou ajustes manuais.

## Regras Centrais

Arquivo principal: `src/core/rules/combate.js`.

Funcoes principais:

- `calcularPatamarParaNivel`
- `calcularDanoDesarmado`
- `criarAtaqueDesarmado`
- `equiparItemNaMao`
- `normalizarEmpunhadura`
- `criarMontariaParaRaca`
- `normalizarMontaria`
- `calcularPenalidadesCombateMontado`

Regras de pericia: `src/core/rules/pericias.js`.
