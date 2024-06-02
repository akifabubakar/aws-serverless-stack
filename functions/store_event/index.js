const AWS = require("aws-sdk");
const { v4:uuidv4 } = require("uuid");

// ENVIRONMENT
const {
	REGION,
	EVENT_TABLE_NAME
} = require("./config");

// AWS SERVICES
const dcoClient = new AWS.DynamoDB.DocumentClient({
	apiVersion: '2012-08-10',
	region: REGION
});

/**
 * function to process SQS messages, parse the content, and write to DynamoDB.
 *
 * @param {Object} event - The event object containing SQS messages.
 * @param {Object} context - The context object containing runtime information.
 * @returns {Object} - An object containing batch item failures.
 */
exports.handler = async (event, context) => {
	console.log("EVENT >>>", JSON.stringify(event, "", 2));

	const batchItemFailures = [];
	let bodies = [];

	// Get records from sqs queue
	await Promise.allSettled(
		event?.Records?.map(async (record) => {
			const body = record.body;
			try {
				let jsonBody = JSON.parse(body);
				let {campaignId = undefined, digitalId = `undefined_${uuidv4()}`, timestamp = new Date().toISOString(), source = 'PN', action = "open", readTime = undefined, leadId = ""} = jsonBody;

				if(readTime){
					timestamp = readTime;
				}

				if(campaignId){
					bodies.push({campaignId, digitalId, timestamp, source, action, leadId});
				}
				
			} catch (e) {
				console.log(`Error in processing SQS consumer: ${body}`);
				batchItemFailures.push({ itemIdentifier: record.messageId });
			}
		})
	);
	

	// 25 requests per API call
	let requests = [];
	let promises = [];

	const endOfDay = new Date()
	endOfDay.setUTCHours(23, 59, 59, 999);
	let endOfDayStr = endOfDay.toISOString();

	bodies.forEach((body,index)=>{

		let requestIdx = Math.floor(index / 25)

		if(!requests[requestIdx]){
			requests[requestIdx] = [];
		}

		let {campaignId, digitalId, timestamp, source, action, leadId} = body;

		// set campaign status: read, converted
		let status = action == 'open' ? 'read' : 'converted';

		let pk = `${campaignId}:${digitalId}`;
		let sk = timestamp;

		let eventStatus = `${campaignId}:${status}`;

		let putreq = {
			PutRequest: {
				Item:{
					EventUser: pk,
					Timestamp: sk,
					EventId: campaignId,
					DigitalId: digitalId,
					Source: source,
					Action: action,
					Status: status,
					LeadId: leadId,
					EventStatus: eventStatus,
					ExportDate: endOfDayStr
				}
			}
		}

		requests[requestIdx].push(putreq);
	})


	for (const request of requests) {
		promises.push(writeToDb(request));
	}
	
	let resp = await Promise.allSettled(promises);

	resp.forEach(({status,reason})=>{
		if(status == "rejected"){
			console.log(`Error writing to DB: ${reason}`);
		}
	})

	return { batchItemFailures };
};

const writeToDb = async (request) => {

	let params = {
		RequestItems:{}
	}

	params.RequestItems[EVENT_TABLE_NAME] = request;
	return dcoClient.batchWrite(params).promise();
}