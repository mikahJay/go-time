import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'

export interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc
  dbSecretArn?: string
  envName?: string
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props)

    const vpc = props.vpc
    const envName = props.envName || 'test'

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc })

    // Create ECR repos for services
    const authRepo = new ecr.Repository(this, 'AuthRepository', { repositoryName: `auth-server-${envName}` })
    const resourceRepo = new ecr.Repository(this, 'ResourceRepository', { repositoryName: `resource-server-${envName}` })

    // Use Secrets Manager secret ARN from ResourcesStack (if provided)
    let dbSecret: secretsmanager.ISecret | undefined
    if (props.dbSecretArn) {
      dbSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'DbSecret', props.dbSecretArn)
    }

    // Task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    // If a DB secret ARN was provided, grant the task role permission to read it
    if (dbSecret) {
      dbSecret.grantRead(taskRole)
    }

    // Auth service (Fargate with ALB)
    const authService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AuthService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(authRepo, 'latest'),
        containerPort: 4000,
        taskRole,
        environment: { NODE_ENV: 'production' },
        secrets: dbSecret ? {
          PGHOST: ecs.Secret.fromSecretsManager(dbSecret, 'host'),
          PGUSER: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
          PGPASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
          PGDATABASE: ecs.Secret.fromSecretsManager(dbSecret, 'dbname'),
          PGPORT: ecs.Secret.fromSecretsManager(dbSecret, 'port'),
        } : undefined,
      },
      desiredCount: 1,
      publicLoadBalancer: true,
      memoryLimitMiB: 512,
      cpu: 256,
    })

    // Resource service
    const resourceService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'ResourceService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(resourceRepo, 'latest'),
        containerPort: 4000,
        taskRole,
        environment: { NODE_ENV: 'production' },
        secrets: dbSecret ? {
          PGHOST: ecs.Secret.fromSecretsManager(dbSecret, 'host'),
          PGUSER: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
          PGPASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
          PGDATABASE: ecs.Secret.fromSecretsManager(dbSecret, 'dbname'),
          PGPORT: ecs.Secret.fromSecretsManager(dbSecret, 'port'),
        } : undefined,
      },
      desiredCount: 1,
      publicLoadBalancer: true,
      memoryLimitMiB: 512,
      cpu: 256,
    })

    new cdk.CfnOutput(this, 'AuthRepoUri', { value: authRepo.repositoryUri })
    new cdk.CfnOutput(this, 'ResourceRepoUri', { value: resourceRepo.repositoryUri })
    new cdk.CfnOutput(this, 'AuthUrl', { value: authService.loadBalancer.loadBalancerDnsName })
    new cdk.CfnOutput(this, 'ResourceUrl', { value: resourceService.loadBalancer.loadBalancerDnsName })
  }
}