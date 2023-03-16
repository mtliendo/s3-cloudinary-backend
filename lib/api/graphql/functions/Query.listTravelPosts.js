export function request(ctx) {
	const limit = ctx.args.limit || 20
	const nextToken = ctx.args.nextToken
	const scanUsersRequest = {
		version: '2018-05-29',
		operation: 'Scan',
		limit,
	}

	if (nextToken) {
		scanUsersRequest.nextToken = nextToken
	}
	return scanUsersRequest
}

export function response(ctx) {
	const response = ctx.result.items

	return response
}
