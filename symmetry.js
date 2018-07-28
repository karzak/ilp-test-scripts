const { RippleAPI } = require('ripple-lib')

async function run () {
  const serverAccount = process.env.SERVER_ACCOUNT || 'rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN'
  const channelLimit = process.env.CHANNEL_LIMIT || 100000

  const api = new RippleAPI({
    server: process.env.RIPPLED_SERVER || 'wss://s1.ripple.com'
  })

  console.log('connecting api')
  await api.connect()

  console.log('fetching channels for server')
  const serverChannels = await api.request('account_channels', {
    account: serverAccount,
    limit: channelLimit
  })

  console.log(`got ${serverChannels.channels.length} channels`)

  const counterparties = new Set()
  let escrowSum = 0 
  let balanceSum = 0
  let counterSum = 0
  let counterBalance = 0
  let asymmetry = 0

  for (const channel of serverChannels.channels) {
    counterparties.add(channel.destination_account)
    escrowSum += Number(channel.amount)
    balanceSum += Number(channel.balance)

    const counterChannels = await api.request('account_channels', {
      account: channel.destination_account,
      limit: channelLimit
    })

    let symmetric = false
    for (const counterChannel of counterChannels.channels) {
      if (counterChannel.destination_account === serverAccount) {
        symmetric = true
        counterBalance += Number(counterChannel.balance)
        counterSum += Number(counterChannel.amount)
      }
    }

    if (!symmetric) {
      console.log(`asymmetry in ${channel.destination_account}`)
      asymmetry += 1
    }
  }

  console.log(`${counterparties.size} counterparties`)
  console.log(`${escrowSum / 1e6} XRP escrowed in channels`)
  console.log(`${balanceSum / 1e6} XRP sent to peers`)
  console.log(`${counterBalance / 1e6} XRP sent to us`)
  console.log(`${counterSum / 1e6} XRP escrowed to us`)
  console.log(`${asymmetry} asymmetric relationships`)
  process.exit(0)
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
