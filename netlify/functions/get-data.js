const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  try {
    const store = getStore({
      name: "risingred",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    const data = await store.get("sitedata", { type: "json" });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data || {})
    };
  } catch (err) {
    console.log("get-data error:", err.message);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    };
  }
};
