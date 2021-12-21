require('dotenv').config();
const express = require('express')
const next = require('next')
const { Client } = require('pg')

//////////////////////////////
///// Redis cache setup //////
//////////////////////////////

var cache = require('express-redis-cache')({expire:60*60*24}); // expire after 24 hours

cache.on('error', function (error) {
  console.error("Redis cache", error);
  console.log("Express bypassing Redis cache")
});

//////////////////////////////
/// db connection settings ///
//////////////////////////////

// details pulled in from .env file
const mainnet_connection_config = {
  host: process.env.NEAR_ANALYTICS_MAINNET_DATABASE_HOST,
  user: process.env.NEAR_ANALYTICS_MAINNET_DATABASE_USERNAME,
  password: process.env.NEAR_ANALYTICS_MAINNET_DATABASE_PASSWORD,
  database: process.env.NEAR_ANALYTICS_MAINNET_DATABASE_NAME
}

const testnet_connection_details = {
  host: process.env.NEAR_ANALYTICS_TESTNET_DATABASE_HOST,
  user: process.env.NEAR_ANALYTICS_TESTNET_DATABASE_USERNAME,
  password: process.env.NEAR_ANALYTICS_TESTNET_DATABASE_PASSWORD,
  database: process.env.NEAR_ANALYTICS_TESTNET_DATABASE_NAME
}

/////////////////////////////
////// Connect to db ////////
/////////////////////////////

const mainnet_db = new Client(mainnet_connection_config)
const testnet_db = new Client(testnet_connection_details)

// connect to the database and log a message of success or error to the server console
mainnet_db
  .connect()
  .then(() => console.log('connected to mainnet'))
  .catch(err => console.error('database connection error', err.stack))

testnet_db
  .connect()
  .then(() => console.log('connected to testnet'))
  .catch(err => console.error('database connection error', err.stack))

/////////////////////////////
////// Next.js Setup ////////
/////////////////////////////

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {

  /////////////////////////////
  ////// Express Setup ////////
  /////////////////////////////

  const server = express()
  server.use(express.json())

  /////////////////////////////
  ////// API endpoints ////////
  /////////////////////////////

  //get total accounts
  server.get('/api/v1/:network/accounts/total', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now

    // dates split to create postgres format
    let query = `
    with cumulative_accounts as
    (
      select
        daily_new_accounts_count.collected_for_day
        , sum(coalesce(new_accounts_count, 0) - coalesce(deleted_accounts_count, 0)) over(order by daily_new_accounts_count.collected_for_day) as cumulative_total_accounts
      from
        daily_new_accounts_count
        left join daily_deleted_accounts_count on
          daily_new_accounts_count.collected_for_day = daily_deleted_accounts_count.collected_for_day
    )
    select
      collected_for_day
      , cumulative_total_accounts
    from
      cumulative_accounts
    where
      collected_for_day >= '${start.toISOString().split('T')[0]}'
      and collected_for_day <= '${end.toISOString().split('T')[0]}'
  `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/accounts/growth', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now

    // dates split to create postgres format
    let query = `
    with total_accounts as
    (
      select
        daily_new_accounts_count.collected_for_day
        , coalesce(new_accounts_count, 0) - coalesce(deleted_accounts_count, 0) as total_accounts
        , row_number() over(order by daily_new_accounts_count.collected_for_day) as r_n
      from
        daily_new_accounts_count
        left join daily_deleted_accounts_count on
          daily_new_accounts_count.collected_for_day = daily_deleted_accounts_count.collected_for_day
      where
        daily_new_accounts_count.collected_for_day >= '${start.toISOString().split('T')[0]}'
        and daily_new_accounts_count.collected_for_day <= '${end.toISOString().split('T')[0]}'
    )
    select
      collected_for_day
      , sum(
        case
        when r_n = 1 then 0
        else total_accounts
        end) over(order by collected_for_day) as cumulative_total_accounts
    from
      total_accounts
  `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/accounts/daily', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now

    // dates split to create postgres format
    let query = `
      select
         *
      from
        daily_new_accounts_count
      where
        daily_new_accounts_count.collected_for_day >= '${start.toISOString().split('T')[0]}'
        and daily_new_accounts_count.collected_for_day <= '${end.toISOString().split('T')[0]}'
    `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    const app = req.query.app ? req.query.app : null
    
    // dates split to create postgres format
    let query = `
      select
         *
      from
        near_ecosystem_entities
    `

    if (app !== null){
      query += `where slug = '${app}' AND is_app`
    }

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      if(!d.logo){
        d.logo = '/images/ecosystem.png'
      } else if (d.logo.startsWith('/img/')){
        d.logo = 'https://github.com/near/ecosystem/raw/main' + d.logo
      }
    })

    
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/total', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now
    const limit = req.query.limit ? parseInt(req.query.limit) : null

    // dates split to create postgres format
    let query = `
    with apps_cumulative_accounts as
    (
      select
        collected_for_day
        , app_id
        , sum(new_accounts) over(partition by app_id order by collected_for_day) as total_accounts
      from
        daily_accounts_by_app_count
    )
    select
      collected_for_day
      , app_id
      , total_accounts
    from
      apps_cumulative_accounts
    where
      collected_for_day >= '${start.toISOString().split('T')[0]}'
      and collected_for_day <= '${end.toISOString().split('T')[0]}'
    order by 
      total_accounts desc
    `

    if (limit !== null) query += `limit ${limit}`

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/growth', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now
    const limit = req.query.limit ? parseInt(req.query.limit) : null

    // dates split to create postgres format
    let query = `
    with app_total_accounts as
    (
      select
        collected_for_day
        , app_id
        , new_accounts
        , row_number() over(partition by app_id order by collected_for_day) as r_n
      from
        daily_accounts_by_app_count
      where
        collected_for_day >= '${start.toISOString().split('T')[0]}'
        and collected_for_day <= '${end.toISOString().split('T')[0]}'
    )
    select
      collected_for_day
      , app_id
      , sum(
        case
        when r_n = 1 then 0
        else new_accounts
        end) over(order by collected_for_day) as total_accounts
    from
      app_total_accounts
    order by
      total_accounts desc
    `

    if (limit !== null) query += `limit ${limit}`

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/summary', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const date = req.query.date ? new Date(req.query.date) : new Date() // start of EPOCH
    const limit = req.query.limit ? parseInt(req.query.limit) : null
    const summary = req.query.summary ? req.query.summary : [30, 60, 90]

    // dates split to create postgres format
    let query = `
    with apps_cumulative_accounts as
    (
      select
        collected_for_day
        , app_id
        , sum(new_accounts) over(partition by app_id order by collected_for_day) as total_accounts
      from
        daily_accounts_by_app_count
    )
    select
      a.collected_for_day
      , a.app_id
      , a.total_accounts
      ${summary.map(time_period => `, (select t.total_accounts from apps_cumulative_accounts t where t.app_id = a.app_id and t.collected_for_day = (a.collected_for_day - interval '${time_period + 1}' day)) as accounts_${time_period}_days_ago`).join('')}
    from
      apps_cumulative_accounts a
    where
      and a.collected_for_day = '${date.toISOString().split('T')[0]}'
    order by
      total_accounts desc
    `

    if (limit !== null) query += `limit ${limit}`

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/daily', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now

    // dates split to create postgres format
    let query = `
    select
      *
    from
      apps_cumulative_accounts
    where
      collected_for_day >= '${start.toISOString().split('T')[0]}'
      and collected_for_day <= '${end.toISOString().split('T')[0]}'
    `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    const { rows } = await db.query(query)
    // send the results to the browser
    res.send(rows)

  })

