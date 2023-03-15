import { SecretValue } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import {
	App,
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
	environmentVariables?: { [s: string]: string }
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
						commands: ['npm run build'],
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

	if (props.branchName === 'main' && props.environmentVariables) {
		Object.entries(props.environmentVariables).forEach(([key, val]) => {
			prodBranch.addEnvironment(key, val)
		})
	}

	if (props.branchName === 'develop' && props.environmentVariables) {
		Object.entries(props.environmentVariables).forEach(([key, val]) => {
			devBranch.addEnvironment(key, val)
		})
	}

	//Drop down to L1 to allow new NextJS architecture
	const cfnAmplifyApp = amplifyApp.node.defaultChild as CfnApp
	cfnAmplifyApp.platform = 'WEB_COMPUTE'

	return amplifyApp
}
