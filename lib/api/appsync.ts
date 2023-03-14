import { Construct } from 'constructs'
import * as awsAppsync from 'aws-cdk-lib/aws-appsync'
import * as path from 'path'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha'

type AppSyncAPIProps = {
	userpool: UserPool
	travelpostTable: Table
	identityPool: IdentityPool
}

export function createAppSyncAPI(scope: Construct, props: AppSyncAPIProps) {
	const api = new awsAppsync.GraphqlApi(scope, 'APISamples', {
		name: 'APISamples',
		schema: awsAppsync.SchemaFile.fromAsset(
			path.join(__dirname, 'graphql/schema.graphql')
		),
		authorizationConfig: {
			defaultAuthorization: {
				authorizationType: awsAppsync.AuthorizationType.USER_POOL,
				userPoolConfig: {
					userPool: props.userpool,
				},
			},
			additionalAuthorizationModes: [
				{ authorizationType: awsAppsync.AuthorizationType.IAM },
			],
		},
		logConfig: {
			fieldLogLevel: awsAppsync.FieldLogLevel.ALL,
		},
		xrayEnabled: true,
	})

	const TravelPostDataSource = api.addDynamoDbDataSource(
		'TravelPostDataSource',
		props.travelpostTable
	)

	api.grantQuery(
		props.identityPool.unauthenticatedRole,
		'getTravelPost',
		'listTravelPosts'
	)

	const getTravelPostFunction = new awsAppsync.AppsyncFunction(
		scope,
		'getTravelPostFunction',
		{
			name: 'getTravelPostFunction',
			api,
			dataSource: TravelPostDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/functions/Query.getTravelPost.js')
			),
		}
	)

	const createTravelPostFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createTravelPostFunction',
		{
			name: 'createTravelPostFunction',
			api,
			dataSource: TravelPostDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/functions/Mutation.createTravelPost.js')
			),
		}
	)

	const listTravelPostsFunction = new awsAppsync.AppsyncFunction(
		scope,
		'listTravelPostsFunction',
		{
			name: 'listTravelPostsFunction',
			api,
			dataSource: TravelPostDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/functions/Query.listTravelPosts.js')
			),
		}
	)

	const passThroughSteps = `
    // The before step
    export function request(...args) {
      console.log(args);
      return {}
    }

    // The after step
    export function response(ctx) {
      return ctx.prev.result
    }
  `
	new awsAppsync.Resolver(scope, 'getTravelPostPipelineResolver', {
		api,
		typeName: 'Query',
		fieldName: 'getTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [getTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'createTravelPostPipelineResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'createTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [createTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'listTravelPostsPipelineResolver', {
		api,
		typeName: 'Query',
		fieldName: 'listTravelPosts',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [listTravelPostsFunction],
	})
}
