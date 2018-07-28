# XRP Scripts
> Scripts for monitoring XRP ledger accounts and ILP plugins

## Symmetry

```
SERVER_ACCOUNT=rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN node symmetry.js
```

Looks at all outgoing channels from an account and all channels coming
back. Doesn't monitor closed channels.

Returns:

- Number of channels
- Asymmetries (channels to accounts who have no channels to us)
- Unique counterparties
- Amount escrowed in outgoing channels
- Sum of outgoing channel balances
- Sum of incomign channel balances
- Amount escrowed in incoming channels
- Number of asymmetries

## Interact

```
SERVER_ACCOUNT=rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN \
TARGET_ACCOUNT=r3xCgoE5tPB6n5JBgWGnG2bXE5m8a4XKxc \
  node interact.js
```

Looks at all channels sent to the target account. Prints them in JSON format.

## Sweep

```
SERVER_ACCOUNT=rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN node sweep.js
```

Looks at all channels opened to other accounts, and all channels opened to this
account by accounts to whom it has opened a channel.

Dumps a line of JSON for each ledger entry.
