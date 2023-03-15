import { IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha'
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CDKContext } from '../types'
import { createNextJSHosting } from './hosting/nextjsHosting'

type AmplifyHostingStackProps = StackProps & {
	userpoolId: string
	identitypoolId: string
	userpoolClientId: string
	bucketName: string
	appSyncAPIUrl: string
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
			environmentVariables: {
				region: context.region,
				userpoolId: props.userpoolId,
				userPoolWebClientId: props.userpoolClientId,
				identityPoolId: props.identitypoolId,
				bucket: props.bucketName,
				appSyncURL: props.appSyncAPIUrl,
				NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
					context.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
				NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER:
					context.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER,
			},
		})

		new CfnOutput(this, 'apiId', { value: amplifyApp.appId })
	}
}
