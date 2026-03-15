const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    const store = getStore("risingred");
    const data = await store.get("sitedata", { type: "json" });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data || {})
    };
  } catch (err) {
    console.log("get-data error:", err.message);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({})
    };
  }
};
