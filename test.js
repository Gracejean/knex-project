const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '10.0.10.222',
    user: 'staging',
    password: 'Dev@0611@Cubic!@#$',
    database: 'custom_backup_test'
  }
});

async function getWinAmount() {
  try {
    const hi = knex.raw(`CASE WHEN result_c > bet_value THEN 'win' WHEN result_c < bet_value THEN 'lose' WHEN result_c = bet_type THEN 'tie' ELSE NULL END`)
    const lo = knex.raw(`CASE WHEN result_c > bet_value THEN 'lose' WHEN result_c < bet_value THEN 'win' WHEN result_c = bet_type THEN 'tie' ELSE NULL END`)
    const result = knex.raw(`bet_type = 'lo'`) ? hi: lo
    await knex('stock_bets')
    .update({
        result: result,
        win_amount: knex.raw(`CASE WHEN result = 'win' THEN amount * (profit/100) WHEN result = 'tie' THEN amount * 10 ELSE 0 END`)
      })
    
  } catch (error) {
    console.log(error);
  }
}

console.log(getWinAmount());

//  amount
// bet_type
// bet_value
// profit
// win_amount
// result
// result_cyh