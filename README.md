# Go-Time

A platform for allocating unused resources to worthy causes.

## Codebase

There will be three interfaces:

1. A React web application in `app`.

2. An iOS mobile application in `iOS`.

3. An Android mobile application in `android`.

All services will be in `services`.

## General Architecture

Interfaces will sit on services hosted in AWS.

Analytics will primarily be run in Snowflake, using dbt-Cloud for execution.

## Quick Start

Start the three local services (auth server, resource server, and React app) from the repo root. Each service defaults to a port shown below but can be overridden with the `PORT` environment variable.

PowerShell / Windows example:

```powershell
# from repo root
cd services/auth-server
npm install
# default port 3000 (override with $env:PORT = '3001')
$env:PORT = '3000'; npm start &

cd ..\resource-server
npm install
# default port 4000 (override with $env:PORT = '4000')
$env:PORT = '4000'; npm start &

cd ..\..\app
npm install
# Vite dev server (default 5173). To change the port, set --port or VITE_DEV_PORT.
npm run dev -- --port 5173
```

Bash / macOS / Linux example:

```bash
# from repo root
cd services/auth-server
npm install
# default port 3000
PORT=3000 npm start &

cd ../resource-server
npm install
# default port 4000
PORT=4000 npm start &

cd ../../app
npm install
# Vite dev server (default 5173). To change the port pass --port.
npm run dev -- --port 5173
```

Notes
- `auth-server` defaults to port 3000.
- `resource-server` defaults to port 4000.
- The React app uses Vite and serves on 5173 by default; you can set a different port using the `--port` flag when running `npm run dev`.
- To point the front-end at a running `resource-server`, set `VITE_RESOURCE_SERVER_BASE` in `app/.env` or in your shell: `export VITE_RESOURCE_SERVER_BASE=http://localhost:4000` (or PowerShell equivalent).
