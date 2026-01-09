import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'

export class ResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // DynamoDB table 'Resources' with partition key 'id' (matches server code)
    const table = new dynamodb.Table(this, 'ResourcesTable', {
      tableName: 'Resources',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // safe for dev; change for prod
    })

    // Add a Global Secondary Index on `owner` to allow efficient lookups by owner.
    // DynamoDB is schemaless so we don't need to declare an attribute for `description`.
    table.addGlobalSecondaryIndex({
      indexName: 'OwnerIndex',
      partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // Create a dedicated IAM role for DynamoDB access. This role is assumed
    // by Lambda by default; change the service principal as needed.
    const dynamoRole = new iam.Role(this, 'ResourcesDynamoRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role that is allowed full access to the Resources DynamoDB table',
    })

    // Grant full access to the table for this role. For production, prefer
    // least-privilege policies instead of full access.
    table.grantFullAccess(dynamoRole)

    // Export useful info
    new cdk.CfnOutput(this, 'ResourcesTableName', { value: table.tableName })
    new cdk.CfnOutput(this, 'ResourcesDynamoRoleArn', { value: dynamoRole.roleArn })
  }
}
