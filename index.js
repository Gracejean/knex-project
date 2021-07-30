const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '10.0.10.222',
    user: 'staging',
    password: 'Dev@0611@Cubic!@#$',
    database: 'inplay_sports'
  }
});

const jsonObject = data => {
  const item = Object.keys(data)
    .reduce((acc, current) => [...acc, `"${current}", ${data[current]}`], [])
    .join(', ')
  
  return `JSON_OBJECT(${item})`
}

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
    const round = knex.raw(`CASE WHEN stock_bets.round = logs_table.1min THEN logs_table.1min WHEN stock_bets.round = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`)
    const expired = knex.raw(`CASE WHEN summary_logs.closed_at = logs_table.expire_at_1min THEN logs_table.expire_at_1min WHEN summary_logs.closed_at = logs_table.expire_at_3min THEN logs_table.expire_at_3min ELSE logs_table.expire_at_5min END`)
    const status = knex.raw(`CASE WHEN stock_bets.status = logs_table.status_1min THEN logs_table.status_1min WHEN stock_bets.status = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`)
    
    const tableList = [
      '_stock_oanda_aud_usd',
      '_stock_oanda_eur_usd',
      '_stock_oanda_gbp_usd',
      '_stock_oanda_usd_cad',
      '_stock_oanda_usd_jpy'
    ]


    const table = knex.select('*').from('_stock_forex_401484347')
      .where(function () {
        this.where('is_result_1min', 1)
          .orWhere('is_result_3min', 1)
          .orWhere('is_result_5min', 1)
      })
      .union(function () {
        for (let i = 0; i < tableList.length; i++) {
          this.union(function(){
            this.table(`${tableList[i]}`)
            .where(function () {
              this.where('is_result_1min', 1)
                .orWhere('is_result_3min', 1)
                .orWhere('is_result_5min', 1)
            })  
          })
        }       
      })

    const stocks = await knex('stock_bets')
      .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
      .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {  
        this.on('forex_symbols.id', 'summary_logs.symbol_id')
          .andOn('stock_bets.round', 'summary_logs.round')
      }).leftJoin({logs_table: table}, function () {
        this.on('logs_table.symbol_id', 'summary_logs.symbol_id')
          .andOn('logs_table.c', 'summary_logs.c')
          .andOn(function () {
            this.on('logs_table.1min', 'summary_logs.round')
              .orOn('logs_table.3min', 'summary_logs.round')
              .orOn('logs_table.5min', 'summary_logs.round')
          })
      })
    .toSQL()
      // .select({
      //   id: 'stock_bets.id',
      //   user_id:'stock_bets.user_id',
      //   time_type: 'stock_bets.time_type',
      //   amount: 'stock_bets.amount',
      //   bet_type: 'stock_bets.bet_type',
      //   round: 'stock_bets.round',
      //   symbol: knex.raw(jsonObject({
      //     id: 'forex_symbols.id',
      //     display: 'forex_symbols.display'
      //   })),
      //   summary: knex.raw(jsonObject({
      //     o: 'summary_logs.o',
      //     c: 'summary_logs.c',
      //     status: 'summary_logs.status',
      //     opened_at: 'summary_logs.opened_at',
      //     closed_at: 'summary_logs.closed_at'
      //   })),
      //   logs: knex.raw(jsonObject({
      //     id: 'logs_table.id',
      //     h: 'logs_table.h',
      //     l: 'logs_table.l',
      //     c: 'logs_table.c',
      //     v: 'logs_table.v',
      //     t: 'logs_table.t',
      //     round: `${round}`,
      //     expire_at: `${expired}`,
      //     status: `${status}`
      //   }))
      // })    
 
    console.log(stocks)
  } catch (error) {
    console.log(error);
  }
}

