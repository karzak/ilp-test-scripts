const { RippleAPI } = require('ripple-lib')

async function run () {
  const serverAccount = process.env.SERVER_ACCOUNT || 'rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN'
  const targetAccount = process.env.TARGET_ACCOUNT || 'r3xCgoE5tPB6n5JBgWGnG2bXE5m8a4XKxc'
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

  for (const channel of serverChannels.channels) {
    if (channel.destination_account === targetAccount) {
      console.log(JSON.stringify(channel, null, 2))
    }
  }

  process.exit(0)
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
