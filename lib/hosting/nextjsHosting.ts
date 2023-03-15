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
	const amplifyApp = new App(scope, 'TravelAmplifyApp', {
		appName: props.appName,
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
						commands: ['npm ci'],
					},
					build: {
						commands: [
							'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
							'NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER = $NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER',
							'appSyncURL = $appSyncURL',
							'bucket = $bucket',
							'identityPoolId = $identityPoolId',
							'region = $region',
							'userPoolWebClientId = $userPoolWebClientId',
							'userpoolId = $userpoolId',
							'npm run build',
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
