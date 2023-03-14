import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import { CfnOutput } from 'aws-cdk-lib'

type CreateTravelPicsBucketProps = {
	allowedOrigins: [string]
	authenticatedRole: iam.IRole
	unauthenticatedRole: iam.IRole
	bucketName: string
}

export function createTravelPicsBucket(
	scope: Construct,
	props: CreateTravelPicsBucketProps
) {
	const fileStorageBucket = new s3.Bucket(scope, 'SaaSImagesBucket', {
		bucketName: props.bucketName,
		cors: [
			{
				allowedMethods: [
					s3.HttpMethods.GET,
					s3.HttpMethods.POST,
					s3.HttpMethods.PUT,
					s3.HttpMethods.DELETE,
				],
				allowedOrigins: props.allowedOrigins,
				allowedHeaders: ['*'],
			},
		],
	})

	// Let Cloudinary read from the bucket
	const allowCloudinaryToReadFromBucket = new iam.PolicyStatement({
		sid: `AWSConsole-AccessLogs-Policy-${fileStorageBucket.bucketName}-cloudinary`,
		effect: iam.Effect.ALLOW,
		actions: ['s3:GetObject'],
		resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}/*`],
		principals: [new iam.AccountPrincipal('232482882421')],
	})

	fileStorageBucket.addToResourcePolicy(allowCloudinaryToReadFromBucket)

	// Let signed in users CRUD on a bucket
	const canReadUpdateDeleteFromPublicDirectory = new iam.PolicyStatement({
		effect: iam.Effect.ALLOW,
		actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
		resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}/public/*`],
	})

	const mangedPolicyForAmplifyAuth = new iam.ManagedPolicy(
		scope,
		'mangedPolicyForAmplifyAuth',
		{
			description:
				'managed Policy to allow usage of storage library for auth when users are signed in.',
			statements: [canReadUpdateDeleteFromPublicDirectory],
			roles: [props.authenticatedRole],
		}
	)

	return fileStorageBucket
}
