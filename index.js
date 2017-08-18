require("dotenv").config();
var extend = require("extend");
var WebSocket = require("ws");
var fetch = require("node-fetch");
var querystring = require("querystring");

console.log(process.env);

getApi = async (method, data) => {
  // Merge data with TOKEN
  var params = extend(data || {}, { token: process.env.TOKEN });
  // Stringify data
  var postData = querystring.stringify(params);
  // Use the fetch API to call the data
  var resp = await fetch("https://slack.com/api/" + method + "?" + postData, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
    }
  }).then(function(res) {
    // Parse JSON
    return res.json();
  });
  // Return Data
  return resp;
};

// Check to see if the message is banned
bannedMessage = message => {
  ////////////////////////////////
  /// List of banned substring ///
  var banned = [
    "DEV TEAM OFF LOADS",
    "DEVELOPERS in SECRET",
    "rip off from BYTEBALL"
  ];
  // Use SOME to see if the message contains any of the banned substrings
  return banned.some(text => {
    // Escape the function if Text doesn't exist
    if (typeof message.text === "string") {
      // Substring search the message text against the array of banned strings
      return ~message.text.toLowerCase().indexOf(text.toLowerCase());
    }
    return false;
  });
};

// Delete the Message
killMessage = message => {
  // Call the Message Delete function
  getApi("chat.delete", {
    channel: message.channel,
    ts: message.ts,
    as_user: true
  });
};

greetUser = userId => {
  getApi("im.open", {
    user: userId
  }).then(res => {
    let chanId = res.channel.id;

    return getApi("chat.postMessage", {
      channel: chanId,
      text: process.env.GREETING,
      parse: "full",
      as_user: "true"
    }).then(res => {});
  });
};

// Sorting function
sort = message => {
  if (message.type === "message" && bannedMessage(message)) {
    // Invoke message delete
    console.log("Killing message: " + JSON.stringify(message));
    killMessage(message);
  } else if(message.type === "team_join") {
    console.log("greeting: " + JSON.stringify(message.user));
    greetUser(message.user.id);
  }
};

///////////////////////////////
//////////////////////////////
// Start here!

// Invoke the function on start
(async () => {
  // Get the RTM Websocket URL
  var wsUrl = await getApi("rtm.connect");
  // Setup the websocket connection
  var socket = new WebSocket(wsUrl.url);
  // On message invoke the sort function
  socket.on("open", args => {
    console.log("WS opened");
  });
  socket.on("close", args => {
    console.log("WS closed");
  });
  socket.on("message", json => {
    // Parse Message Data
    var message = JSON.parse(json);
    sort(message);
  });
})();

// Useless at the moment but required
module.exports = (req, res) => {
  res.end("Welcome to Micro");
};
