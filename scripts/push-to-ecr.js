#!/usr/bin/env node
const { execSync } = require('child_process')
const path = require('path')

function run(cmd, opts = {}) {
  return execSync(cmd, Object.assign({ stdio: 'pipe', encoding: 'utf8' }, opts)).trim()
}

async function main() {
  const args = process.argv.slice(2)
  const svc = args[0]
  if (!svc) {
    console.error('Usage: node scripts/push-to-ecr.js <auth-server|resource-server> [--profile PROFILE] [--region REGION] [--tag TAG]')
    process.exit(2)
  }

  const profileIndex = args.indexOf('--profile')
  const profile = profileIndex !== -1 ? args[profileIndex + 1] : process.env.AWS_PROFILE || 'test'
  const regionIndex = args.indexOf('--region')
  const region = regionIndex !== -1 ? args[regionIndex + 1] : process.env.AWS_REGION || 'us-east-2'
  const tagIndex = args.indexOf('--tag')
  const tag = tagIndex !== -1 ? args[tagIndex + 1] : 'latest'

  const mapping = {
    'auth-server': `auth-server-${profile}`,
    'resource-server': `resource-server-${profile}`,
  }

  const repoName = mapping[svc]
  if (!repoName) {
    console.error('Unknown service:', svc)
    process.exit(2)
  }

  try {
    console.log('Retrieving AWS account id...')
    const account = run(`aws sts get-caller-identity --query Account --output text --profile ${profile} --region ${region}`)

    console.log('Ensuring ECR repository exists:', repoName)
    try {
      run(`aws ecr describe-repositories --repository-names ${repoName} --profile ${profile} --region ${region}`)
    } catch (e) {
      console.log('Repository not found, creating...')
      run(`aws ecr create-repository --repository-name ${repoName} --profile ${profile} --region ${region}`)
    }

    const repoUri = run(`aws ecr describe-repositories --repository-names ${repoName} --query 'repositories[0].repositoryUri' --output text --profile ${profile} --region ${region}`)

    console.log('Logging into ECR...')
    // login
    execSync(`aws ecr get-login-password --profile ${profile} --region ${region} | docker login --username AWS --password-stdin ${account}.dkr.ecr.${region}.amazonaws.com`, { stdio: 'inherit' })

    const svcDir = path.join(__dirname, '..', 'services', svc)
    console.log('Building Docker image for', svc)
    execSync(`docker build -t ${repoName}:local -f ${path.join(svcDir, 'Dockerfile') || 'Dockerfile'} ${svcDir}`, { stdio: 'inherit' })

    console.log('Tagging image with ECR URI')
    execSync(`docker tag ${repoName}:local ${repoUri}:${tag}`, { stdio: 'inherit' })

    console.log('Pushing image to ECR')
    execSync(`docker push ${repoUri}:${tag}`, { stdio: 'inherit' })

    console.log('Pushed', `${repoUri}:${tag}`)
  } catch (err) {
    console.error('Error pushing image:', err && err.message)
    process.exit(1)
  }
}

main()
