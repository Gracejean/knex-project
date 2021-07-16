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
    // const time =  knex.raw('SELECT time_type as t_type FROM stock_bets')
    const data = knex.raw(`SELECT * FROM _stock_forex_401484347
    WHERE is_result_1min = 1
      OR is_result_3min = 1
      OR is_result_5min = 1
    UNION
    SELECT * FROM  _stock_oanda_aud_usd 
    WHERE is_result_1min = 1 
      OR is_result_3min = 1 
      OR is_result_5min = 1 
    UNION
    SELECT * FROM _stock_oanda_eur_usd 
    WHERE is_result_1min = 1 
      OR is_result_3min = 1 
      OR is_result_5min = 1 
    UNION
    SELECT * FROM _stock_oanda_gbp_usd 
    WHERE is_result_1min = 1 
    OR is_result_3min = 1 
    OR is_result_5min = 1 
    UNION
    SELECT * FROM _stock_oanda_spx_500_usd 
    WHERE is_result_1min = 1 
      OR is_result_3min = 1 
      OR is_result_5min = 1 
    UNION
    SELECT * FROM _stock_oanda_usd_cad 
    WHERE is_result_1min = 1 
      OR is_result_3min = 1 
      OR is_result_5min = 1 
    UNION
    SELECT * FROM _stock_oanda_usd_jpy 
    WHERE is_result_1min = 1 
      OR is_result_3min = 1 
      OR is_result_5min = 1 `)
    const stocks = await knex('stock_bets')
    .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
    .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {
      this.on('forex_symbols.id', 'summary_logs.symbol_id')
        .andOn('stock_bets.round', 'summary_logs.round')
    })
    .leftJoin({ logs: `${data}`}, '_stock_logs_summary.c', 'logs.c')
    // .leftJo in({tableName: knex.raw(`JSON_OBJECT("table_name", forex_symbols.table_name)`)}, 'stock_bets.time_type', `tableName.${time}`)  
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
    .limit(5)
      // .where()
      // .leftJoin({tableName: knex.raw(`forex.table_name`)}, 'stock_bets.time_type', 'tableName.1min')
        // function () {
        //  this.on('stock_bets.time_type', 'tableName.1min')
    //        .orOn('stock_bets.time_type', `${table}.3min`)
    //     // .orOn('stock_bets.time_type', `${time}`) 
    // })
    // .limit(3)

    // const  data = await stocks
    
    // for (let i = 0; i < data.length; i++) {
    //   console.log(JSON.parse(data[i].symbol).id);
    //   const col = data[i].time_type
    //   if (data[i].table_name === '_stock_oanda_aud_usd') {
    //     // logs = stocks.join({ stock_aud: '_stock_oanda_aud_usd' }, 'stock_bets.time_type', `stock_aud.${col}`)
    //     logs = await knex({ stock_aud: '_stock_oanda_aud_usd' })
    //       .where(`stock_aud.${col}`, col)
    //       .select('id', 'l')
    //       .first()
    //   }

    //   if (data[i].table_name === '_stock_oanda_eur_usd') {
    //     // stocks = stocks.join({stock_eur:'_stock_oanda_eur_usd'}, 'stock_bets.time_type', `stock_eur.${col}`)
    //     logs = await knex({ stock_eur: '_stock_oanda_eur_usd' })
    //       .where(`stock_eur.${col}`, col)
    //       .select('id', 'l')
    //     .first()
    //   }

    //   if (data[i].table_name === '_stock_oanda_spx_500_usd') {
    //     // stocks = stocks.join({ stock_spx: '_stock_oanda_spx_500_usd' }, 'stock_bets.time_type', `stock_spx.${col}`)
    //     logs = await knex({ stock_spx: '_stock_oanda_spx_500_usd' })
    //       .where(`stock_spx.${col}`, col)
    //      .select('id', 'l')
    //     .first()
        
    //   }

    //   if (data[i].table_name === '_stock_oanda_gbp_usd') {
    //     // stocks = stocks.join({ stock_gbp: '_stock_oanda_gbp_usd' }, 'stock_bets.time_type', `stock_gbp.${col}`)
    //     logs = await knex({ stock_gbp: '_stock_oanda_gbp_usd' })
    //       .where(`stock_gbp.${col}`, col)
    //      .select('id', 'l')
    //     .first()
    //   }

    //   if (data[i].table_name === '_stock_oanda_usd_cad') {
    //     // stocks = stocks.join({ stock_cad: '_stock_oanda_usd_cad' }, 'stock_bets.time_type', `stock_cad.${col}`)
    //     logs = await knex({ stock_cad: '_stock_oanda_usd_cad' })
    //     .where(`stock_cad.${col}`, col)  
    //      .select('id', 'l')
    //       .first()
        
    //   }

    // }

   
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



