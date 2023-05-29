const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var game_on = false;
var num_player = 0;
var turn = 0;
var deck_top = 0;
var players = new Array(4);
var swap_request_client; // id of client who initiated swap
var turn_left; // number of total turns left before score is calculated to decide winner
var players_score;
var count = 0; //number of player who turned in their total score when deciding winner

function card(val, spec, img) {
  this.value = val;
  this.special = spec;
  this.image = img;
};

// var cards = [0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,7,
// 8,8,8,8,9,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10];

var cards = [ 
  new card(0, 'none', '/rat-a-tat-cat-0.png'), new card(0, 'none', '/rat-a-tat-cat-0.png'), new card(0, 'none', '/rat-a-tat-cat-0.png'), new card(0, 'none', '/rat-a-tat-cat-0.png'),
  new card(1, 'none', '/rat-a-tat-cat-1.png'), new card(1, 'none', '/rat-a-tat-cat-1.png'), new card(1, 'none', '/rat-a-tat-cat-1.png'), new card(1, 'none', '/rat-a-tat-cat-1.png'),
  new card(2, 'none', '/rat-a-tat-cat-2.png'), new card(2, 'none', '/rat-a-tat-cat-2.png'), new card(2, 'none', '/rat-a-tat-cat-2.png'), new card(2, 'none', '/rat-a-tat-cat-2.png'),
  new card(3, 'none', '/rat-a-tat-cat-3.png'), new card(3, 'none', '/rat-a-tat-cat-3.png'), new card(3, 'none', '/rat-a-tat-cat-3.png'), new card(3, 'none', '/rat-a-tat-cat-3.png'),
  new card(4, 'none', '/rat-a-tat-cat-4.png'), new card(4, 'none', '/rat-a-tat-cat-4.png'), new card(4, 'none', '/rat-a-tat-cat-4.png'), new card(4, 'none', '/rat-a-tat-cat-4.png'),
  new card(5, 'none', '/rat-a-tat-cat-5.png'), new card(5, 'none', '/rat-a-tat-cat-5.png'), new card(5, 'none', '/rat-a-tat-cat-5.png'), new card(5, 'none', '/rat-a-tat-cat-5.png'),
  new card(6, 'none', '/rat-a-tat-cat-6.png'), new card(6, 'none', '/rat-a-tat-cat-6.png'), new card(6, 'none', '/rat-a-tat-cat-6.png'), new card(6, 'none', '/rat-a-tat-cat-6.png'),
  new card(7, 'none', '/rat-a-tat-cat-7.png'), new card(7, 'none', '/rat-a-tat-cat-7.png'), new card(7, 'none', '/rat-a-tat-cat-7.png'), new card(7, 'none', '/rat-a-tat-cat-7.png'),
  new card(8, 'none', '/rat-a-tat-cat-8.png'), new card(8, 'none', '/rat-a-tat-cat-8.png'), new card(8, 'none', '/rat-a-tat-cat-8.png'), new card(8, 'none', '/rat-a-tat-cat-8.png'),
  new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), 
  new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), new card(9, 'none', '/rat-a-tat-cat-9.png'), 
  new card(9, 'none', '/rat-a-tat-cat-9.png'), 
  new card(10, 'draw', '/rat-a-tat-cat-draw.png'), new card(10, 'draw', '/rat-a-tat-cat-draw.png'), new card(10, 'draw', '/rat-a-tat-cat-draw.png'), 
  new card(10, 'peek', '/rat-a-tat-cat-peek.png'), new card(10, 'peek', '/rat-a-tat-cat-peek.png'), new card(10, 'peek', '/rat-a-tat-cat-peek.png'),
  new card(10, 'swap', '/rat-a-tat-cat-swap.png'), new card(10, 'swap', '/rat-a-tat-cat-swap.png'), new card(10, 'swap', '/rat-a-tat-cat-swap.png') 
];

var flip_deck;

function shuffleCards (cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }
}

app.get('/', (req, res) => {
  if (!game_on && num_player < 4) {

    num_player++;
    res.sendFile(__dirname + '/index.html');
    // io.emit('enter', num_player);  
  } else {
    res.sendFile(__dirname + '/wait.html');
  }
});

app.use(express.static('images'));

/*app.get('/lobby', (req, res) => {
  res.sendFile(__dirname + 'lobby.html');
}) */

