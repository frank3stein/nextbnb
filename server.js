const express = require("express");
const next = require("next");
const bodyParser = require("body-parser");
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sequelize = require("./model.js").sequelize;
const sessionStore = new SequelizeStore({
  db: sequelize
});
const User = require("./model.js").User;
// sessionStore.sync(); // you need to run this just once so the table is created.
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async function(email, password, done) {
      if (!email || !password) {
        done("Email and password required", null);
        return;
      }

      // Here we use Promise.all as we want to optimize the speed of our logged in users.
      // Since user.isPasswordValid is dependent on the previous promise we can not use this
      // const [user, valid] = await Promise.all([
      //   User.findOne({ where: { email: email } }),
      //   user.isPasswordValid(password)
      // ]);

      const user = await User.findOne({ where: { email: email } });

      if (!user) {
        done("User not found", null);
        return;
      }

      const valid = await user.isPasswordValid(password);

      if (!valid) {
        done("Email and password do not match", null);
        return;
      }

      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  User.findOne({ where: { email: email } }).then(user => {
    done(null, user);
  });
});

nextApp.prepare().then(() => {
  const server = express();
  server.use(
    session({
      secret: "343ji43j4n3jn4jk3n", //enter a random string here
      resave: false,
      saveUninitialized: true,
      name: "nextbnb",
      cookie: {
        secure: false, //CRITICAL on localhost
        maxAge: 30 * 24 * 60 * 60 * 1000 //30 days
      },
      store: sessionStore
    }),
    passport.initialize(),
    passport.session(),
    bodyParser.json()
  );
  server.post("/api/auth/register", async (req, res) => {
    console.log(req.body);
    const { email, password, passwordConfirmation } = req.body;

    if (password === passwordConfirmation) {
      try {
        const user = await User.create({ email, password });
        req.login(user, err => {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: "error", message: err }));
            return;
          }

          return res.end(
            JSON.stringify({
              status: "success",
              message: "User added and logged in"
            })
          );
        });
      } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
          error = error.errors[0].message;
        }
        return res.end(
          JSON.stringify({
            status: "error",
            error
          })
        );
      }
    } else {
      console.log(password, passwordConfirmation);
      return res.end(
        JSON.stringify({
          status: "failed",
          message: " The passwords do not match, please try again"
        })
      );
    }

    server.post("/api/auth/logout", (req, res) => {
      req.logout();
      req.session.destroy();
      return res.end(
        JSON.stringify({ status: "success", message: "Logged out" })
      );
    });
  });

  server.post("/api/auth/login", async (req, res) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            status: "error",
            message: err
          })
        );
        return;
      }

      if (!user) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            status: "error",
            message: "No user matching credentials"
          })
        );
        return;
      }

      req.login(user, err => {
        if (err) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              status: "error",
              message: err
            })
          );
          return;
        }

        return res.end(
          JSON.stringify({
            status: "success",
            message: "Logged in"
          })
        );
      });
    })(req, res, next);
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`Ready on http://localhost:${port}`);
  });
});
