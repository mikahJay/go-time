#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { IamStack } from '../lib/iam-stack'
import { ResourcesStack } from '../lib/resources-stack'

const app = new cdk.App()
new IamStack(app, 'IamStack')
new ResourcesStack(app, 'ResourcesStack')