io.on('connection', (socket) => {
  console.log(socket.id + 'has entered   ' + num_player);
  players[num_player - 1] = socket.id;
    //socket.join('some room');
  socket.on('start game', function() {
    if (!game_on && num_player >= 2) {
      game_on = true;
      // io.emit('start game', num_player);
      players.forEach( (id, index) => {io.to(id).emit('start game', num_player, index);} );
      shuffleCards(cards);
      
      
      // distribute card
      /* for (let index = 0; index < num_player; index++) {
        const player = players[index];
        for (let i = index; i < num_player * 4; i += num_player) {
          io.to(player).emit('give card', cards[i]);
        }
      } */

      for (let index = 0; index < 4; index++) {
        for (let i = 0; i < num_player; i++) {
          io.to(players[i]).emit('give card', cards[deck_top++]);
        }
      }

      // revealing the first flip deck, left pile
      io.emit('one', cards[num_player * 4]);
      flip_deck = cards[num_player * 4];
      flip_deck.special = 'none';
      deck_top++;
      // deck_top = 48;
      

      // initial card peek for each player
      setTimeout(() => {
        io.emit('initial peek');     
      }, 100);
      
      // testing swap, peek, and draw
      cards[17].value = 10;
      cards[17].special = 'draw';
      cards[17].image = '/rat-a-tat-cat-draw.png';
      cards[18].value = 7;
      cards[18].special = 'swap'; 
      cards[18].image = '/rat-a-tat-cat-swap.png';
      cards[19].value = 10;
      cards[19].special = 'peek';
      cards[19].image = '/rat-a-tat-cat-peek.png';
      cards[20].value = 1;
      cards[20].special = 'none';
      cards[20].image = '/rat-a-tat-cat-1.png';
      cards[21].value = 7;
      cards[21].special = 'none';
      cards[21].image = '/rat-a-tat-cat-7.png';
      /* cards[22].value = 10;
      cards[22].special = 'swap';
      cards[23].value = 8;
      cards[23].special = 'none'; */
      // cards[16].value = 10;
      // cards[16].special = 'draw';
      
      /* cards[deck_top+3].value = 10;
      cards[deck_top+3].special = 'draw'; */

      for (let k = 0; k < cards.length; k++) {
        console.log(k + ': ' + cards[k].value + ' : ' + cards[k].special + ' : ' + cards[k].image);
      } 

      console.log(flip_deck);
      console.log(deck_top);

      // turn_left = 54 - num_player * 4 - 1;
      turn_left = 55;
      players_score = new Array(num_player);
      io.emit('turn change', turn);

    } else if (game_on) {
      io.emit('rat-a-tat-cat', players.indexOf(socket.id));
      turn_left = num_player;
    }

  });

  // how to let users know that there's no more card? 
  // what happens if user picks draw card and there's less than 2 cards left?
  socket.on('turn change', () => {
    turn_left--;
    if (turn_left == 0 || deck_top >= 54) {
      io.emit('whos winner');
    }

    turn = turn < num_player - 1 ? turn + 1 : 0 ;
    io.emit('turn change', turn);
  });

  // what if there is tie?
  socket.on('whos winner', (sum)=> {
    players_score[players.indexOf(socket.id)] = sum;
    count++;
    if (count == num_player) {
      console.log('chicken dinner ah?');
      var index = 0;
      for (let i = 1; i < num_player; i++) {
        index = players_score[i] < players_score[index] ? i : index;
      }
      players_score.forEach((score)=>{console.log(score);});
      io.emit('winner', index);
    }
  });

  socket.on('draw card', () => {
    // if out of cards, emit abort to tell all clients and initiate winnder decider
    /* if (deck_top >= 54) {
      io.emit('abort', 'out of cards'); //when client receives this signal, it should remove all eventlistener of center_deck
      turn_left = 1; // when the current player click the end_turn button, it will trigger winner deciding process
    } */

    io.to(socket.id).emit('draw card', cards[deck_top], deck_top + 1 < 54);
    deck_top++;

    if (deck_top >= 54) {io.emit('outta cards');} // when client receives signal, it should immediately drop its num_draw to 0
    // to cover the case where the last card was draw, or where user picks draw 
    console.log("deck_top: " + deck_top);
  });

  socket.on('drop card', ()=> {
    io.emit('drop card', players.indexOf(socket.id));
  })

  socket.on('keep card', (card) => {
    io.emit('keep card', players.indexOf(socket.id), card);
  });

  socket.on('picked draw', () => {
    io.emit('picked draw', turn + 1);
  });

  socket.on('picked swap', () => {
    io.emit('picked swap', turn + 1);
  });

  socket.on('picked peek', () => {
    io.emit('picked peek', turn + 1);
  });

  // broadcast what card the player peeked at following picking a peek card
  socket.on('peek', (peeked_card) => {
    io.emit('peek', players.indexOf(socket.id) + 1, peeked_card);
  });

  socket.on('swap', (val, card_i, player_i, target_i) =>{
    // requesting to targeted player: retrieve ith of your card and swap with val
    io.to(players[player_i]).emit('swap', val, target_i);
    io.emit('swap statement', 'player ' + (players.indexOf(socket.id) + 1) + ' swapped their card ' + (card_i + 1) 
                    + ' with player ' + (player_i + 1) + ' card ' + (target_i + 1));
    swap_request_client = socket.id;
  });

  // When player wants to swap their card with other players' card, server retrieves the card info from the player 
  // who owns the card -that the player who initiated the swap- wants to swap with
  socket.on('retrieve target card', (card) => {
    io.to(swap_request_client).emit('retrieve target card', card); 
  });

  // receiving card that player has dropped
  socket.on('add to flip deck', (val) => {
    flip_deck = val;
    // flip_deck.special = 'none';
    console.log(flip_deck);
    io.emit('add to flip deck', val);
  });

  // when player wants to swap their card with card that other player has dropped
  socket.on('draw from flip', () => {
    console.log('draw from flip: deck top: ' + deck_top);
    io.to(socket.id).emit('draw from flip', flip_deck);
  });

  socket.on('enter', () => {
    io.emit('enter', num_player);
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});