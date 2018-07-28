const { RippleAPI } = require('ripple-lib')

async function run () {
  const serverAccount = process.env.SERVER_ACCOUNT || 'rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN'
  const channelLimit = process.env.CHANNEL_LIMIT || 100000

  const api = new RippleAPI({
    server: process.env.RIPPLED_SERVER || 'wss://s1.ripple.com'
  })

  console.error('connecting api')
  await api.connect()

  console.error('fetching channels for server')
  const serverChannels = await api.request('account_channels', {
    account: serverAccount,
    limit: channelLimit
  })

  console.error(`got ${serverChannels.channels.length} channels`)
  const clientChannels = new Array()

  for (const channel of serverChannels.channels) {
    const counterChannels = await api.request('account_channels', {
      account: channel.destination_account,
      limit: channelLimit
    })

    for (const counterChannel of counterChannels.channels) {
      if (counterChannel.destination_account === serverAccount) {
        clientChannels.push(counterChannel)
      }
    }
  }

  console.error(`got ${clientChannels.length} client channels`)
  const channels = [ ...serverChannels.channels, ...clientChannels ]

  console.error(`got ${channels.length} total channels`)
  console.error()
  for (let i = 0; i < channels.length; ++i) {
    const channel = channels[i]
    process.stderr.write('\rfetching channel ' + (i + 1))

    console.log(JSON.stringify(await api.request('ledger_entry', {
      index: channel.channel_id,
      binary: false
    })))
  }

  process.stderr.write('\n')
  console.error('complete')
  process.exit(0)
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
