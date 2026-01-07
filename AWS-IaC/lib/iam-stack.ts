import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as iam from 'aws-cdk-lib/aws-iam'

export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Example IAM role: replace with your policies/roles as code
    const exampleRole = new iam.Role(this, 'ExampleRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Example role created by AWS-IaC scaffold',
    })

    // Attach a managed policy as a simple example (S3 read-only)
    exampleRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'))
  }
}
