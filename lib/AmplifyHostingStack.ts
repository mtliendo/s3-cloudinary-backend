import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CDKContext } from '../cdkcontext'
import { createNextJSHosting } from './hosting/nextjsHosting'

type AmplifyHostingStackProps = StackProps & {
	userpoolId: string
	identitypoolId: string
	userpoolClientId: string
	bucketName: string
	appSyncAPIUrl: string
	appSyncAPIId: string
}

export class AmplifyHostingStack extends Stack {
	constructor(
		scope: Construct,
		id: string,
		props: AmplifyHostingStackProps,
		context: CDKContext
	) {
		super(scope, id, props)

		const amplifyApp = createNextJSHosting(this, {
			appName: context.appName,
			branchName: context.branchName,
			githubOauthTokenName: context.githubOauthTokenName,
			owner: context.repoOwner,
			repository: context.repoName,
			environment: context.environment,
			appSyncAPIId: props.appSyncAPIId,
			environmentVariables: {
				region: context.region,
				userpoolId: props.userpoolId,
				userPoolWebClientId: props.userpoolClientId,
				identityPoolId: props.identitypoolId,
				bucket: props.bucketName,
				appSyncURL: props.appSyncAPIUrl,
				cloudinaryCloudName: context.cloudinaryCloudName,
				cloudinaryUploadFolder: context.cloudinaryUploadFolder,
			},
		})

		amplifyApp

		new CfnOutput(this, 'apiId', { value: amplifyApp.appId })
	}
}
