var express = require("express");
var app = express();
app.use(express.json());
require("dotenv").config();

const PORT = process.env.PORT;

app.post("/", function (req, res) {
  res.send(req.body);
});

var server = app.listen(PORT, function () {
  var host = "localhost";

  console.log("Example app listening at http://%s:%s", host, PORT);
});
