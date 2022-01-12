require('dotenv').config();
const express = require('express')
const next = require('next')
const { Client } = require('pg')

//////////////////////////////
///// Redis cache setup //////
//////////////////////////////

var cache = require('express-redis-cache')({ expire: 60 * 60 * 24 }); // expire after 24 hours

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
        , sum(coalesce(new_accounts_count, 0) - coalesce(deleted_accounts_count, 0)) over(order by daily_new_accounts_count.collected_for_day) as total_accounts
      from
        daily_new_accounts_count
        left join daily_deleted_accounts_count on
          daily_new_accounts_count.collected_for_day = daily_deleted_accounts_count.collected_for_day
    )
    select
      collected_for_day
      , total_accounts
    from
      cumulative_accounts
    where
      collected_for_day >= '${start.toISOString().split('T')[0]}'
      and collected_for_day <= '${end.toISOString().split('T')[0]}'
  `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.total_accounts = parseInt(d.total_accounts)
    })
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
        end) over(order by collected_for_day) as total_accounts
    from
      total_accounts
  `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.total_accounts = parseInt(d.total_accounts)
    })
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
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.new_accounts_count = parseInt(d.new_accounts_count)
    })

    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    const app = req.query.app ? req.query.app : null
    const contract = req.query.contract ? req.query.contract : false // must have contract_ids

    // dates split to create postgres format
    let query = `
      select
         *
      from
        near_ecosystem_entities
    `

    if (app !== null && contract === false) {
      query += `where slug = '${app}' AND is_app`
    } else if (app !== null && contract !== false) {
      query += `where slug = '${app}' AND is_app AND contract IS NOT NULL`
    } else if (app === null && contract !== false){
      query += `where contract IS NOT NULL`
    }

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      if (!d.logo) {
        d.logo = '/images/ecosystem.png'
      } else if (d.logo.startsWith('/img/')) {
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
    const limit = req.query.limit ? `limit ${parseInt(req.query.limit)}` : ""

    // dates split to create postgres format
    let query = `
     WITH series AS (
       SELECT
         DATE_TRUNC('day',
           dd)::date AS date
       FROM
         generate_series('2020-09-15'::timestamp,
           CURRENT_DATE - 1,
           '1 day'::interval) AS dd
     ),
     entities AS (
       SELECT DISTINCT
         entity_id
       FROM
         daily_new_accounts_per_ecosystem_entity_count
     ),
     entity_series AS (
       SELECT
         date,
         entity_id
       FROM
         series
       CROSS JOIN entities
     ),
     apps_cumulative_accounts AS (
       SELECT
         date,
         entity_series.entity_id,
         sum(new_accounts_count) OVER (PARTITION BY entity_series.entity_id ORDER BY date) AS total_accounts
       FROM
         entity_series
         LEFT JOIN daily_new_accounts_per_ecosystem_entity_count ON entity_series.date = daily_new_accounts_per_ecosystem_entity_count.collected_for_day
           AND entity_series.entity_id = daily_new_accounts_per_ecosystem_entity_count.entity_id
     ),
     top_ten_entity AS (
     SELECT
       date,
       entity_id as entity,
       total_accounts
     FROM
       apps_cumulative_accounts
     WHERE
       total_accounts IS NOT NULL ORDER BY
         date DESC,
         total_accounts DESC
         ${limit}
     )
     SELECT
       apps_cumulative_accounts.date as collected_for_day,
       entity_id,
       apps_cumulative_accounts.total_accounts
     FROM
       apps_cumulative_accounts
     join
     top_ten_entity
     on apps_cumulative_accounts.entity_id = top_ten_entity.entity
     WHERE
      apps_cumulative_accounts.date >= '${start.toISOString().split('T')[0]}'
      AND apps_cumulative_accounts.date <= '${end.toISOString().split('T')[0]}'
      AND apps_cumulative_accounts.total_accounts IS NOT NULL
    ORDER BY apps_cumulative_accounts.total_accounts DESC;
     `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.total_accounts = parseInt(d.total_accounts)
    })

    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/growth', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    // extracting additional query parameters
    const start = req.query.start ? new Date(req.query.start) : new Date('2020-09-15') // start of EPOCH
    const end = req.query.end ? new Date(req.query.end) : new Date() // now
    const limit = req.query.limit ? `limit ${parseInt(req.query.limit)}` : ""

    // dates split to create postgres format
    let query = `
    WITH series AS (
      SELECT
        DATE_TRUNC('day',
          dd)::date AS date
      FROM
        generate_series('${start.toISOString().split('T')[0]}'::timestamp,
          CURRENT_DATE - 1,
          '1 day'::interval) AS dd
    ),
    entities AS (
      SELECT DISTINCT
        entity_id
      FROM
        daily_new_accounts_per_ecosystem_entity_count
    ),
    entity_series AS (
      SELECT
        date,
        entity_id
      FROM
        series
      CROSS JOIN entities
    ),
    apps_cumulative_accounts AS (
      SELECT
        date,
        entity_series.entity_id,
        sum(new_accounts_count) OVER (PARTITION BY entity_series.entity_id ORDER BY date) AS total_accounts
      FROM
        entity_series
        LEFT JOIN daily_new_accounts_per_ecosystem_entity_count ON entity_series.date = daily_new_accounts_per_ecosystem_entity_count.collected_for_day
          AND entity_series.entity_id = daily_new_accounts_per_ecosystem_entity_count.entity_id
    ),
    top_ten_entity AS (
    SELECT
      date,
      entity_id as entity,
      total_accounts
    FROM
      apps_cumulative_accounts
    WHERE
      total_accounts IS NOT NULL ORDER BY
        date DESC,
        total_accounts DESC
        ${limit}
    )
    SELECT
      apps_cumulative_accounts.date as collected_for_day,
      entity_id,
      apps_cumulative_accounts.total_accounts
    FROM
      apps_cumulative_accounts
    join
    top_ten_entity
    on apps_cumulative_accounts.entity_id = top_ten_entity.entity
    WHERE
      apps_cumulative_accounts.date <= '${end.toISOString().split('T')[0]}' and
      apps_cumulative_accounts.total_accounts IS NOT NULL
    ORDER BY apps_cumulative_accounts.total_accounts DESC;
    `


    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.total_accounts = parseInt(d.total_accounts)
    })

    // send the results to the browser
    res.send(rows)

  })

  server.get('/api/v1/:network/apps/accounts/summary', cache.route(), async (req, res) => {

    // extracting a limit parameter from the the url
    const { network } = req.params

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // extracting additional query parameters
    const date = req.query.date ? new Date(req.query.date) : yesterday
    const limit = req.query.limit ? parseInt(req.query.limit) : null
    const summary = req.query.summary ? req.query.summary : [30, 60, 90]

    // dates split to create postgres format
    let query = `
    with apps_cumulative_accounts as
    (
      select
        collected_for_day
        , entity_id
        , sum(new_accounts_count) over(partition by entity_id order by collected_for_day) as total_accounts
      from
        daily_new_accounts_per_ecosystem_entity_count
    )
    select
      a.collected_for_day
      , a.entity_id
      , a.total_accounts
      ${summary.map(time_period => `, (select t.total_accounts from apps_cumulative_accounts t where t.entity_id = a.entity_id and t.collected_for_day = (a.collected_for_day - interval '${time_period + 1}' day)) as accounts_${time_period}_days_ago`).join('')}
    from
      apps_cumulative_accounts a
    where
      a.collected_for_day = '${date.toISOString().split('T')[0]}'
    order by
      total_accounts desc
    `

    if (limit !== null) query += `limit ${limit}`

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.total_accounts = parseInt(d.total_accounts)
      summary.forEach(time_period => {
        d[`accounts_${time_period}_days_ago`] = parseInt(d[`accounts_${time_period}_days_ago`])
      })
    })

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
      daily_new_accounts_per_ecosystem_entity_count
    where
      collected_for_day >= '${start.toISOString().split('T')[0]}'
      and collected_for_day <= '${end.toISOString().split('T')[0]}'
    `

    //select the database to use.
    const db = network == 'mainnet' ? mainnet_db : testnet_db

    // execute the query and save and extract the rows from the results object
    let { rows } = await db.query(query)

    rows.forEach(d => {
      d.new_accounts_count = parseInt(d.new_accounts_count)
    })

    // send the results to the browser
    res.send(rows)

  })


  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(process.env.NEXT_PORT || process.env.PORT || 3000, (err) => {
    if (err) throw err
    console.log(`NEAR Analytics API listening at http://localhost:${process.env.NEXT_PORT || process.env.PORT || 3000}`)
  })

})
