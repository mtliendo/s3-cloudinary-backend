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
	NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string
	NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER: string
}
