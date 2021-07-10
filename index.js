
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '10.0.10.222',
    user: 'staging',
    password: 'Dev@0611@Cubic!@#$',
    database: 'inplay_sports'
  }
});

async function getStockBets() {
  try {
    const stocks = await knex('stock_bets')
      .select({
        id: 'stock_bets.id',
        user_id: 'stock_bets.user_id',
        time_type: 'stock_bets.time_type',
        amount: 'stock_bets.amount',
        bet_type: 'stock_bets.bet_type',
        round: 'stock_bets.round'
      })
    
    console.log(stocks);
  } catch (error) {
    throw new Error(error)
  }
}


async function withSymbol() {
  try {
    const stocks = await knex('stock_bets')
      .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
      .select({
        id: 'stock_bets.id',
        user_id:'stock_bets.user_id',
       time_type: 'stock_bets.time_type',
        amount: 'stock_bets.amount',
        bet_type: 'stock_bets.bet_type',
        round: 'stock_bets.round',
        symbol: knex.raw(`JSON_OBJECT(
        "id", forex_symbols.id,
        "display", forex_symbols.display)`)
    })

    console.log(stocks)    
  } catch (error) {
    throw new Error(error)
  }
}

async function getSymbol() {
  // const symbol = await knex('forex_symbols').where(knex.raw('id = ?', 2)).select('forex_symbols.table_name').first()
  // const TABLE_NAME = symbol.table_name.toString()
  // const TABLE_NAME = knex.raw('forex_symbols.table_name AS data')
  // const symbolTable = knex('forex_symbols').where(knex.raw('summary_table_name = ?', symbol.summary_table_name)).select()
    const stocks = await knex('stock_bets')
      .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
      // .leftJoin(`'${forex_symbols.table_name}  AS tableName'`, 'forex_symbols.id', 'tableName.symbol_id')
  //     .where(knex.raw(`JSON.OBJECT('forex_symbols.id = ?', 'stock_bets.symbol_id') as tableName`).toString())
    // .leftJoin(TABLE_NAME.data, 'forex_symbols.id', `${TABLE_NAME.data}.id`)
      // .leftJoin( await knex('forex_symbols').where(knex.raw('id = ?', 2)).select('forex_symbols.table_name').first())
  // .select('tableName.c').first()
      .select({
        id: 'stock_bets.id',
        user_id:'stock_bets.user_id',
       time_type: 'stock_bets.time_type',
        amount: 'stock_bets.amount',
        bet_type: 'stock_bets.bet_type',
        round: 'stock_bets.round',
        symbol: knex.raw(`JSON_OBJECT(
        "id", forex_symbols.id,
        "display", forex_symbols.display,
        "table_name", forex_symbols.table_name
        )`)
        
      })
  
  const a = stocks.forEach( async element => {
    const tableName = JSON.parse(element.symbol).table_name.toString()
    const data = await knex(tableName)
    console.log(data);
  });

  console.log(a);
    // .first()
  
  // const summary = 
  
  // console.log(JSON.parse(stocks[0].symbol).table_name);
}
//  let cashIn = await store.knex.raw(`SELECT *` +
//       ` FROM users_transaction` +
//       ` WHERE (user_id, updated_at) IN ` +
//       `(SELECT user_id, MAX(updated_at) FROM users_transaction WHERE type_id=1 AND STATUS='C' AND user_id  IN (${uIds}) GROUP BY user_id)`)
// console.log(getStockBets());


// console.log(withSymbol());
console.log(getSymbol());

