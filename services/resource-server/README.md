Resource Server

Scaffold for a simple Resource microservice.

Endpoints

- GET /resources — list resources
- POST /resources — create resource (body: { name, type, quantity, metadata, owner })
- GET /resources/:id — get resource
- PUT /resources/:id — update resource
- DELETE /resources/:id — delete resource

Run

```powershell
cd services/resource-server
npm install
npm start
```

Tests

```powershell
cd services/resource-server
npm install
npm test
```
