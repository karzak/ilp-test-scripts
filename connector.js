const PluginBtp = require('ilp-plugin-btp')
const Connector = require('ilp-connector')
const IlpStream = require('ilp-protocol-stream')
const getPort = require('get-port')
const fetch = require('node-fetch')
const faucetUrl = 'https://faucet.altnet.rippletest.net/accounts'
const xrpServer = 'wss://s.altnet.rippletest.net:51233'

console.log(`
        connectorB
         /      \\
        /        \\
  connectorA   connectorC
      /            \\
  clientA         clientB
`)

async function getXrpAccount () {
  const res = await fetch(faucetUrl, {
    method: 'POST'    
  })

  const json = await res.json()
  return json.account
}

async function run () {
  console.log('retreiving port for connectorB')
  const portB = await getPort()

  console.log('retreiving xrp account for connectorB')
  const accountB = await getXrpAccount()

  console.log('constructing connectorB')
  const connectorB = Connector.createApp({
    spread: 0,
    backend: 'one-to-one',
    store: 'ilp-store-memory',
    initialConnectTimeout: 60000,
    ilpAddress: 'test.asym',
    accounts: {
      children: {
        relation: 'child',
        plugin: 'ilp-plugin-xrp-asym-server',
        assetCode: 'XRP',
        assetScale: 6,
        maxPacketAmount: '1000',
        options: {
          port: portB,
          prefix: 'private.asym.children',
          xrpServer,
          maxPacketAmount: '1000',
          ...accountB
        }
      }
    }
  })

  console.log('retreiving port for connectorA')
  const portA = await getPort()

  console.log('retreiving xrp account for connectorA')
  const accountA = await getXrpAccount()

  console.log('constructing connectorA')
  const connectorA = Connector.createApp({
    spread: 0,
    backend: 'one-to-one',
    store: 'ilp-store-memory',
    initialConnectTimeout: 60000,
    accounts: {
      parent: {
        relation: 'parent',
        plugin: 'ilp-plugin-xrp-asym-client',
        assetCode: 'XRP',
        assetScale: 6,
        maxPacketAmount: '1000',
        balance: {
          minimum: '-Infinity',
          maximum: '20000',
          settleThreshold: '5000',
          settleTo: '10000'
        },
        sendRoutes: false,
        receiveRoutes: false,
        options: {
          server: `btp+ws://userA:secretA@localhost:${portB}`,
          xrpServer,
          ...accountA
        }
      },
      local: {
        relation: 'child',
        plugin: 'ilp-plugin-mini-accounts',
        assetCode: 'XRP',
        assetScale: 6,
        options: {
          wsOpts: { port: portA }
        }
      }
    }
  })

  console.log('retreiving port for connectorC')
  const portC = await getPort()

  console.log('retreiving xrp account for connectorC')
  const accountC = await getXrpAccount()

  console.log('constructing connectorC')
  const connectorC = Connector.createApp({
    spread: 0,
    backend: 'one-to-one',
    store: 'ilp-store-memory',
    initialConnectTimeout: 60000,
    accounts: {
      parent: {
        relation: 'parent',
        plugin: 'ilp-plugin-xrp-asym-client',
        assetCode: 'XRP',
        assetScale: 6,
        maxPacketAmount: '1000',
        balance: {
          minimum: '-Infinity',
          maximum: '20000',
          settleThreshold: '5000',
          settleTo: '10000'
        },
        sendRoutes: false,
        receiveRoutes: false,
        options: {
          server: `btp+ws://userC:secretC@localhost:${portB}`,
          xrpServer,
          ...accountC
        }
      },
      local: {
        relation: 'child',
        plugin: 'ilp-plugin-mini-accounts',
        assetCode: 'XRP',
        assetScale: 6,
        options: {
          wsOpts: { port: portC }
        }
      }
    }
  })

  console.log('creating clientA')
  const clientA1 = new PluginBtp({ server: `btp+ws://clientA1:secretA1@localhost:${portA}` })
  const clientA2 = new PluginBtp({ server: `btp+ws://clientA2:secretA2@localhost:${portA}` })
  const clientA3 = new PluginBtp({ server: `btp+ws://clientA3:secretA3@localhost:${portA}` })

  console.log('creating clientC')
  const clientC = new PluginBtp({ server: `btp+ws://clientC:secretC@localhost:${portC}` })

  console.log('connecting connectorB')
  await connectorB.listen()

  console.log('connecting connectorA')
  await connectorA.listen()

  console.log('connecting clientA')
  await clientA1.connect()
  await clientA2.connect()
  await clientA3.connect()

  console.log('connecting connectorC')
  await connectorC.listen()

  console.log('connecting clientC')
  await clientC.connect()

  console.log('creating STREAM server on clientC')
  const streamServerC = await IlpStream.createServer({
    plugin: clientC
  })

  let total = 0
  streamServerC.on('connection', conn => {
    conn.on('stream', stream =>  {
      stream.on('money', amount => {
        total += Number(amount)
        console.log('streamServerC received', total)

        if (total >= 30000000) {
          console.log('done!')
          process.exit(0)
        }
      })
      stream.setReceiveMax(Infinity)
    })
  })

  console.log('creating STREAM client on clientA')
  const streamClientA1 = await IlpStream.createConnection({
    plugin: clientA1,
    ...(streamServerC.generateAddressAndSecret())
  })

  const streamClientA2 = await IlpStream.createConnection({
    plugin: clientA2,
    ...(streamServerC.generateAddressAndSecret())
  })

  const streamClientA3 = await IlpStream.createConnection({
    plugin: clientA3,
    ...(streamServerC.generateAddressAndSecret())
  })

  console.log('sending 30 XRP from streamClientA to streamServerC')
  const stream1 = streamClientA1.createStream()
  await stream1.setSendMax(String(10 * 1e6))

  const stream2 = streamClientA2.createStream()
  await stream2.setSendMax(String(10 * 1e6))

  const stream3 = streamClientA3.createStream()
  await stream3.setSendMax(String(10 * 1e6))
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
