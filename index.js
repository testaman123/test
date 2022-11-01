var express = require("express");
const axios = require("axios");
var app = express();
const path = require("path");
app.use(express.json());
require("dotenv").config();
const PORT = process.env.PORT;
const SalesForceAPI = require("./Services/SalesForceAPI");
// Enter the Page Access Token from the previous step
let FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
let pageTokenObject = {};

//Facebook Login Page to generate access token and grant page access

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/html_pages/loginToFacebook.html"));
});

app.get("/healthz", (req, res) => {
  res.send("App is working fine");
});
//Privacy Policy page

app.get("/privacy-policy", (req, res) => {
  res.sendFile(path.join(__dirname + "/html_pages/privacy-policy.html"));
});

// Api to generate Facebook Page access token that never expires

app.post("/generateLongLivePageAccessToken", async (req, res) => {
  console.log(req.body);
  //generate long live user access token
  try {
    let { data: userTokendata } = await axios.get(
      process.env.FACEBOKK_GRAPH_API_URL +
        `/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOKK_APP_ID}&client_secret=${process.env.FACEBOKK_APP_SECRET}&fb_exchange_token=${req.body.access_token}`
    );
    console.log(userTokendata);
    let { data: pageTokendata } = await axios.get(
      process.env.FACEBOKK_GRAPH_API_URL +
        `/${req.body.app_user_id}/accounts?access_token=${userTokendata.access_token}`
    );
    pageTokendata.data.forEach((singlePage) => {
      pageTokenObject[singlePage.id] = singlePage.access_token;
    });
    console.log(pageTokenObject);
    res.send({ message: "Page Token Generated Successfully." });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

// GET /webhook
app.get("/webhook", (req, res) => {
  // Facebook sends a GET request
  // To verify that the webhook is set up
  // properly, by sending a special challenge that
  // we need to echo back if the "verify_token" is as specified
  if (req.query["hub.verify_token"] === "abc123") {
    res.send(req.query["hub.challenge"]);
    return;
  }
});

// POST /webhook
app.post("/webhook", async (req, res) => {
  // Facebook will be sending an object called "entry" for "leadgen" webhook event
  if (!req.body.entry) {
    return res.status(500).send({ error: "Invalid POST data received" });
  }

  // Travere entries & changes and process lead IDs
  for (const entry of req.body.entry) {
    for (const change of entry.changes) {
      // Process new lead (leadgen_id)
      console.log(change);
      await processNewLead(change.value.leadgen_id, change.value.page_id);
    }
  }

  // Success
  res.send({ success: true });
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

// Process incoming leads
async function processNewLead(leadId, pageId) {
  let response;

  try {
    // Get lead details by lead ID from Facebook API
    response = await axios.get(
      `${process.env.FACEBOKK_GRAPH_API_URL}/${leadId}/?access_token=${pageTokenObject[pageId]}`
    );
  } catch (err) {
    // Log errors
    return console.warn(
      `An invalid response was received from the Facebook API:`,
      err.response.data ? JSON.stringify(err.response.data) : err.response
    );
  }

  // Ensure valid API response returned
  if (
    !response.data ||
    (response.data && (response.data.error || !response.data.field_data))
  ) {
    return console.warn(
      `An invalid response was received from the Facebook API: ${response}`
    );
  }

  // Lead fields
  const leadForm = [];
  let leadObject = {};

  // Extract fields
  let emailPattern = /mail/gi;
  let phonePattern = /phone/gi;
  let mobilePattern = /mobile/gi;
  let fullnamePattern1 = /full name/gi;
  let fullnamePattern2 = /fullname/gi;
  let firstnamePattern1 = /first name/gi;
  let firstnamePattern2 = /firstname/gi;
  let lastnamePattern1 = /last name/gi;
  let lastnamePattern2 = /lastname/gi;
  for (const field of response.data.field_data) {
    // Get field name & value
    const fieldName = field.name;
    const fieldValue = field.values[0];

    // Store in lead array

    if (emailPattern.test(fieldName)) {
      leadObject.Email = fieldValue;
    }
    if (phonePattern.test(fieldName) || mobilePattern.test(fieldName)) {
      leadObject.Phone = fieldValue;
    }
    if (fullnamePattern1.test(fieldName) || fullnamePattern2.test(fieldName)) {
      leadObject.Fullname = fieldValue;
    }
    if (
      firstnamePattern1.test(fieldName) ||
      firstnamePattern2.test(fieldName)
    ) {
      leadObject.Firstname = fieldValue;
    }
    if (lastnamePattern1.test(fieldName) || lastnamePattern2.test(fieldName)) {
      leadObject.Lastname = fieldValue;
    }
  }
  leadForm.push(leadObject);
  let object = new SalesForceAPI();
  await object.init();
  if (leadForm.length) {
    var pushedResponse = await object.putDataExtension(
      "50D4FF24-4E44-4222-BD2F-51CFB34F9EF3",
      leadForm
    );
    console.log(pushedResponse);
  }

  // Implode into string with newlines in between fields
  // const leadInfo = leadForm.join("\n");

  // Log to console
  console.log("A new lead was received!\n", leadObject);

  // Use a library like "nodemailer" to notify you about the new lead
  //
  // Send plaintext e-mail with nodemailer
  // transporter.sendMail({
  //     from: `Admin <admin@example.com>`,
  //     to: `You <you@example.com>`,
  //     subject: 'New Lead: ' + name,
  //     text: new Buffer(leadInfo),
  //     headers: { 'X-Entity-Ref-ID': 1 }
  // }, function (err) {
  //     if (err) return console.log(err);
  //     console.log('Message sent successfully.');
  // });
}
