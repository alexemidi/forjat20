# Fluxo de Criacao de Personagem

Este fluxo segue a ordem do livro basico, mas dividido em paginas do criador.

## Home - Configuracao Inicial

Campos principais:

- livros permitidos;
- iniciar nova ficha;
- carregar ficha salva futuramente;
- importar JSON futuramente.

Regras desta pagina:

- filtrar racas, classes, origens, poderes, itens e magias pelos livros escolhidos;
- a escolha dos livros pertence ao criador, nao ao personagem;
- no saneamento dos dados, cada entrada deve ter uma fonte clara.

Formato recomendado para dados saneados:

```json
{
  "id": "humano",
  "nome": "Humano",
  "livroOrigemId": "basico"
}
```

Durante o saneamento, o campo atual `"Livro de Origem"` pode ser convertido para `livroOrigemId`.

## Pagina 1 - Identidade, Raca e Atributos

Campos principais:

- nome
- nivel
- raca
- atributos

Regras desta pagina:

- definir atributos por compra de pontos;
- permitir modo livre;
- permitir modo rolagem;
- aplicar modificadores de raca;
- definir tamanho, deslocamento e alcance natural;
- usar valores padrao quando a raca nao alterar:
  - tamanho: medio
  - deslocamento base: 9m
  - alcance natural: 1,5m

Racas com escolhas especiais nesta pagina:

- duende: natureza, tamanho, dons, presentes de magia, presentes de caos e limitacoes;
- kobold: escolhas especificas da raca;
- golem desperto: escolhas especificas de construcao;
- suraggel: variacoes;
- nagah: variacoes.

## Pagina 2 - Classe

Campos principais:

- classe
- escolhas de classe
- PV
- PM

Regras desta pagina:

- calcular PV e PM conforme classe, nivel e Constituicao;
- aplicar escolhas obrigatorias de classe;
- separar escolhas simples de escolhas complexas.

Classes com escolhas complexas:

- arcanista: caminho;
- feiticeiro: linhagem;
- linhagem draconica: elemento.

## Pagina 3 - Origem

Campos principais:

- origem padrao
- escolhas de origem
- pericias da origem
- itens da origem
- poderes da origem

Regras desta pagina:

- aplicar itens fixos da origem;
- permitir escolhas de beneficios;
- validar poderes e pericias escolhidos.

## Pagina 4 - Origem Regional e Poderes Extras

Campos principais:

- origem regional
- escolhas regionais
- poderes extras

Regras desta pagina:

- aplicar beneficios da origem regional;
- tratar casos especiais, como Humano Versatil:
  - duas pericias; ou
  - uma pericia e um poder geral.

## Pagina 5 - Divindade

Campos principais:

- divindade
- poder concedido

Regras desta pagina:

- divindade e opcional;
- se houver divindade, listar poderes concedidos permitidos;
- validar obrigacoes e restricoes apenas como aviso no inicio.

## Pagina 6 - Equipamento Inicial

Campos principais:

- equipamentos vindos de classe;
- equipamentos vindos de origem;
- escolhas de itens iniciais;
- dinheiro;
- carga.

Regras desta pagina:

- somar itens ja recebidos;
- permitir escolhas pendentes;
- calcular carga atual;
- calcular carga maxima.

## Pagina 7 - Magias

Campos principais:

- escolas de magia quando necessario;
- magias conhecidas;
- magias preparadas quando necessario;
- atributo-chave;
- CD de magia.

Regras desta pagina:

- aparecer apenas para classes conjuradoras;
- respeitar caminho, classe, circulo e tipo de magia;
- calcular CD quando aplicavel.

## Pagina 8 - Revisao e Exportacao

Campos principais:

- resumo completo da ficha;
- dados calculados;
- avisos de escolhas faltando;
- exportacao.

Regras desta pagina:

- mostrar tudo que vai para o PDF;
- validar ficha antes de exportar;
- exportar JSON;
- exportar PDF editavel futuramente.

## Separacao de Responsabilidades

Dados ficam em:

```txt
src/data/
```

Schemas e validacao ficam em:

```txt
src/schemas/
```

Regras e calculos ficam em:

```txt
src/core/rules/
```

Fluxo das paginas fica em:

```txt
src/core/flow/
```

Componentes visuais ficam em:

```txt
src/ui/components/
```

Paginas ficam em:

```txt
src/ui/pages/
```

Estilos ficam em:

```txt
src/styles/
```

Nenhuma regra de jogo deve ficar dentro de componente visual.

Nenhum CSS deve ficar dentro de regra de jogo.

Nenhum dado bruto deve depender da tela onde ele aparece.
