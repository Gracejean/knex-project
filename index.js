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
  try {
    const table = knex.select('*').from('_stock_forex_401484347')
      .where(function () {
        this.where('is_result_1min', 1)
          .orWhere('is_result_3min', 1)
          .orWhere('is_result_5min', 1)
      }).union(
        knex.raw('SELECT * FROM _stock_oanda_aud_usd WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1 '),
        knex.raw('SELECT * FROM _stock_oanda_eur_usd WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1 '),
        knex.raw('SELECT * FROM _stock_oanda_gbp_usd WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1 '),
        knex.raw('SELECT * FROM _stock_oanda_spx_500_usd WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1 '),
        knex.raw('SELECT * FROM _stock_oanda_usd_cad WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1 '),
        knex.raw('SELECT * FROM _stock_oanda_usd_jpy WHERE is_result_1min = 1 OR is_result_3min = 1 OR is_result_5min = 1')
    )
    
    const stocks = await knex('stock_bets')
    .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
    .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {
      this.on('forex_symbols.id', 'summary_logs.symbol_id')
        .andOn('stock_bets.round', 'summary_logs.round')
    })
      .leftJoin({logs_table: table}, function () {
        this.on('logs_table.symbol_id', 'summary_logs.symbol_id')
          .andOn('logs_table.c', 'summary_logs.c')
          .andOn(function () {
            this.on('logs_table.1min', 'summary_logs.round')
              .orOn('logs_table.3min', 'summary_logs.round')
              .orOn('logs_table.5min', 'summary_logs.round')
        })
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
        )`),
      logs: knex.raw(`JSON_OBJECT(
        "id", logs_table.id,
        "h", logs_table.h,
        "l", logs_table.l,
        "c", logs_table.c,
        "v", logs_table.v,
        "t", logs_table.t,
        "round", stock_bets.round,
        "expire_at", summary_logs.closed_at,
        "status", stock_bets.status
      )`)
      })

    console.log(stocks);
    

  } catch (error) {
    console.log(error);
  }


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
  

  // get the table name to join
  // get time_type which is equivalent to column name
  // get data where is_result(min) is true and min column value is equal to round value in stock_bet

}

// console.log(getStockBets());
// console.log(withSymbol());
// console.log(getSymbol());
console.log(getLogs());



