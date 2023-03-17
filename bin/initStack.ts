import { CDKContext } from '../cdkcontext'
import * as cdk from 'aws-cdk-lib'

// Get the current git branch
const getCurrentBranch = (): string => {
	const branch = require('git-branch')
	return branch.sync()
}

// Get the environment context based on the current git branch
const getEnvironmentContext = (app: cdk.App) => {
	const currentBranch = getCurrentBranch()
	const environments = app.node.tryGetContext('environments')
	const environment = environments.find(
		(env: any) => env.branchName === currentBranch
	)
	const globals = app.node.tryGetContext('globals')

	return { ...globals, ...environment }
}

// Initialize the stack
export const initStack = () => {
	const app = new cdk.App()
	const context = getEnvironmentContext(app) as CDKContext

	const tags = {
		Environment: context.environment,
	}

	const stackProps: cdk.StackProps = {
		env: {
			region: context.region,
		},
		stackName: `${context.appName}-stack-${context.environment}`,
		description: context.appDescription,
		tags,
	}

	return {
		app,
		stackNameWithEnv: `${context.appName}-stack-${context.environment}`,
		stackProps,
		context,
	}
}
