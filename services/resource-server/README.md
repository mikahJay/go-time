# Resource Server

Scaffold for a simple Resource microservice.

## Endpoints

- GET /resources — list resources
- POST /resources — create resource (body: { name, type, quantity, description?, metadata, owner })
- GET /resources/:id — get resource
- PUT /resources/:id — update resource
- DELETE /resources/:id — delete resource

## Run

```powershell
cd services/resource-server
npm install
npm start
```

### Sample curl POST

```
curl -X POST -H "Content-Type: application/json" -d '{"name": "hello"}' http://localhost:4000/resources
```

### Sample curl GET

```
curl http://localhost:4000/resources/res_8fffc157-8eaa-4fba-a636-0f0ac337d3f8
```

## Tests

```
cd services/resource-server
npm install
npm test
```

## Using DynamoDB

Set `RESOURCE_STORE=dynamo` and configure `AWS_REGION` and `DYNAMO_TABLE` (see `.env.example`). The server will use DynamoDB as the backing store and expose the same `/resources` API.

Note: the DynamoDB adapter uses `Scan` for list operations (suitable for small datasets / dev). For production usage, add proper indexes and queries.

Fields

- `description` (optional string): free-text description for the resource. It's optional and may be included on create or update. The server validates that `description` is a string when present.

### AWS profile & config (recommended)

The AWS SDK resolves credentials and region using the standard provider chain, so for local development it's recommended to configure your profile in `~/.aws/credentials` and `~/.aws/config` rather than committing secrets.

Create a profile with the AWS CLI:

```bash
aws configure --profile dev
```

Use the profile for a session (PowerShell):

```powershell
$env:AWS_PROFILE = 'dev'
# optionally enable loading shared config for region from ~/.aws/config
$env:AWS_SDK_LOAD_CONFIG = '1'
```

Use the profile in bash:

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

The DynamoDB adapter now supports `DYNAMO_ENDPOINT`, so the client will point at LocalStack when that variable is set.

## Networking Workarounds

If your local network cannot reach the RDS instance (ETIMEDOUT), use AWS Systems Manager (SSM) port forwarding to tunnel the Postgres port through an EC2 instance in the same VPC. This avoids opening the DB to the public internet.

- Provision an EC2 instance in the same VPC and subnet as the DB that has the SSM Agent installed (Amazon Linux AMIs include it).
- Attach an IAM role with the `AmazonSSMManagedInstanceCore` policy to the instance.
- Ensure the EC2 instance's security group allows outbound TCP to port `5432`, and ensure the DB security group allows inbound TCP `5432` from the EC2 instance security group.

Once you have an instance (`i-0123456789abcdef0`) you can start a local port-forwarding session (this example forwards local port 5432 to the DB):

PowerShell (requires AWS CLI v2 and `AWS_PROFILE` configured):

```powershell
$env:AWS_PROFILE='dev'
aws ssm start-session --target i-0123456789abcdef0 \
	--document-name AWS-StartPortForwardingSession \
	--parameters '{"portNumber":["5432"],"localPortNumber":["5432"]}'
```

After the session starts, point your local client at `localhost:5432`. Example test (PowerShell):

```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

Or in your application set `DATABASE_URL` to `postgres://user:pass@localhost:5432/dbname` while the tunnel is active.

Cleanup: end the SSM session to close the tunnel. If you provisioned the EC2 instance just for this temporary access, terminate it when finished.

CDK hint (example): to automate this in CDK, create an `ec2.Instance` with the `AmazonSSMManagedInstanceCore` role and a restricted security group, and allow the DB security group to accept traffic from the instance's security group. Do not open the DB to 0.0.0.0/0 for production.
