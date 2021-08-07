const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '10.0.10.222',
    user: 'staging',
    password: 'Dev@0611@Cubic!@#$',
    database: 'custom_backup'
  }
});

async function getWinAmount() {
  try {    
   await knex('stock_bets')
     .update({
      result: knex.raw(`CASE WHEN ((bet_type = 'lo' AND result_c > bet_value) OR (bet_type = 'hi' AND result_c < bet_value)) THEN 'lose' ELSE 'win' END`),
        win_amount: knex.raw(`CASE WHEN result = 'win' THEN amount * (profit/100) WHEN result = 'tie' THEN amount * 10 ELSE 0 END`)
    })    
    
  } catch (error) {
    console.log(error);
  }
}

async function getTotal() {
  try {
    const bet = await knex('stock_bets')
      .groupBy('bet_type')
      .select({
        bet_type: 'bet_type',
        total_bet: knex.raw(`SUM(amount)`),
        total_win: knex.raw(`SUM(win_amount)`),
        total_net: knex.raw(`SUM(amount) - SUM(win_amount)`)
      })
    
    console.log(bet);
  } catch (error) {
    console.log(error);
  }
}

// console.log(getWinAmount());
console.log(getTotal())

// total_bet
// total_win
// total_net (total_bet - total_win)