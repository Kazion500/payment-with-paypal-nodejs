require("dotenv").config();
const { client, checkoutNodeJssdk } = require("./paypalConfig");
const express = require("express");
const path = require("path");
const PORT = 5000;
const app = express();

app.use(express.json());
app.get("/", async (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.post("/payments", async (req, res) => {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  console.log(req.body);
  request.prefer("return=representation");

  request.requestBody({
    intent: "AUTHORIZE",

    purchase_units: [
      {
        amount: {
          currency_code: "USD",

          value: "220.00",
        },
      },
    ],
    application_context: {
      brand_name: "Kazion",
      user_action: "PAY_NOW",
      return_url: "http://127.0.0.1:5000/payments/success",
      cancel_url: "http://127.0.0.1:5000/payments/cancel",
    },
  });
  let order;

  try {
    order = await client().execute(request);
  } catch (err) {
    console.error(err);

    return res.send(500);
  }

  order?.result?.links.forEach((link) => {
    if (link.rel === "approve") {
      res.redirect(link.href);
    }
  });
});

app.get("/payments/success", async (req, res) => {
  const orderID = req.query.token;
  const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderID);

  request.requestBody({});

  try {
    const capture = await client().execute(request);
  } catch (err) {
    console.error(err);

    return res.sendStatus(500);
  }
  res.sendFile(path.resolve(__dirname, "success.html"));
});

app.listen(PORT, () => console.log("Backend Running on port: " + PORT));
