#!/usr/bin/env node

import { TravelStack } from '../lib/TravelStack'
import 'source-map-support/register'
import { initStack } from './initStack'
import { AmplifyHostingStack } from '../lib/AmplifyHostingStack'

const { app, stackNameWithEnv, stackProps, context } = initStack()

// Function to create common stack properties
const createCommonStackProps = (stackName: string) => ({
	env: {
		region: context.region,
	},
	stackName: `${context.appName}${stackName}`,
	tags: {
		Environment: context.environment,
	},
})

const travelStack = new TravelStack(app, stackNameWithEnv, stackProps, context)
const amplifyHostingStackProps = createCommonStackProps('-hosting-stack')

const amplifyHostingStack = new AmplifyHostingStack(
	app,
	amplifyHostingStackProps.stackName,
	{
		...amplifyHostingStackProps,
		userpoolClientId: travelStack.userpoolClientId,
		userpoolId: travelStack.userpoolId,
		identitypoolId: travelStack.identitypoolId,
		bucketName: travelStack.bucketName,
		appSyncAPIUrl: travelStack.appSyncAPIUrl,
	},
	context
)
