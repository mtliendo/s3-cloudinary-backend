import * as cdk from 'aws-cdk-lib'
import * as gitBranch from 'git-branch'
import { CDKContext } from '../types'

export const getContext = async (app: cdk.App) => {
	const currentBranch = await gitBranch()
	const environment = app.node
		.tryGetContext('environments')
		.find((env: any) => env.branchName === currentBranch)

	const globals = app.node.tryGetContext('globals')

	return { ...globals, ...environment }
}

export const initStack = async () => {
	const app = new cdk.App()
	const context = (await getContext(app)) as CDKContext
	const tags: any = {
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
