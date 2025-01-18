const https = require("https");

const fs = require("fs");

const helmet = require("helmet");

const path = require("path");

const passport = require("passport");

const { Strategy } = require("passport-google-oauth20");

const cookieSession = require("cookie-session");

require("dotenv").config();

const checkLoggedInMiddleware = require("./middleware");

const express = require("express");

const PORT = 4000;

const CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: "/auth/google/callback",
  clientID: CONFIG.CLIENT_ID,
  clientSecret: CONFIG.CLIENT_SECRET,
};

const verifyCallback = (accessToken, refreshToken, profile, done) => {
  console.log(`Google profile`, profile);
  done(null, profile);
};

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

// Save the session to the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Read the session from the cookie
passport.deserializeUser((id, done) => {
  // Do a database lookup for the ID.
  //   User.findById(id).then((user) => {
  //     done(null, user);
  //   });
  done(null, id);
});

const app = express();

app.use(helmet());

app.use(
  cookieSession({
    secure: true,
    name: "node-security-session",
    maxAge: 24 * 60 * 60 * 1000, // in milliseconds
    keys: [CONFIG.COOKIE_KEY_1, CONFIG.COOKIE_KEY_2],
  })
);

// register regenerate & save after the cookieSession middleware initialization
app.use(function (request, response, next) {
  if (request.session && !request.session.regenerate) {
    request.session.regenerate = (cb) => {
      cb();
    };
  }
  if (request.session && !request.session.save) {
    request.session.save = (cb) => {
      cb();
    };
  }
  next();
});

app.use(passport.initialize());

// Authenticates the session and validates the session
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failure",
    successRedirect: "/",
    // session: true,
  })
);

app.get("/failure", (req, res) => {
  return res.send("Failed to log in!");
});

app.get("/auth/logout", (req, res) => {
  // Exposed on the req object by passport
  req.logout(
    {
      keepSessionInfo: false,
    },
    (err) => {}
  );
  return res.redirect("/");
});

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
