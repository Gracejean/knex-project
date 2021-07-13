const _ = require('lodash')

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
  const stocks = await knex('stock_bets')
    .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
    .leftJoin({ summary_logs: '_stock_logs_summary'}, function () {
      this.on('forex_symbols.id', 'summary_logs.symbol_id')
        .andOn('stock_bets.round', 'summary_logs.round')
    })
    .select({
      id: 'stock_bets.id',
      user_id:'stock_bets.user_id',
      time_type: 'stock_bets.time_type',
      amount: 'stock_bets.amount',
      bet_type: 'stock_bets.bet_type',
      round: 'stock_bets.round',
      symbol: knex.raw(`JSON_OBJECT(
        "id", forex_symbols.id,
        "display", forex_symbols.display
        )`), 
      summary: knex.raw(`JSON_OBJECT(
        "o", summary_logs.o,
        "c", summary_logs.c,
        "status", summary_logs.status,
        "opened_at", summary_logs.opened_at,
        "closed_at", summary_logs.closed_at
      )`)        
    })
  
  console.log(stocks);
}

async function getLogs() {
  const tableName = {
    _stock_oanda_aud_chf: 'a',
    _stock_oanda_eur_gbp: '_stock_oanda_eur_gbp',
    _stock_oanda_spx_500_usd: '_stock_oanda_spx_500_usd',
    _stock_oanda_xag_cad: 'stock_oanda_xag_cad',
    _stock_oanda_xau_eur: '_stock_oanda_xau_eur'
  }

  const stocks = await knex('stock_bets')
    .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
    .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {
      this.on('forex_symbols.id', 'summary_logs.symbol_id')
        .andOn('stock_bets.round', 'summary_logs.round')
    })
    .whereIn('forex_symbols.table_name', _.keys(tableName))
    .as('tableN')
    .join('tableN', function () {
      this.on('stock_bets.round', )
    })
  .limit(10)
    // .modify(q => {
    //   const data = q
    //   console.log( data);

    // })
    // .select({
      // table: table_name
    // id: 'stock_bets.id',
    // user_id:'stock_bets.user_id',
    // time_type: 'stock_bets.time_type',
    // amount: 'stock_bets.amount',
    // bet_type: 'stock_bets.bet_type',
    // round: 'stock_bets.round',
    // symbol: knex.raw(`JSON_OBJECT(
    //   "id", forex_symbols.id,
    //   "display", forex_symbols.display
    //   )`),
    // summary: knex.raw(`JSON_OBJECT(
    //   "o", summary_logs.o,
    //   "c", summary_logs.c,
    //   "status", summary_logs.status,
    //   "opened_at", summary_logs.opened_at,
    //   "closed_at", summary_logs.closed_at
    //   )`)        
    // })
  // log: knex.raw(`JSON_OBJECT(
  //     "id",
  //     "h",
  //     "l",
  //     "c",
  //     "v",
  //     "t",
  //     "is_result",
  //     "round",
  //     "expire_at",
  //     "status"
  //   )`)
  
  console.log(stocks)

  // get the table name to join
  // get time_type which is equivalent to column name
  // get data where is_result(min) is true and min column value is equal to round value in stock_bet

}

// console.log(getStockBets());
// console.log(withSymbol());
// console.log(getSymbol());
console.log(getLogs());

