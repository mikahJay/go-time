# Resource Server

Scaffold for a simple Resource microservice. Uses a PostgresDB RDS instance in AWS.

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

## Connect resource-server to Postgres RDS Instance

If your local network cannot reach the RDS instance (ETIMEDOUT), use AWS Systems Manager (SSM) port forwarding to tunnel the Postgres port through an EC2 instance in the same VPC. This avoids opening the DB to the public internet.

- Provision an EC2 instance in the same VPC and subnet as the DB that has the SSM Agent installed (Amazon Linux AMIs include it).
- Attach an IAM role with the `AmazonSSMManagedInstanceCore` policy to the instance.
- Ensure the EC2 instance's security group allows outbound TCP to port `5432`, and ensure the DB security group allows inbound TCP `5432` from the EC2 instance security group.

Once you have an instance (`i-07f3fc0cd01b8a1a2`) you can start a local port-forwarding session (this example forwards local port 5432 to the DB):

PowerShell (requires AWS CLI v2 and `AWS_PROFILE` configured):

```powershell
$env:AWS_PROFILE='dev'
aws ssm start-session --target i-07f3fc0cd01b8a1a2 \
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
