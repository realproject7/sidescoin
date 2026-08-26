# SIDES

An interactive, read-only Base market experience for `SIDES` and its automatic LP share, `lpSIDES`.

The hero is a real-time 3D coin: hold to build momentum, release to land on a side, or choose a side from the market panel. Live market and series data are loaded from public lptoken.fun endpoints through a server-side route. Execution remains on lptoken.fun.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `LPTOKEN_BASE_URL` | `https://lptoken.fun` | Public market-data origin |
| `LPTOKEN_CHAIN` | `base` | Market chain slug |
| `LPTOKEN_TOKEN_ADDRESS` | Basecat address | Preview market, replaced after SIDES launches |
| `BASE_RPC_URL` | `https://mainnet.base.org` | Read-only ERC-20 total-supply query |

The Basecat address automatically enables a visible preview-data label. Replacing it with the SIDES token address removes that label without a code change.

## Checks

```bash
npm run lint
npm test
npm run build
```

No wallet connection, private API key, or credential is required.
