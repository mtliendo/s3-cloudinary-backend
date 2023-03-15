#!/usr/bin/env node

import { TravelStack } from '../lib/TravelStack'

import 'source-map-support/register'
import { initStack } from './createStack'
import { AmplifyHostingStack } from '../lib/AmplifyHostingStack'

initStack().then(({ app, stackNameWithEnv, stackProps, context }) => {
	const travelStack = new TravelStack(
		app,
		stackNameWithEnv,
		stackProps,
		context
	)

	const amplifyHostingStack = new AmplifyHostingStack(
		app,
		`${context.appName}-stack`,
		{
			userpoolClientId: travelStack.userpoolClientId,
			userpoolId: travelStack.userpoolId,
			identitypoolId: travelStack.identitypoolId,
			bucketName: travelStack.bucketName,
			appSyncAPIUrl: travelStack.appSyncAPIUrl,
		},
		context
	)
})
