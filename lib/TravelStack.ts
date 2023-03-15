import { CfnOutput, Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CDKContext } from '../types'
import { createAppSyncAPI } from './api/appsync'
import { createTravelUserpool } from './cognito/auth'
import { createTravelTable } from './database/travelTable'
import { createNextJSHosting } from './hosting/nextjsHosting'
import { createTravelPicsBucket } from './s3/travelPics'

type TravelStackProps = {}

export class TravelStack extends Stack {
	readonly userpoolClientId: string
	readonly userpoolId: string
	readonly identitypoolId: string
	readonly bucketName: string
	readonly appSyncAPIUrl: string
	constructor(
		scope: Construct,
		id: string,
		props: TravelStackProps,
		context: CDKContext
	) {
		super(scope, id, props)

		const cognitoAuth = createTravelUserpool(this, {
			namingPrefix: `${context.appName}-${context.environment}`,
		})
		const travelDB = createTravelTable(this, {
			tableName: `${context.appName}-${context.environment}`,
		})
		const travelAPI = createAppSyncAPI(this, {
			namingPrefix: `${context.appName}-${context.environment}`,
			identityPool: cognitoAuth.identityPool,
			userpool: cognitoAuth.userPool,
			travelpostTable: travelDB,
		})
		const travelPicsBucket = createTravelPicsBucket(this, {
			bucketName: `${context.appName}-${context.environment}-bucket`,
			allowedOrigins: context.s3AllowedOrigins,
			authenticatedRole: cognitoAuth.identityPool.authenticatedRole,
			unauthenticatedRole: cognitoAuth.identityPool.unauthenticatedRole,
		})

		this.userpoolClientId = cognitoAuth.userPoolClient.userPoolClientId
		this.userpoolId = cognitoAuth.userPool.userPoolId
		this.identitypoolId = cognitoAuth.identityPool.identityPoolId
		this.bucketName = travelPicsBucket.bucketName
		this.appSyncAPIUrl = travelAPI.graphqlUrl

		new CfnOutput(this, 'region', { value: context.region })
		new CfnOutput(this, 'userpoolId', {
			value: cognitoAuth.userPool.userPoolId,
		})
		new CfnOutput(this, 'userPoolWebClientId', {
			value: cognitoAuth.userPoolClient.userPoolClientId,
		})
		new CfnOutput(this, 'identityPoolId', {
			value: cognitoAuth.identityPool.identityPoolId,
		})
		new CfnOutput(this, 'bucket', { value: travelPicsBucket.bucketName })
		new CfnOutput(this, 'aws_appsync_graphqlEndpoint', {
			value: travelAPI.graphqlUrl,
		})
	}
}
