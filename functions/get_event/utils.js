exports.throwError = (message) => {
  const payload = {
    statusCode: 400,
    message,
  };
  return payload;
}
exports.errorPayload = (statusCode, message) => {
  const payload = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'x-amzn-ErrorType': statusCode,
    },
    isBase64Encoded: false,
    body: JSON.stringify({
      message,
      statusCode,
     }),
  };

  return payload;
}

exports.successPayload = (type, input, message) => {
  let body = {};
  switch (type) {
     case 'data':
        body = { data: input, statusCode: 200 };
        if (message !== undefined) {
          body.message = message;
        }
        break;
     case 'message':
        body = { message: input, statusCode: 200 };
        break;
     default:
        break;
  }

  const payload = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };

  return payload;
}