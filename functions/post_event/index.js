/* eslint-disable import/no-unresolved */
/* eslint-disable no-useless-escape */

// LIBRARY
const AWS = require("aws-sdk");
const { errorPayload, successPayload, throwError } = require("./utils");
const { v4:uuidv4 } = require("uuid");

// ENVIRONMENT
const { REGION, QUEUE_URL } = require("./config");

// AWS SERVICES
var sqs = new AWS.SQS({
    apiVersion: "2012-11-05",
    region: REGION,
});

/**
 * Function to process an incoming event from API Gateway by parsing its JSON body,
 * validating required fields, constructing a message, and sending it to an SQS queue.
 * If the message is successfully sent, it returns a success response.
 * If an error occurs, it catches the error and returns an appropriate error response.
 *
 * @param {Object} event           The event object containing the request details.
 * @returns {Object}               The response object with the result of the operation.
 */
exports.handler = async (event) => {
  try {
    console.log("EVENT", JSON.stringify(event));

    let jsonBody = JSON.parse(event.body);
    let { messageId = undefined, digitalId = `undefined_${uuidv4()}`, timestamp = new Date().toISOString(), source = 'PN', action = "open", readTime = undefined, leadId = ""} = jsonBody;

    if (messageId === undefined || messageId === "") {
        throw throwError("bad request");
    }

    let msgBody = {
        campaignId: messageId.toString(),
        timestamp,
        source,
        action,
        leadId
    };

    if (digitalId && digitalId !== "") {
        msgBody["digitalId"] = digitalId.toString();
    }

    if (readTime && readTime !== "") {
        msgBody.timestamp = readTime.toString();
    }

    var params = {
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(msgBody),
    };

    await sqs.sendMessage(params).promise();

    const response = await successPayload("data", { success: true });
    return response;
  } catch (error) {
    const response = await errorPayload(error.statusCode, error.message);
    return response;
  }
};
