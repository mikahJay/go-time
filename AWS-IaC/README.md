# AWS-IaC

This folder contains an AWS CDK (v2) TypeScript scaffold for managing IAM and other AWS resources as code.

Quick start

```powershell
cd AWS-IaC
npm install
# bootstrap (one-time, if your account/region not bootstrapped)
npx cdk bootstrap
# synth to verify
npx cdk synth
# deploy
npx cdk deploy
```

AWS profile guidance

Configure credentials via `~/.aws/credentials` and `~/.aws/config`, and set `AWS_PROFILE` in your shell for the CDK commands:

```powershell
$env:AWS_PROFILE = 'dev'
$env:AWS_SDK_LOAD_CONFIG = '1'
```

What this scaffold contains

- `bin/aws-iac.ts` — CDK app entry
- `lib/iam-stack.ts` — starter stack with an example IAM role
- `cdk.json`, `package.json`, `tsconfig.json` — project config and scripts

Next steps

- Replace `IamStack` contents with your roles/policies/permissions as code.
- Add unit tests and CI (e.g., `cdk synth` in CI) and use `cdk diff` to inspect changes.
