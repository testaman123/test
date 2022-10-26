var express = require("express");
var app = express();
app.use(express.json());

app.post("/", function (req, res) {
  res.send(req.body);
});

var server = app.listen(8081, function () {
  var host = "localhost";
  var port = "8081";

  console.log("Example app listening at http://%s:%s", host, port);
});