/////////////////////////////////////
////// V0 Temp read from CSV ////////
/////////////////////////////////////

  const neatCsv = require('neat-csv');
  const fs = require('fs').promises;

  let accounts_csv_data = await fs.readFile('./data/daily_new_entity_users_count.csv', "binary")
  let new_accounts_per_app = await neatCsv(accounts_csv_data)
  
  let ecosystem_csv_data = await fs.readFile('./data/ecosystem_entities.csv', "binary")
  let ecosystem_data = await neatCsv(ecosystem_csv_data)


  // wrangle
  new_accounts_per_app.forEach(d => {
    d.app = d.entity_id
    delete d.entity_id
    d.new_accounts_count = parseInt(d.new_entity_accounts_count)
    delete d.new_entity_accounts_count
    d.collected_for_day = new Date(d.collected_for_day).toISOString()
  });

  let apps = Array.from(new Set(new_accounts_per_app.map(d => d.app)))
  new_accounts_per_app.sort((a, b) => new Date(a.collected_for_day) > new Date(b.collected_for_day) ? 1 : -1)


  server.get('/api/v0/:network/apps/', async (req, res) => {

    const app = req.query.app ? req.query.app : null

    let app_data = ecosystem_data.filter(d => d.category.includes('app'))

    app_data.forEach(d => {
      if(d.logo == ''){
        d.logo = '/images/ecosystem.png'
      } else if (d.logo.startsWith('/img/')){
        d.logo = 'https://github.com/near/ecosystem/raw/main' + d.logo
      }
    })

    if (app !== null){
      res.send(app_data.filter(d => d.slug == app))
    } else {
      res.send(app_data)
    }

  })

  server.get('/api/v0/:network/apps/accounts/daily', async (req, res) => {

    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now

    let date_filtered = new_accounts_per_app.filter(d => new Date(d.collected_for_day) >= start && new Date(d.collected_for_day) <= end )
    res.send(date_filtered)
  })

  server.get('/api/v0/:network/apps/accounts/total', async (req, res) => {

    let wrangled = []

    for (let app of apps) {
      let filtered = new_accounts_per_app.filter(d => d.app == app)
      for (let i = 0; i < filtered.length; i++) {
        let current = filtered[i]
        if (i == 0) {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count })
        } else {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count + wrangled[wrangled.length - 1].cumulative_total_accounts })
        }
      }
    }

    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now
    const limit = req.query.limit ? parseInt(req.query.limit) : null

    let date_filtered = wrangled.filter(d => new Date(d.collected_for_day) >= start && new Date(d.collected_for_day) <= end )
    
    if(limit !== null){
      let top_apps = {}
      wrangled.forEach(d => {
        if (!top_apps.hasOwnProperty(d.app)) top_apps[d.app] = 0
        if(d.cumulative_total_accounts > top_apps[d.app])  top_apps[d.app] = d.cumulative_total_accounts
      })

      top_apps = Object.keys(top_apps).map((key) => [key, top_apps[key]]);
      top_apps.sort((a, b) => a.cumulative_total_accounts < b.cumulative_total_accounts ? 1 : -1)
      top_apps.filter((d,i) => i < limit)
      top_apps = top_apps.map(d => d[0])
      date_filtered = date_filtered.filter(d => top_apps.includes(d.app) )
    }
    
    date_filtered.sort((a, b) => new Date(a.collected_for_day) > new Date(b.collected_for_day) ? 1 : -1)

    res.send(date_filtered)

  })

  server.get('/api/v0/:network/apps/accounts/growth', async (req, res) => {

    let wrangled = []

    const start = req.query.start ? new Date(req.query.start) : new Date(0) // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now
    const limit = req.query.limit ? parseInt(req.query.limit) : null

    let date_filtered = new_accounts_per_app.filter(d => new Date(d.collected_for_day) >= start && new Date(d.collected_for_day) <= end )
    
    for (let app of apps) {
      let filtered = date_filtered.filter(d => d.app == app)
      for (let i = 0; i < filtered.length; i++) {
        let current = filtered[i]
        if (i == 0) {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count })
        } else {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count + wrangled[wrangled.length - 1].cumulative_total_accounts })
        }
      }
    }

    if(limit !== null){

      let top_apps = {}
      wrangled.forEach(d => {
        if (!top_apps.hasOwnProperty(d.app)) top_apps[d.app] = 0
        if(d.cumulative_total_accounts > top_apps[d.app])  top_apps[d.app] = d.cumulative_total_accounts
      })

      top_apps = Object.keys(top_apps).map((key) => [key, top_apps[key]]);
      top_apps.sort((a, b) => a.cumulative_total_accounts < b.cumulative_total_accounts ? 1 : -1)
      top_apps.filter((d,i) => i < limit)
      top_apps = top_apps.map(d => d[0])

      wrangled = wrangled.filter(d => top_apps.includes(d.app) )

    }

    wrangled.sort((a, b) => new Date(a.collected_for_day) > new Date(b.collected_for_day) ? 1 : -1)

    res.send(wrangled)

  })

  server.get('/api/v0/:network/apps/accounts/summary', async (req, res) => {

    const date = req.query.end ? new Date(req.query.end) : new Date() // now


    let wrangled = []

    for (let app of apps) {
      let filtered = new_accounts_per_app.filter(d => d.app == app)
      for (let i = 0; i < filtered.length; i++) {
        let current = filtered[i]
        if (i == 0) {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count })
        } else {
          wrangled.push({ app: current.app, collected_for_day: current.collected_for_day, cumulative_total_accounts: current.new_accounts_count + wrangled[wrangled.length- 1].cumulative_total_accounts })
        }
      }
    }

    wrangled.sort((a, b) => new Date(a.collected_for_day) > new Date(b.collected_for_day) ? 1 : -1)

    let date_filtered = wrangled.filter(d => new Date(d.collected_for_day) <= date )

    let summary = []

    for (let app of apps) {
      filtered = date_filtered.filter(d => d.app == app)
      let obj = {
        app: app, 
        total_accounts: filtered[filtered.length -1].cumulative_total_accounts,
      }

      if (filtered.length > 30) obj.app_accounts_last_30_days = filtered[filtered.length -31].cumulative_total_accounts
      if (filtered.length > 60) obj.app_accounts_last_60_days = filtered[filtered.length -61].cumulative_total_accounts
      if (filtered.length > 90) obj.app_accounts_last_90_days = filtered[filtered.length -91].cumulative_total_accounts
     
      summary.push(obj)
    }

    res.send(summary)

  })


  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(process.env.NEXT_PORT || 3000, (err) => {
    if (err) throw err
    console.log(`NEAR Analytics API listening at http://localhost:${process.env.NEXT_PORT || 3000}`)
  })

})