import { Construct } from 'constructs'
import * as awsCognito from 'aws-cdk-lib/aws-cognito'
import {
	IdentityPool,
	UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha'

type CreateTravelUserpool = {
	namingPrefix: string
}
export function createTravelUserpool(
	scope: Construct,
	props: CreateTravelUserpool
) {
	const userPool = new awsCognito.UserPool(scope, `ProductUserpool`, {
		selfSignUpEnabled: true,
		accountRecovery: awsCognito.AccountRecovery.PHONE_AND_EMAIL,
		userVerification: {
			emailStyle: awsCognito.VerificationEmailStyle.CODE,
		},
		autoVerify: {
			email: true,
		},
		standardAttributes: {
			email: {
				required: true,
				mutable: true,
			},
		},
	})
	const userPoolClient = new awsCognito.UserPoolClient(
		scope,
		`${props.namingPrefix}UserpoolClient`,
		{ userPool }
	)

	const identityPool = new IdentityPool(
		scope,
		`${props.namingPrefix}IdentityPool`,
		{
			identityPoolName: `${props.namingPrefix}IdentityPool`,
			allowUnauthenticatedIdentities: true,
			authenticationProviders: {
				userPools: [
					new UserPoolAuthenticationProvider({
						userPool: userPool,
						userPoolClient: userPoolClient,
					}),
				],
			},
		}
	)
	return { userPool, userPoolClient, identityPool }
}
