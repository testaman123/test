const axois = require("axios");

class SalesForceAPI {
  constructor() {}

  async init() {
    let auth_url = process.env.SALESFORCE_AUTH_DOMAIN;
    let auth_payload = {
      grant_type: "client_credentials",
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      account_id: process.env.SALESFORCE_CLIENT_ACCOUNT_ID,
      scope: "data_extensions_write data_extensions_read email_send",
    };
    await axois.post(`${auth_url}/v2/token`, auth_payload).then((response) => {
      console.log(response.data);
      let data = response.data;
      this.access_token = data.access_token;
    });
  }

  async postDataExtension(de_key, data) {
    let config = {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    };
    let post_payload = {
        items: data,
      },
      url = `https://mcth0p8dvlxbnn7xkd7td87g9jz4.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:${de_key}/rows`;
    await axois
      .post(url, post_payload, config)
      .then((response) => {
        console.log(response.data);
      })
      .catch((e, error) => {
        console.log("response", e);
        console.log(error);
      });
    return "post object";
  }

  async putDataExtension(de_key, data) {
    let config = {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    };
    let post_payload = {
        items: data,
      },
      url = `https://mcth0p8dvlxbnn7xkd7td87g9jz4.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:${de_key}/rows`;

    await axois
      .put(url, post_payload, config)
      .then((response) => {
        console.log(response.data);
      })
      .catch((e, error) => {
        console.log("response", e);
        console.log(error);
      });
    return "put object";
  }

  async TriggeredDataExtension(de_key, data) {
    let config = {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    };
    let post_payload = data,
      url = `https://mcth0p8dvlxbnn7xkd7td87g9jz4.rest.marketingcloudapis.com/messaging/v1/messageDefinitionSends/key:${de_key}/send`;

    await axois
      .post(url, post_payload, config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((e, error) => {
        console.log("response", e);
        console.log(error);
      });
    return "put object";
  }
}

module.exports = SalesForceAPI;
