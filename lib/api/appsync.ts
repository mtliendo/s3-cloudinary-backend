import { Construct } from 'constructs'
import * as awsAppsync from 'aws-cdk-lib/aws-appsync'
import * as path from 'path'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha'

type AppSyncAPIProps = {
	namingPrefix: string
	userpool: UserPool
	travelpostTable: Table
	identityPool: IdentityPool
}

export function createAppSyncAPI(scope: Construct, props: AppSyncAPIProps) {
	const api = new awsAppsync.GraphqlApi(scope, 'APISamples', {
		name: `${props.namingPrefix}API`,
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
		`${props.namingPrefix}DataSource`,
		props.travelpostTable
	)

	api.grantQuery(
		props.identityPool.unauthenticatedRole,
		'getTravelPost',
		'listTravelPosts'
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

	const updateTravelPostFunction = new awsAppsync.AppsyncFunction(
		scope,
		'updateTravelPostFunction',
		{
			name: 'updateTravelPostFunction',
			api,
			dataSource: TravelPostDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/functions/Mutation.updateTravelPost.js')
			),
		}
	)

	const deleteTravelPostFunction = new awsAppsync.AppsyncFunction(
		scope,
		'deleteTravelPostFunction',
		{
			name: 'deleteTravelPostFunction',
			api,
			dataSource: TravelPostDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/functions/Mutation.deleteTravelPost.js')
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
	new awsAppsync.Resolver(scope, 'createTravelPostPipelineResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'createTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [createTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'getTravelPostPipelineResolver', {
		api,
		typeName: 'Query',
		fieldName: 'getTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [getTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'updateTravelPostPipelineResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'updateTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [updateTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'deleteTravelPostPipelineResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'deleteTravelPost',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [deleteTravelPostFunction],
	})

	new awsAppsync.Resolver(scope, 'listTravelPostsPipelineResolver', {
		api,
		typeName: 'Query',
		fieldName: 'listTravelPosts',
		code: awsAppsync.Code.fromInline(passThroughSteps),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [listTravelPostsFunction],
	})

	return api
}
