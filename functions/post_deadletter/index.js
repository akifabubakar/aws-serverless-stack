/**
 * function to log dead-letter queue (DLQ) error messages to CloudWatch.
 *
 * @param {Object} event - The event object containing the DLQ message.
 * @returns {Object} - An empty response object.
 */
exports.handler = async (event) => {
    console.log("EVENT", JSON.stringify(event,"",2));
    return {}
}