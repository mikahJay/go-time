"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const ecsPatterns = __importStar(require("aws-cdk-lib/aws-ecs-patterns"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
class EcsStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const vpc = props.vpc;
        const envName = props.envName || 'test';
        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
        // Create ECR repos for services
        const authRepo = new ecr.Repository(this, 'AuthRepository', { repositoryName: `auth-server-${envName}` });
        const resourceRepo = new ecr.Repository(this, 'ResourceRepository', { repositoryName: `resource-server-${envName}` });
        // Use Secrets Manager secret ARN from ResourcesStack (if provided)
        let dbSecret;
        if (props.dbSecretArn) {
            dbSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'DbSecret', props.dbSecretArn);
        }
        // Task role
        const taskRole = new iam.Role(this, 'TaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        // If a DB secret ARN was provided, grant the task role permission to read it
        if (dbSecret) {
            dbSecret.grantRead(taskRole);
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
        });
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
        });
        new cdk.CfnOutput(this, 'AuthRepoUri', { value: authRepo.repositoryUri });
        new cdk.CfnOutput(this, 'ResourceRepoUri', { value: resourceRepo.repositoryUri });
        new cdk.CfnOutput(this, 'AuthUrl', { value: authService.loadBalancer.loadBalancerDnsName });
        new cdk.CfnOutput(this, 'ResourceUrl', { value: resourceService.loadBalancer.loadBalancerDnsName });
    }
}
exports.EcsStack = EcsStack;
