# Brilhinhos — como o jogo funciona

Jogo de forjar feras elementais, para crianças de até 12 anos. **Sem propaganda e sem compras**:
tudo se ganha jogando. Funciona no navegador do tablet, pode ser instalado como aplicativo e
funciona sem internet depois de aberto uma vez. É um jogo de um jogador só.

## O ciclo do jogo

1. **Forja do Trovão** (no lugar do caldeirão): os itens da mochila vão para a bigorna
   (de 1 a 3, ou 4 a partir do nível 4). Toque em **Forjar**, bata o martelo rúnico na bigorna
   6 vezes (faíscas e trovão a cada batida), um raio cai e sai um **cristal**. Toque 3 vezes
   no cristal para quebrar e o companheiro aparece.
2. **Fazendinhas**: cada região tem uma ilha. Os companheiros colocados lá coletam itens
   sozinhos (bolhas em cima deles; é só tocar). Companheiro do mesmo elemento da região
   trabalha **2× mais rápido** e acha mais itens raros. Os brilhos no chão também dão itens.
3. **Aumentar a fazendinha** (5 níveis): mais lugar, a ilha cresce e ganha mais árvores,
   rochas e cristais, e os itens raros aparecem mais. A partir do nível 3, às vezes sai Runa.
4. **Salvar quem está em perigo**: em cada região alguém precisa de ajuda (ilhado no riacho,
   barco no redemoinho, fornalha apagada pela chuva, balão preso no pico, congelado no gelo,
   mina bloqueada, torre na tempestade, nave sem energia). Precisa de um companheiro do
   elemento certo e alguns itens. Quem é salvo passa a fazer **Pedidos**.
5. **Pontes rúnicas**: abrem a próxima região (salvar alguém na anterior + moedas, itens e
   um número de companheiros).
6. **Evolução**: experiência trabalhando, recebendo carinho e ajudando nos pedidos.
   Filhote → Jovem no nível 5 (1 Cristal de Evolução) → Adulto no nível 12 (2 Cristais).
7. **Fusão do Trovão** (nível 6): dois Adultos carregam a Forja por 1 minuto e sai um cristal
   especial. Eles continuam na equipe. É o único jeito de conseguir as feras do Trovão
   (Lendária e Mítica).

## As 150 espécies

50 famílias × 3 estágios. Cada família tem um **animal de referência** e um **tipo de corpo**:

- **4 patas**: lobo, raposa, felino (leão/lince/pantera), cervo/rena, urso, javali, lagarto,
  tartaruga, rinoceronte, mamute, dragão (com asas) e grifo (com asas de penas e bico).
- **2 patas**: sapo, pinguim, gorila, golem de pedra e dinossauro.
- **Voadores**: ave (falcão, fênix, pássaro-trovão) e morcego.
- **Aquáticos**: peixe e arraia. **Serpentes**: serpente marinha/celeste e enguia.
- **Insetos**: besouro-rinoceronte e mariposa. **Espírito**: água-viva flutuante.

A pele é uma textura feita pelo próprio jogo (pelo, escama, pena, couro, pedra, lava, gelo,
quitina), com listras ou manchas por família. O elemento acrescenta peças: folhas e cipós,
barbatanas, chamas, nuvens, cristais de gelo, placas de pedra e gemas, raios, estrelas
girando. O Adulto fica maior, com chifres, garras e armadura, e os raros ganham aura.

| Elemento | Região |
|---|---|
| Planta | Floresta Viva |
| Água | Lago Profundo |
| Fogo | Vulcão Rubro |
| Vento | Picos dos Ventos |
| Gelo | Geleira Eterna |
| Pedra | Cânion de Pedra |
| Elétrico | Planalto dos Raios |
| Cósmico | Cratera Cósmica |
| Trovão (especial) | só pela Fusão |

### Raridade

| Raridade | Famílias | Espécies | Como sai |
|---|---|---|---|
| Comum ★ | 16 | 48 | 2 itens comuns da região |
| Incomum ★★ | 14 | 42 | item incomum + comum |
| Raro ★★★ | 10 | 30 | item raro + incomum + comum |
| Épico ★★★★ | 6 | 18 | 2 itens raros de regiões diferentes + Runa do Trovão |
| Lendário ★★★★★ | 3 | 9 | item raro + Coroa do Trovão + Runa (o Grifo só pela Fusão) |
| Mítico | 1 | 3 | só na Fusão de dois Lendários |

### A sorte

- **Receita certa** (a do Códice) → sai exatamente aquele companheiro.
- **Qualquer outra combinação** → sorteio: a energia dos itens (comum 1, incomum 3, raro 8,
  Runa 20, Coroa 40) aumenta a chance das raridades altas. Com 2 itens comuns já existe ~4%
  de chance de Raro e ~1% de Épico.
- **Cintilante**: 1 em 40 sai com cores diferentes e estrelas em volta (1 em 18 com Runa).

## Gamificação

Nível do jogador, Códice com silhuetas e receitas e prêmios por coleção, 16 medalhas,
presente do dia com sequência de dias, pedidos dos personagens salvos, carinho nos
companheiros, apelidos e o guia Raiozinho nos primeiros passos.

## Arquivos

- `js/data.js` — itens, 150 espécies, receitas, regiões, resgates, medalhas.
- `js/game.js` — as regras (sem tela). `node dev/test-logic.mjs` testa.
- `js/creature3d.js` — gerador 3D (tipos de corpo, texturas de pele, peças de elemento).
- `js/stage3d.js` — Forja do Trovão, fazendinhas por bioma, vitrine e figurinhas.
- `js/app.js` — as telas. `js/audio.js` — sons (martelada, trovão) e música.
- `dev/gallery.html` — galeria das 150 espécies.
