# Resource Server

Scaffold for a simple Resource microservice.

## Endpoints

- GET /resources — list resources
- POST /resources — create resource (body: { name, type, quantity, metadata, owner })
- GET /resources/:id — get resource
- PUT /resources/:id — update resource
- DELETE /resources/:id — delete resource

## Run

```powershell
cd services/resource-server
npm install
npm start
```

## Tests

```powershell
cd services/resource-server
npm install
npm test
```

## Using DynamoDB

Set `RESOURCE_STORE=dynamo` and configure `AWS_REGION` and `DYNAMO_TABLE` (see `.env.example`). The server will use DynamoDB as the backing store and expose the same `/resources` API.

Note: the DynamoDB adapter uses `Scan` for list operations (suitable for small datasets / dev). For production usage, add proper indexes and queries.

### AWS profile & config (recommended)

The AWS SDK resolves credentials and region using the standard provider chain, so for local development it's recommended to configure your profile in `~/.aws/credentials` and `~/.aws/config` rather than committing secrets.

### Examples:

- Create a profile with the AWS CLI:

	```bash
	aws configure --profile dev
	```

- Use the profile for a session (PowerShell):

	```powershell
	$env:AWS_PROFILE = 'dev'
	# optionally enable loading shared config for region from ~/.aws/config
	$env:AWS_SDK_LOAD_CONFIG = '1'
	```

- Use the profile in bash:

	```bash
	export AWS_PROFILE=dev
	export AWS_SDK_LOAD_CONFIG=1
	```

You can still set `AWS_REGION` and `DYNAMO_TABLE` in `services/resource-server/.env` for convenience.

### Local development with LocalStack

To run against LocalStack (DynamoDB emulation) set the `RESOURCE_STORE` to `dynamo` and point the client at the LocalStack endpoint. Example environment settings:

```powershell
setx RESOURCE_STORE dynamo
setx AWS_REGION us-east-1
setx DYNAMO_TABLE Resources
setx DYNAMO_ENDPOINT http://localhost:4566
```

Note: the current DynamoDB adapter will use the AWS SDK default client construction. If you want me to wire `DYNAMO_ENDPOINT` into the adapter so it automatically points the `DynamoDBClient` at `DYNAMO_ENDPOINT` for LocalStack, I can add that change.
