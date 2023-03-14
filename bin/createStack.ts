import * as cdk from 'aws-cdk-lib'
import * as gitBranch from 'git-branch'
import { CDKContext } from '../types'

export const getContext = async (app: cdk.App): Promise<CDKContext> => {
	return new Promise(async (resolve, reject) => {
		try {
			const currentBranch = await gitBranch()
			const environment = app.node
				.tryGetContext('environments')
				.find((env: any) => env.branchName === currentBranch)

			const globals = app.node.tryGetContext('globals')

			return resolve({ ...globals, ...environment })
		} catch (err) {
			return reject()
		}
	})
}

export const createStack = async (Stack: any) => {
	try {
		const app = new cdk.App()
		const context = await getContext(app)
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

		new Stack(
			app,
			`${context.appName}-stack-${context.environment}`,
			stackProps,
			context
		)
	} catch (err) {
		console.error(err)
	}
}
