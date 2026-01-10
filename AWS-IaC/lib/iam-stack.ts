import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    // Minimal IAM stack placeholder — extend if you need cross-account roles, etc.
  }
}
