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
      .select({
        id: 'stock_bets.id',
        user_id:'stock_bets.user_id',
        time_type: 'stock_bets.time_type',
        amount: 'stock_bets.amount',
        bet_type: 'stock_bets.bet_type',
        round: 'stock_bets.round',
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
          c: 'logs_table.c',
          v: 'logs_table.v',
          t: 'logs_table.t',
          round: round,
          expire_at: expired,
          status: status
        }))
      })    
 
    console.log(stocks)
  } catch (error) {
    console.log(error);
  }
}

async function getBets() {
  try {

    const round = knex.raw(`CASE WHEN stock.round = logs_table.1min THEN logs_table.1min WHEN stock.round = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`) 
    const expired = knex.raw(`CASE WHEN summary_logs.closed_at = logs_table.expire_at_1min THEN logs_table.expire_at_1min WHEN summary_logs.closed_at = logs_table.expire_at_3min THEN logs_table.expire_at_3min ELSE logs_table.expire_at_5min END`)
    const status = knex.raw(`CASE WHEN stock.status = logs_table.status_1min THEN logs_table.status_1min WHEN stock.status = logs_table.3min THEN logs_table.3min ELSE logs_table.5min END`)

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
    
    const bets = await knex.from(function () {
      this.select({
        id: 'id',
        log_id: 'log_id',
        round: 'round',
        time_type: 'time_type',
        bet_type: 'bet_type',
        symbol_id: 'symbol_id',
        status: 'status',
        user_id: knex.raw(`JSON_ARRAYAGG(user_id)`),
        total_users: knex.raw(`COUNT(user_id)`),
        hi_count: knex.raw(`SUM(bet_type = 'hi')`),
        lo_count: knex.raw(`SUM(bet_type = 'lo')`),
        hi_bets: knex.raw(`CASE WHEN bet_type = 'hi' THEN SUM(amount) ELSE 0 END`),
        lo_bets: knex.raw(`CASE WHEN bet_type = 'lo' THEN SUM(amount) ELSE 0 END`)
      })
      .from('stock_bets')
      .groupBy('stock_bets.log_id', 'stock_bets.id')
      .as('stock')
    })
    .leftJoin('forex_symbols', 'stock.symbol_id', 'forex_symbols.id')
    .leftJoin({ summary_logs: '_stock_logs_summary' }, function () {
      this.on('forex_symbols.id', 'summary_logs.symbol_id')
        .andOn('stock.round', 'summary_logs.round')
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
    .select({
      log_id: 'stock.log_id',
      user_id:'stock.user_id', 
      total_users: `stock.total_users`,
      total_bets_count: knex.raw(jsonObject({
        hi: 'stock.hi_count',
        lo: 'stock.lo_count'
      })),
      total_bets: knex.raw(jsonObject({
        hi: 'stock.hi_bets',
        lo: 'stock.lo_bets',
      })),
      time_type: 'stock.time_type',
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
      c: 'logs_table.c',
      v: 'logs_table.v',
      t: 'logs_table.t',
      round: round,
      expire_at: expired,
      status: status
      }))
    })
    
    console.log(bets);
  } catch (error) {
    console.log(error);
  }
}

async function updateUser() {
  try {
    const userList = [
      { id: 1, login_id: 'user_id_11', ext: 'php1' },
      { id: 2, login_id: 'user_id_21', ext: 'asp1' },
      { id: 3, login_id: 'user_id_31', ext: 'xml1' },
      { id: 4, login_id: 'user_id_41', ext: 'php1' },
      { id: 6, login_id: 'user_id_61', ext: 'asp1' }
    ]

    const getValue = (data, col) => {
      return data.reduce((acc, current) =>(acc +  ` WHEN id = ${current.id} THEN '${current[col]}'`) , '')
    }

    await knex('users')        
      .whereIn('id', userList.map(user => user.id))
      .update({
        login_id: knex.raw(`CASE ${getValue(userList, 'login_id')} END`),
        ext: knex.raw(`CASE ${getValue(userList, 'ext')} END`)
      })    
      
  } catch (error) {
    console.log(error);
  }
}

// console.log(getStockBets());
// console.log(withSymbol());
// console.log(getSymbol());
// console.log(getLogs());
// console.log(getBets());
console.log(updateUser());
