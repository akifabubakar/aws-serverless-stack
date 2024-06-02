const index = require("./index");
const moment = require("moment");

(async()=>{

  try {
		let queryStringParameters = {
				messageId:"campaign_id_91",
				// startdate: "2023-07-11T13:00:00+08:00",
      	// enddate: "2023-07-31T14:00:00+08:00"
			}
		await index.handler({queryStringParameters});
		// console.log(moment("2023-07-31T14:00:00+08:00").toISOString())
  } catch (error) {
		console.log("test error",error)
  }

})();