import { CfnOutput, Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CDKContext } from '../types'
import { createAppSyncAPI } from './api/appsync'
import { createTravelUserpool } from './cognito/auth'
import { createTravelTable } from './database/travelTable'
import { createTravelPicsBucket } from './s3/travelPics'

type TravelStackProps = {}

export class TravelStack extends Stack {
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
			bucketName: `${context.appName}-${context.environment}`,
			allowedOrigins: ['http://localhost:3000'],
			authenticatedRole: cognitoAuth.identityPool.authenticatedRole,
			unauthenticatedRole: cognitoAuth.identityPool.unauthenticatedRole,
		})

		new CfnOutput(this, 'APIUrl', {
			value: travelAPI.graphqlUrl,
		})
		new CfnOutput(this, 'Project Region', {
			value: context.region,
		})
		new CfnOutput(this, 'bucketName', {
			value: travelPicsBucket.bucketName,
		})
		new CfnOutput(this, 'userpool ID', {
			value: cognitoAuth.userPool.userPoolId,
		})
		new CfnOutput(this, 'identitypool ID', {
			value: cognitoAuth.identityPool.identityPoolId,
		})
		new CfnOutput(this, 'webclient ID', {
			value: cognitoAuth.userPoolClient.userPoolClientId,
		})
	}
}
