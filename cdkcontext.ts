export type CDKContext = {
	appName: string
	appDescription: string
	region: string
	environment: string
	branchName: string
	s3AllowedOrigins: [string]
	repoOwner: string
	repoName: string
	githubOauthTokenName: string
	cloudinaryCloudName: string
	cloudinaryUploadFolder: string
}
