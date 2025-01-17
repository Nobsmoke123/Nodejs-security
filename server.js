const https = require("https");

const fs = require("fs");

const helmet = require("helmet");

const path = require("path");

require("dotenv").config();

const checkLoggedInMiddleware = require("./middleware");

const express = require("express");

const PORT = 4000;

const CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

const app = express();

app.use(helmet());

app.get("/auth/google", (req, res) => {});

app.get("/auth/google/callback", (req, res) => {});

app.get("/auth/logout", (req, res) => {});

app.get("/secret", checkLoggedInMiddleware, (req, res) => {
  return res.send("Your personal secret value is 42!");
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

https
  .createServer(
    {
      key: fs.readFileSync(path.join(__dirname, "key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

// Generate openssl certificate
// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

// openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365