async function getBets() {
  try {

    const round = knex.raw(`CASE WHEN stock_bets.round = logs_table.1min THEN logs_table.1min WHEN stock_bets.round = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`) 
    const expired = knex.raw(`CASE WHEN summary_logs.closed_at = logs_table.expire_at_1min THEN logs_table.expire_at_1min WHEN summary_logs.closed_at = logs_table.expire_at_3min THEN logs_table.expire_at_3min ELSE logs_table.expire_at_5min END`)
    const status = knex.raw(`CASE WHEN stock_bets.status = logs_table.status_1min THEN logs_table.status_1min WHEN stock_bets.status = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`)

    const tableList = [
      '_stock_oanda_aud_usd',
      '_stock_oanda_eur_usd',
      '_stock_oanda_gbp_usd',
      '_stock_oanda_usd_cad',
      '_stock_oanda_usd_jpy'
    ]

    const table = knex.select('*').from('_stock_forex_401484347')
      .where(function () {
        this.where('is_result_1min', 1)
          .orWhere('is_result_3min', 1)
          .orWhere('is_result_5min', 1)        
      })
      .union(function () {
        for (let i = 0; i < tableList.length; i++) {
          this.union(function(){
            this.table(`${tableList[i]}`)
            .where(function () {
              this.where('is_result_1min', 1)
                .orWhere('is_result_3min', 1)
                .orWhere('is_result_5min', 1)
            })
          })          
        }       
      })

    const bets = await knex('stock_bets')
      .leftJoin('forex_symbols', 'stock_bets.symbol_id', 'forex_symbols.id')
      .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {
        this.on('forex_symbols.id', 'summary_logs.symbol_id')
          .andOn('stock_bets.round', 'summary_logs.round')
      })
      .leftJoin({ logs_table: table }, function () {
        this.on('logs_table.symbol_id', 'summary_logs.symbol_id')
          .andOn('logs_table.c', 'summary_logs.c')
          .andOn(function () {
            this.on('logs_table.1min', 'summary_logs.round')
              .orOn('logs_table.3min', 'summary_logs.round')
              .orOn('logs_table.5min', 'summary_logs.round')
          })
      })
      .groupBy('stock_bets.log_id',
        'stock_bets.id',
        'summary_logs.id',
        'logs_table.id',
        'logs_table.h',
        'logs_table.l',
        'logs_table.c',
        'logs_table.v',
        'logs_table.t',
        'logs_table.1min',
        'logs_table.3min',
        'logs_table.5min',
        'logs_table.expire_at_1min',
        'logs_table.expire_at_3min',
        'logs_table.expire_at_5min',
        'logs_table.status_1min',
        'logs_table.3min',
        'logs_table.5min'
      )
      .select({
        log_id: 'stock_bets.log_id',
        user_id: knex.raw(`JSON_ARRAYAGG(stock_bets.user_id)`), 
        total_users: knex.raw(`COUNT(stock_bets.user_id)`),
        total_bets_count: knex.raw(jsonObject({
          hi: `SUM(stock_bets.bet_type = 'hi')`,
          lo: `SUM(stock_bets.bet_type = 'lo')`
          })),
        total_bets: knex.raw(jsonObject({
          hi: `CASE WHEN stock_bets.bet_type = 'hi' THEN SUM(stock_bets.amount) ELSE 0 END`,
          lo: `CASE WHEN stock_bets.bet_type = 'lo' THEN SUM(stock_bets.amount) ELSE 0 END`,
        })),
        time_type: 'stock_bets.time_type',
        symbol: knex.raw(jsonObject({
          id: 'forex_symbols.id',
          display: 'forex_symbols.display'
        })),
        summary: knex.raw(jsonObject({
          o: 'summary_logs.o',
          c: 'summary_logs.c',
          status: 'summary_logs.status',
          opened_at: 'summary_logs.opened_at',
          closed_at: 'summary_logs.closed_at'
        })),
        logs: knex.raw(jsonObject({
          id: 'logs_table.id',
          h: 'logs_table.h',
          l: 'logs_table.l',
          c: 'logs_table.c'
        })),
        logs: knex.raw(jsonObject({
          id: 'logs_table.id',
          h: 'logs_table.h',
          l: 'logs_table.l',
          c: 'logs_table.c',
          v: 'logs_table.v',
          t: 'logs_table.t',
          round: `${round}`,
          expire_at: `${expired}`,
          status: `${status}`
        }))
      })
    
    console.log(bets);
  } catch (error) {
    console.log(error);
  }
}

// console.log(getStockBets());
// console.log(withSymbol());
// console.log(getSymbol());
// console.log(getLogs());
console.log(getBets());


