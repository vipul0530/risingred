const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const { password } = JSON.parse(event.body);
    const correctPw = process.env.ADMIN_PASSWORD || "risingred2026";
    if (password !== correctPw) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const store = getStore({
      name: "risingred",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    const contacts = await store.get("contacts", { type: "json" }) || [];
    return { statusCode: 200, headers, body: JSON.stringify(contacts) };
  } catch (err) {
    console.log("get-contacts error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
