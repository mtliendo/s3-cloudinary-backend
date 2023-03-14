import { Construct } from 'constructs'
import * as awsDynamodb from 'aws-cdk-lib/aws-dynamodb'
import { RemovalPolicy } from 'aws-cdk-lib'

type TravelTableProps = {
	tableName: string
}
export function createTravelTable(
	scope: Construct,
	props: TravelTableProps
): awsDynamodb.Table {
	const travelTable = new awsDynamodb.Table(scope, 'TravelTable', {
		tableName: props.tableName,
		removalPolicy: RemovalPolicy.DESTROY,
		billingMode: awsDynamodb.BillingMode.PAY_PER_REQUEST,
		partitionKey: { name: 'id', type: awsDynamodb.AttributeType.STRING },
	})

	return travelTable
}
