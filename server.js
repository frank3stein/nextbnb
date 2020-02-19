const express = require("express");
const next = require("next");
const bodyParser = require("body-parser");
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sequelize = require("./database.js");
const sessionStore = new SequelizeStore({
  db: sequelize
});
const Op = require("sequelize").Op;
const User = require("./models/user.js");
const House = require("./models/house");
const Review = require("./models/review");
const Booking = require("./models/booking");
const dotenv = require("dotenv");

dotenv.config();
sessionStore.sync(); // you need to run this just once so the table is created.
// Run the below code once so that the database is updated.
// House.sync();
// Review.sync();

// If you want to update the models and want the changes to be reflected
House.sync({ alter: true });
Review.sync({ alter: true });
User.sync({ alter: true });
Booking.sync({ alter: true });

const getDatesBetweenDates = (startDate, endDate) => {
  let dates = [];
  while (startDate < endDate) {
    dates = [...dates, new Date(startDate)];
    startDate.setDate(startDate.getDate() + 1);
  }
  dates = [...dates, endDate];
  return dates;
};

const canBookThoseDates = async (houseId, startDate, endDate) => {
  const results = await Booking.findAll({
    where: {
      houseId: houseId,
      startDate: {
        [Op.lte]: new Date(endDate)
      },
      endDate: {
        [Op.gte]: new Date(startDate)
      }
    }
  });
  return !(results.length > 0);
};

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
    bodyParser.json({
      verify: (req, res, buf) => {
        //make rawBody available
        req.rawBody = buf;
      }
    })
  );

  server.get("/api/houses", (req, res) => {
    House.findAndCountAll().then(result => {
      const houses = result.rows.map(house => {
        return Review.findAndCountAll({
          where: {
            houseId: house.id
          }
        }).then(reviews => {
          house.dataValues.reviewsCount = reviews.count;
          house.dataValues.reviews = reviews.rows.map(review => {
            return review.dataValues;
          });
          return house.dataValues;
        });
      });
      Promise.all(houses).then(houses => {
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify(houses));
      });
    });
  });

  server.get("/api/houses/:id", (req, res) => {
    const { id } = req.params;

    House.findByPk(id).then(house => {
      if (house) {
        Review.findAndCountAll({
          where: {
            houseId: house.id
          }
        }).then(reviews => {
          house.dataValues.reviews = reviews.rows.map(review => {
            return review.dataValues;
          });
          house.dataValues.reviewsCount = reviews.count;
          res.writeHead(200, {
            "Content-Type": "application/json"
          });
          res.end(JSON.stringify(house.dataValues));
        });
      } else {
        res.writeHead(404, {
          "Content-Type": "application/json"
        });
        res.end(
          JSON.stringify({
            message: `Not found`
          })
        );
      }
    });
  });

  server.post("/api/auth/register", async (req, res) => {
    // console.log(req.body);
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

  server.post("/api/houses/check", async (req, res) => {
    let message = "free";
    const isBookable = await canBookThoseDates(
      req.body.houseId,
      req.body.startDate,
      req.body.endDate
    );
    if (!isBookable) {
      message = "busy";
    }

    res.json({
      status: "success",
      message: message
    });
  });

  server.post("/api/houses/reserve", async (req, res) => {
    console.log(req);
    if (!req.session.passport) {
      res.writeHead(403, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify({
          status: "error",
          message: "Unauthorized"
        })
      );

      return;
    }
    const isBookable = await canBookThoseDates(
      req.body.houseId,
      req.body.startDate,
      req.body.endDate
    );

    if (!isBookable) {
      res.writeHead(500, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify({
          status: "error",
          message: "House is already booked"
        })
      );
    }

    const userEmail = req.session.passport.user;

    User.findOne({ where: { email: userEmail } }).then(user => {
      Booking.create({
        houseId: req.body.houseId,
        userId: user.id,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        sessionId: req.body.sessionId
      }).then(() => {
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify({ status: "success", message: "ok" }));
      });
    });
  });

  server.post("/api/houses/booked", async (req, res) => {
    const { houseId } = req.body;

    const results = await Booking.findAll({
      where: {
        houseId: houseId,
        endDate: {
          [Op.gte]: new Date()
        }
      }
    });

    let bookedDates = [];

    for (const result of results) {
      const dates = getDatesBetweenDates(
        new Date(result.startDate),
        new Date(result.endDate)
      );

      bookedDates = [...bookedDates, ...dates];
    }

    //remove duplicates
    bookedDates = [...new Set(bookedDates.map(date => date))];

    res.json({
      status: "success",
      message: "ok",
      dates: bookedDates
    });
  });

  server.post("/api/stripe/session", async (req, res) => {
    const amount = req.body.amount;

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          name: "Booking house on NextBnb",
          amount: amount * 100,
          currency: "usd",
          quantity: 1
        }
      ],
      success_url: process.env.BASE_URL + "/bookings",
      cancel_url: process.env.BASE_URL + "/bookings"
    });

    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(
      JSON.stringify({
        status: "success",
        sessionId: session.id,
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY
      })
    );
  });

  server.post("/api/stripe/webhook", async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      res.writeHead(400, {
        "Content-Type": "application/json"
      });
      console.error(err.message);
      res.end(
        JSON.stringify({
          status: "success",
          message: `Webhook Error: ${err.message}`
        })
      );
      return;
    }

    if (event.type === "checkout.session.completed") {
      const sessionId = event.data.object.id;

      try {
        Booking.update({ paid: true }, { where: { sessionId } });
      } catch (err) {
        console.error(err);
      }
    }

    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({ received: true }));
  });

  // need to call this to clean the unpaid bookings so others can book them.
  server.post("/api/bookings/clean", (req, res) => {
    Booking.destroy({
      where: {
        paid: false
      }
    });

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        status: "success",
        message: "ok"
      })
    );
  });

  server.get("/api/bookings/list", async (req, res) => {
    if (!req.session.passport || !req.session.passport.user) {
      res.writeHead(403, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify({
          status: "error",
          message: "Unauthorized"
        })
      );

      return;
    }

    const userEmail = req.session.passport.user;
    const user = await User.findOne({ where: { email: userEmail } });

    Booking.findAndCountAll({
      where: {
        paid: true,
        userId: user.id,
        endDate: { [Op.gte]: new Date() }
      },
      order: [["startDate", "ASC"]]
    }).then(async result => {
      const bookings = await Promise.all(
        result.rows.map(async booking => {
          const data = {};
          data.booking = booking.dataValues;
          data.house = (await House.findByPk(data.booking.houseId)).dataValues;
          return data;
        })
      );

      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(bookings));
    });
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`Ready on http://localhost:${port}`);
  });
});
