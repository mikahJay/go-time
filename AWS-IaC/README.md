CDK infra for local development

This project creates a private RDS Postgres instance with credentials in Secrets Manager and an SSM-capable bastion for port forwarding.

Quick start

1. Install deps:

```bash
cd AWS-IaC
npm install
```

2. Synthesize / deploy (example with dev profile and restricting your IP):

```bash
# restrict DB to your IP CIDR (e.g. 1.2.3.4/32)
cdk deploy --profile dev --context devIpCidr=1.2.3.4/32
```

3. Use SSM port forwarding to the bastion and test locally (see project docs in repo).

**Starting SSM for Database Connection**

When the stack is deployed you can start an SSM port-forwarding session from your workstation to the bastion so your local machine can reach the private RDS endpoint on localhost:5432.

Example (PowerShell) — replace the placeholders with your values from the CloudFormation stack outputs and Secrets Manager:

```powershell
$body='{"host":["<DB_ENDPOINT>"],"portNumber":["5432"],"localPortNumber":["5432"]}'
[System.IO.File]::WriteAllText("params-remote.json",$body,(New-Object System.Text.UTF8Encoding $false))
aws ssm start-session --target <BASTION_INSTANCE_ID> \
	--document-name AWS-StartPortForwardingSessionToRemoteHost \
	--parameters file://params-remote.json --region <AWS_REGION> --profile <AWS_PROFILE>
```

Leave that terminal open while you run your application locally pointed at `127.0.0.1:5432`.