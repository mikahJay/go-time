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