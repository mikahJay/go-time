import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as iam from 'aws-cdk-lib/aws-iam'

export class ResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'ResourcesVpc', {
      maxAzs: 2,
      natGateways: 1,
    })

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'ResourcesDbSg', {
      vpc,
      description: 'Allow Postgres access',
      allowAllOutbound: true,
    })

    const devIpCidr = process.env.DEV_IP_CIDR || this.node.tryGetContext('devIpCidr')
    if (devIpCidr) {
      const isIpv6 = devIpCidr.includes(':')
      if (isIpv6) {
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv6(devIpCidr), ec2.Port.tcp(5432), 'Allow Postgres from developer IPv6')
      } else {
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(devIpCidr), ec2.Port.tcp(5432), 'Allow Postgres from developer IPv4')
      }
    } else {
      dbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Allow Postgres (dev - permissive)')
      new cdk.CfnOutput(this, 'DevIpHint', { value: 'Set DEV_IP_CIDR env var or cdk context devIpCidr to restrict DB access' })
    }

    // Optionally allow a second developer machine to access Postgres
    // Configure via env `DEV2_IP_CIDR` or CDK context `dev2IpCidr` (preferred)
    const dev2IpCidr = process.env.DEV2_IP_CIDR || this.node.tryGetContext('dev2IpCidr')
    if (dev2IpCidr) {
      const isIpv6Dev2 = dev2IpCidr.includes(':')
      const cidr = dev2IpCidr.includes('/') ? dev2IpCidr : `${dev2IpCidr}${isIpv6Dev2 ? '/128' : '/32'}`
      if (isIpv6Dev2) {
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv6(cidr), ec2.Port.tcp(5432), 'Allow Postgres from developer (dev2) IPv6')
      } else {
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(5432), 'Allow Postgres from developer (dev2) IPv4')
      }
    }

    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres')

    const db = new rds.DatabaseInstance(this, 'ResourcesPostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      securityGroups: [dbSecurityGroup],
      credentials: dbCredentials,
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      publiclyAccessible: false,
      databaseName: 'resources',
    })

    const bastionSg = new ec2.SecurityGroup(this, 'BastionSg', {
      vpc,
      description: 'SSM bastion security group',
      allowAllOutbound: true,
    })

    dbSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(bastionSg.securityGroupId), ec2.Port.tcp(5432), 'Allow Postgres from bastion SG')

    const bastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    })

    const bastion = new ec2.Instance(this, 'BastionInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      role: bastionRole,
      securityGroup: bastionSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    })

    new cdk.CfnOutput(this, 'BastionInstanceId', { value: bastion.instanceId })
    new cdk.CfnOutput(this, 'BastionSecurityGroup', { value: bastionSg.securityGroupId })

    new cdk.CfnOutput(this, 'ResourcesDbEndpoint', { value: db.dbInstanceEndpointAddress })
    new cdk.CfnOutput(this, 'ResourcesDbPort', { value: db.dbInstanceEndpointPort })
    new cdk.CfnOutput(this, 'ResourcesDbSecretArn', { value: dbCredentials.secret?.secretArn || '' })

    // Create a separate, publicly-accessible Postgres instance for local testing.
    // This avoids modifying the existing primary (private) DB.
    const publicDbSg = new ec2.SecurityGroup(this, 'PublicResourcesDbSg', {
      vpc,
      description: 'Public Postgres access for developer testing',
      allowAllOutbound: true,
    })

    // Allow developer IP(s) to access the public DB (same context/env vars used above)
    if (devIpCidr) {
      const isIpv6 = devIpCidr.includes(':')
      if (isIpv6) {
        publicDbSg.addIngressRule(ec2.Peer.ipv6(devIpCidr), ec2.Port.tcp(5432), 'Allow Postgres from developer IPv6')
      } else {
        publicDbSg.addIngressRule(ec2.Peer.ipv4(devIpCidr), ec2.Port.tcp(5432), 'Allow Postgres from developer IPv4')
      }
    } else {
      publicDbSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Allow Postgres (dev - permissive)')
    }

    if (dev2IpCidr) {
      const isIpv6Dev2 = dev2IpCidr.includes(':')
      const cidr = dev2IpCidr.includes('/') ? dev2IpCidr : `${dev2IpCidr}${isIpv6Dev2 ? '/128' : '/32'}`
      if (isIpv6Dev2) {
        publicDbSg.addIngressRule(ec2.Peer.ipv6(cidr), ec2.Port.tcp(5432), 'Allow Postgres from developer (dev2) IPv6')
      } else {
        publicDbSg.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(5432), 'Allow Postgres from developer (dev2) IPv4')
      }
    }

    // Also allow the bastion SG to reach the public DB (useful for SSM or internal access)
    publicDbSg.addIngressRule(ec2.Peer.securityGroupId(bastionSg.securityGroupId), ec2.Port.tcp(5432), 'Allow Postgres from bastion SG')

    const publicDbCredentials = rds.Credentials.fromGeneratedSecret('postgres')

    const publicDb = new rds.DatabaseInstance(this, 'PublicResourcesPostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [publicDbSg],
      credentials: publicDbCredentials,
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      publiclyAccessible: true,
      databaseName: 'resources_public',
    })

    new cdk.CfnOutput(this, 'PublicResourcesDbEndpoint', { value: publicDb.dbInstanceEndpointAddress })
    new cdk.CfnOutput(this, 'PublicResourcesDbPort', { value: publicDb.dbInstanceEndpointPort })
    new cdk.CfnOutput(this, 'PublicResourcesDbSecretArn', { value: publicDbCredentials.secret?.secretArn || '' })
  }
}
