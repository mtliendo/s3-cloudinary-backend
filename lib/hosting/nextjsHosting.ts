import { SecretValue } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import {
	App,
	Branch,
	GitHubSourceCodeProvider,
	RedirectStatus,
} from '@aws-cdk/aws-amplify-alpha'
import { CfnApp } from 'aws-cdk-lib/aws-amplify'
import {
	Effect,
	ManagedPolicy,
	PolicyDocument,
	PolicyStatement,
	Role,
	ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'

type NextJSHostingProps = {
	owner: string
	appName: string
	repository: string
	branchName: string
	githubOauthTokenName: string
	environmentVariables: { [s: string]: string }
}

export function createNextJSHosting(
	scope: Construct,
	props: NextJSHostingProps
): App {
	const deployRole = new Role(
		scope,
		`TravelAmplifyAppRole-${props.environmentVariables.environment}`,
		{
			assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
		}
	)
	// Attach an existing managed policy to the new IAM role
	const managedPolicy = ManagedPolicy.fromAwsManagedPolicyName(
		'AdministratorAccess-Amplify'
	)
	deployRole.addManagedPolicy(managedPolicy)

	const amplifyApp = new App(scope, 'TravelAmplifyApp', {
		appName: props.appName,
		role: deployRole,
		sourceCodeProvider: new GitHubSourceCodeProvider({
			owner: props.owner,
			repository: props.repository,
			oauthToken: SecretValue.secretsManager(props.githubOauthTokenName),
		}),
		autoBranchDeletion: true,
		customRules: [
			{
				source: '/<*>',
				target: '	/index.html',
				status: RedirectStatus.NOT_FOUND_REWRITE,
			},
		],
		buildSpec: codebuild.BuildSpec.fromObjectToYaml({
			version: 1,
			frontend: {
				phases: {
					preBuild: {
						commands: [
							'echo HELLOOOOO',
							'aws appsync get-graphql-api --api-id tfree3uifrfdtjuxkrb5awcj5m --query "graphqlApi.apiId"',
							'npm ci',
						],
					},
					build: {
						commands: [
							'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$cloudinaryCloudName \
							NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER=$cloudinaryUploadFolder \
							NEXT_PUBLIC_appSyncURL=$appSyncURL \
							NEXT_PUBLIC_bucket=$bucket \
							NEXT_PUBLIC_identityPoolId=$identityPoolId \
							NEXT_PUBLIC_region=$region \
							NEXT_PUBLIC_userPoolWebClientId=$userPoolWebClientId \
							NEXT_PUBLIC_userpoolId=$userpoolId \
							npm run build',
						],
					},
				},
				artifacts: {
					baseDirectory: '.next',
					files: ['**/*'],
				},
				cache: {
					paths: ['node_modules/**/*'],
				},
			},
		}),
	})

	const prodBranch = amplifyApp.addBranch('main', {
		stage: 'PRODUCTION',
	})

	const devBranch = amplifyApp.addBranch('develop', {
		stage: 'DEVELOPMENT',
	})

	const addEnvVars = (
		envVars: { [s: string]: string },
		amplifyBranch: Branch
	) => {
		Object.entries(envVars).forEach(([key, val]) => {
			amplifyBranch.addEnvironment(key, val)
		})
	}

	addEnvVars(
		props.environmentVariables,
		props.branchName === 'develop' ? devBranch : prodBranch
	)

	//Drop down to L1 to allow new NextJS architecture
	const cfnAmplifyApp = amplifyApp.node.defaultChild as CfnApp
	cfnAmplifyApp.platform = 'WEB_COMPUTE'

	return amplifyApp
}
