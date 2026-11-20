# Brilhinhos — como o jogo funciona

Jogo de criar amiguinhos mágicos para crianças de até 12 anos. **Sem propaganda e sem compras**:
tudo se ganha jogando. Funciona no navegador do tablet, pode ser instalado como aplicativo e
funciona sem internet depois de aberto uma vez.

## O ciclo do jogo

1. **Ninho Arco-íris** (no lugar do caldeirão de bruxa): toque nos itens da mochila (de 1 a 3,
   ou 4 a partir do nível 4), eles caem na água colorida do ninho, gire o dedo em volta para
   misturar e toque 3 vezes no ovo que aparece. Nasce um amigo!
2. **Fazendinhas**: cada região tem uma fazendinha. Os amigos colocados lá colhem itens sozinhos
   (bolhas em cima deles; é só tocar). Amigo do mesmo elemento da região colhe **2× mais rápido**
   e acha mais itens raros. Os brilhos no chão também dão itens.
3. **Aumentar a fazendinha** (5 níveis): mais lugar para amigos, a ilha cresce e ganha decoração,
   e os itens raros aparecem mais. A partir do nível 3, às vezes sai Pó de Arco-íris.
4. **Salvar quem está em perigo**: em cada região alguém precisa de ajuda (ilhado no riacho,
   num redemoinho, preso no gelo, perdido na névoa...). Precisa de um amigo do elemento certo
   (às vezes já evoluído) e alguns itens. Quem é salvo passa a fazer **Pedidos**.
5. **Pontes Arco-íris**: abrem a próxima região. Exigem salvar alguém na região anterior,
   moedas, itens e um número de amigos.
6. **Evolução**: amigos ganham experiência trabalhando, recebendo carinho e ajudando nos pedidos.
   Filhote → Jovem no nível 5 (1 Brilho de Crescer) → Adulto no nível 12 (2 Brilhos).
7. **Festa da Amizade** (nível 6): dois amigos Adultos fazem uma festa de 1 minuto e deixam um
   ovo especial. Eles **não somem** (nada de "gastar" um bichinho). É o único jeito de nascer o
   Lendário Arco-íris e o Mítico.

## As 150 espécies

50 famílias × 3 estágios (Filhote, Jovem, Adulto). 8 elementos, cada um com uma região:

| Elemento | Região | Dom |
|---|---|---|
| Planta | Prado Florido | Faz crescer |
| Água | Lago Cristalino | Nada |
| Sol | Vale do Sol | Aquece |
| Vento | Ilhas das Nuvens | Voa |
| Gelo | Montanha Nevada | Esfria |
| Pedra | Caverna Brilhante | É forte |
| Sonho | Bosque da Lua | Acalma |
| Luz | Jardim das Estrelas | Ilumina |

### Raridade (por que essa divisão)

| Raridade | Famílias | Espécies | Como nasce |
|---|---|---|---|
| Comum ★ | 16 | 48 | 2 itens comuns da região |
| Incomum ★★ | 14 | 42 | item incomum + comum |
| Raro ★★★ | 10 | 30 | item raro + incomum + comum |
| Épico ★★★★ | 6 | 18 | 2 itens raros de regiões diferentes + Pó de Arco-íris |
| Lendário ★★★★★ | 3 | 9 | item raro + Coração de Amizade + Pó de Arco-íris (o Arco-íris só na Festa) |
| Mítico ✦ | 1 | 3 | só na Festa da Amizade de dois Lendários |

Quase dois terços do Códice (90 espécies) saem no começo e no meio do jogo — a criança completa
páginas rápido e sente progresso. Os 60 raros, épicos e lendários são o objetivo de longo prazo.

### A sorte (para ter expectativa desde o começo)

- **Receita certinha** (a do Códice) → nasce exatamente aquele amigo.
- **Qualquer outra mistura** → sorteio. A "magia" dos itens (comum 1, incomum 3, raro 8,
  Pó de Arco-íris 20, Coração 40) aumenta a chance das raridades altas. Com 2 itens comuns já
  existe ~4% de chance de Raro e ~1% de Épico — dá para tirar algo especial logo no início.
  O elemento do amigo segue os itens usados.
- **Cintilante**: 1 em 40 nasce com cores diferentes e estrelinhas girando (1 em 18 usando Pó
  de Arco-íris). É a "figurinha brilhante" da coleção.
- O Ninho mostra a "sorte" da mistura numa barrinha colorida (pouca / boa / ótima / incrível),
  sem porcentagens.

## Gamificação

- Nível do cuidador (experiência por tudo o que se faz), com prêmio em cada nível.
- Códice com silhueta + receita das espécies não descobertas, contador por elemento e
  prêmios por coleção (10, 25, 50, 75, 100 e 150 espécies).
- 16 medalhas, presente do dia com sequência de dias (maior a cada dia seguido), pedidos dos
  personagens salvos, carinho nos amigos (corações), apelido para cada amigo.
- Guia (o Brilhinho) explica os primeiros passos: primeiro amigo → fazendinha → colher →
  salvar a Vovó Margarida.

## Arquivos

- `js/data.js` — todos os dados (itens, 150 espécies, receitas, regiões, resgates, medalhas).
- `js/game.js` — as regras (sem tela): Ninho, sorteio, fazendinhas, evolução, pedidos, salvar.
- `js/creature3d.js` — o gerador 3D dos amigos (corpo, olhos, orelhas, cauda, enfeites do
  elemento, padrão da pelagem, estágio).
- `js/stage3d.js` — as cenas 3D (Ninho, Fazendinha, Vitrine) e as figurinhas do Códice.
- `js/app.js` — as telas. `js/audio.js` — sons e caixinha de música feitos na hora.
- `dev/test-logic.mjs` — teste das regras (`node dev/test-logic.mjs`);
  `dev/gallery.html` — galeria com as 150 espécies.

## Ideias para as próximas versões

- Itens desenhados em 3D (hoje são emojis num disco colorido).
- Personagens salvos aparecendo passeando na vila; uma vila central para decorar.
- Mais tipos de pedidos e um "álbum" de cintilantes.
- Mais animações nos amigos (dancinha quando recebe carinho, dormir à noite).
