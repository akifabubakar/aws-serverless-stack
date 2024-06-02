/* eslint-disable import/no-unresolved */
/* eslint-disable no-useless-escape */

// LIBRARY
const AWS = require("aws-sdk");
const moment = require("moment");

const { errorPayload, successPayload, throwError } = require("./utils");

// ENVIRONMENT
const {
  REGION,
  EVENT_TABLE_NAME,
} = require("./config");

// AWS SERVICES
const docClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: REGION,
});

/**
 * Constructs a response object containing event ID, count, and intervals.
 * 
 * @param {Object} params
 * @param {Array} params.data - Array of event data.
 * @param {string} params.startdate - The start date for the event query.
 * @param {string} params.enddate - The end date for the event query.
 * @param {string} params.gmt - The GMT offset for date formatting.
 * @returns {Object} - The response object.
 */
function eventIdResponse({data,startdate,enddate,gmt}){

	let resp = {
		Id: data?.[0]?.EventId || null,
		Count: data.length,
		StartInterval: null,
		EndInterval: null
	};

	if(startdate === "" || enddate === ""){
		data?.forEach(({Timestamp})=>{

			if(resp.StartInterval == null){
				resp.StartInterval = Timestamp;
			}
	
			if(resp.EndInterval == null){
				resp.EndInterval = Timestamp;
			}
	
			resp.StartInterval = moment(Timestamp).isBefore(moment(resp.StartInterval)) ? moment(Timestamp) : moment(resp.StartInterval);
			resp.EndInterval = moment(Timestamp).isAfter(moment(resp.EndInterval)) ? moment(Timestamp) : moment(resp.EndInterval);
		})

		resp.StartInterval = moment(resp.StartInterval).utcOffset(gmt).format();
		resp.EndInterval = moment(resp.EndInterval).utcOffset(gmt).format();
	}

	if(startdate !== ""){
		resp.StartInterval = moment(startdate).utcOffset(gmt).format();
	}
		
	if(enddate !== ""){
		resp.EndInterval = moment(enddate).utcOffset(gmt).format();
	}
		
  return resp;
}

/**
 * function to handle incoming events, validate and query event data,
 * and return a structured response.
 *
 * @param {Object} event - The event object containing request details.
 * @returns {Object} - The response object with event data.
 */
exports.handler = async (event) => {
  try {
    let { queryStringParameters = {} } = event;

    let {
      messageId = "",
      digitalId = "",
      gmt = "+08:00",
			startdate,
			enddate,
			action = "open"
    } = queryStringParameters;

    if (messageId == "" && digitalId == "") {
      throw throwError("bad request");
    }

		let data = await queryEventId({messageId,startdate,enddate,gmt});

    const response = await successPayload("data", data);
    // console.log('RESPONSE >>>', JSON.stringify({...response,body:data},'',2));
    return data, response;
  } catch (error) {
    console.log(error);
    const response = await errorPayload(error.statusCode, error.message);
    return response;
  }
};

async function queryEventId({ messageId = "", startdate = "", enddate = "", gmt }){

	let params = {};
	let resp = {};
	let query;
	let allItems = [];

	let hkey = `${messageId}`;
	let table = EVENT_TABLE_NAME;
	let index = "EventId-Index";

	do{

		params = {
			TableName: table,
			IndexName: index,
			KeyConditionExpression: 'EventId = :hkey',
			ExpressionAttributeValues: {
				':hkey': hkey
			},
			Limit: 1
		};
		
		if(query?.LastEvaluatedKey){
			params['ExclusiveStartKey'] = query.LastEvaluatedKey;
		}
		
		if(startdate !== "" && enddate !== ""){
			
			params.ExpressionAttributeValues[':startdate']  = moment(startdate).toISOString();
			params.ExpressionAttributeValues[':enddate'] = moment(enddate).toISOString();
			params.KeyConditionExpression += ` and #timestamp BETWEEN :startdate AND :enddate`;
			params['ExpressionAttributeNames'] = {
				"#timestamp": "Timestamp"
			}
		}else{

			if(startdate !== ""){
				params.ExpressionAttributeValues[':startdate'] = moment(startdate).toISOString();
				params.KeyConditionExpression += ` and #timestamp >= :startdate`;
				params['ExpressionAttributeNames'] = {
					"#timestamp": "Timestamp"
				}
			}
		
			if(enddate !== ""){
				params.ExpressionAttributeValues[':enddate'] = moment(enddate).toISOString();
				params.KeyConditionExpression += ` and #timestamp <= :enddate`;
				params['ExpressionAttributeNames'] = {
					"#timestamp": "Timestamp"
				}
			}
		}

		query = await docClient.query(params).promise();

		allItems.push(...query.Items);
		
	}while( query?.LastEvaluatedKey !== undefined );
	
	if(allItems.length > 0){
		resp = eventIdResponse({data:allItems,startdate,enddate,gmt});
	}

	console.log(resp)
	return resp;
}
