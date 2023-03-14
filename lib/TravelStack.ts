import { Stack } from 'aws-cdk-lib'
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

		// cog, iden, db, api, file
		const cognitoAuth = createTravelUserpool(this)
		const travelDB = createTravelTable(this, {
			tableName: `${context.appName}-${context.environment}`,
		})
		const travelAPI = createAppSyncAPI(this, {
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
	}
}
