import { readFileSync, writeFileSync } from "fs";

const data = JSON.parse(readFileSync("races_update.json", "utf8"));

const kally = data.find(r => r.id === "kallyanach");
if (!kally) { console.error("Kallyanach nao encontrado"); process.exit(1); }

const heranca = kally.habilidades.find(h => h.id === "kallyanach_heranca_draconica");
heranca.descricao = "Você é uma criatura do tipo monstro e recebe redução 5 contra um tipo de dano a sua escolha entre ácido, eletricidade, fogo, frio, luz ou trevas.";
heranca.escolha.opcoes[0].nome = "Ácido";

const bencao = kally.habilidades.find(h => h.id === "kallyanach_bencao_de_kallyadranoch");
bencao.nome = "Bênção de Kallyadranoch";
bencao.descricao = "Escolha dois dos poderes a seguir. Uma vez por patamar, você pode escolher uma bênção no lugar de um poder de classe.";

const opts = bencao.escolha.opcoes;
opts[0].nome = "Armamento Kallyanach";
opts[0].descricao = "Você possui uma arma natural (dano 1d6, crítico x2) escolhida entre cauda (impacto), chifres (perfuração) ou mordida (perfuração). Uma vez por rodada, quando usa a ação agredir para atacar com outra arma, pode gastar 1 PM para fazer um ataque corpo a corpo extra com essa arma.";
opts[1].nome = "Asas Dracônicas";
opts[1].descricao = "Você pode gastar 1 PM por rodada para voar com deslocamento de 9m. Enquanto estiver voando desta forma, você fica vulnerável.";
opts[2].nome = "Escamas Elementais";
opts[2].descricao = "Sua pele é recoberta de escamas resistentes e brilhantes, que fornecem +2 na Defesa e aumentam a RD de sua Herança Dracônica para 10.";
opts[3].nome = "Prática Arcana";
opts[3].descricao = "Escolha uma magia arcana de 1º círculo que cause dano do mesmo tipo de sua Herança Dracônica. Você pode lançar essa magia (atributo-chave Inteligência). Caso aprenda novamente essa magia, seu custo diminui em –1 PM. Você pode escolher esta bênção mais de uma vez para outras magias.";
opts[4].nome = "Sentidos Dracônicos";
opts[4].descricao = "Seus sentidos são impregnados com poder dracônico. Você recebe faro e visão no escuro.";
opts[5].nome = "Sopro de Dragão";
opts[5].descricao = "Você pode gastar uma ação padrão e 1 PM para soprar um cone de 6m que causa 1d12 pontos de dano do tipo de sua Herança Dracônica (Ref CD Constituição reduz à metade). A cada quatro níveis após o 1º, você pode gastar +1 PM para aumentar o dano do sopro em +1d12.";

const out = JSON.stringify(data, null, 2);
writeFileSync("races_update.json", out, { encoding: "utf8" });
console.log("Kallyanach atualizado! JSON valido com", data.length, "racas.");
