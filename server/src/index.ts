import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import session, { Session, SessionData } from "express-session";
import { GraphQLSchema } from "graphql";
import fs from "node:fs";
import { DataSource } from "typeorm";
import { AppDataSource } from "./data-source";
import { Device } from "./models/device";
import { GPSPosition } from "./models/position";
import { User } from "./models/user";
import { MutationRoot, QueryRoot } from "./schema/user";
import { Events } from "./models/events";
import { isInGeofence } from "./utils/map";
import { Geofences } from "./models/geofence";
import https from "node:https";

var passwordHash = require("password-hash");

const pgSession = require("connect-pg-simple")(session);
var bodyParser = require("body-parser");

dotenv.config({ debug: false });

export interface MyContext {
  db: DataSource;
  session: Session & SessionData;
}

const port = process.env.PORT || 4000;

const schema = new GraphQLSchema({
  query: QueryRoot,
  mutation: MutationRoot,
});

const sessionPool = require("pg").Pool;
const sessionDBaccess = new sessionPool({
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  // url: process.env.DB_URL,
  ssl: process.env.DB_URL
    ? {
        ca: fs.readFileSync(__dirname + "/ca.crt").toString(),
        rejectUnauthorized: false,
      }
    : undefined,
});

const sessionConfig = {
  store: new pgSession({
    pool: sessionDBaccess,
    tableName: "session",
    createTableIfMissing: true,
  }),
  name: "SID",
  secret: "my_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // if true only transmit cookie over https
    httpOnly: false, // if true prevent client side JS from reading the cookie
    maxAge: 1000 * 60 * 60, // session max age in miliseconds
  },
};

export var app = express();

export let server: any = {};

app.use(
  cors({
    origin: "*",
  })
);

app.use(session(sessionConfig));
app.use(bodyParser.json());

export const serverPromise = new Promise((resolve, reject) => {
  AppDataSource.initialize()
    .then((ds) => {
      app.use("/api", (req, res) => {
        graphqlHTTP({
          schema: schema,
          graphiql: true,
          context: {
            db: ds,
            session: req.session,
          },
        })(req, res);
      });

      app.get("/session", (req, res) => {
        if (req.session.user) {
          res.send(req.session.user);
          return;
        }
        res.status(401).send("No session");
      });

      app.get("/logout", (req, res) => {
        req.session.user = null;
        res.send("OK");
      });

      app.post("/login", async (req, res) => {
        if (!req.body.email || !req.body.password) {
          res.status(401).send("Malformed data");
          return;
        }
        const user = await ds.manager.findOne(User, {
          where: { email: req.body.email },
        });

        if (!user) {
          res.status(401).send("User not found");
          return;
        }
        const isPasswordValid = passwordHash.verify(
          req.body.password,
          user?.password
        );
        // var hashedPassword = passwordHash.generate("sabrina1009");
        // console.info("O", hashedPassword);
        if (!isPasswordValid) {
          res.status(401).json({ error: "Username or Password not valid" });
          return;
        } else {
          if (!user.emailValidated) {
            res
              .status(401)
              .json({ error: "Please validate your email to login first" });
            return;
          }
          req.session.user = user;
          res.send(JSON.stringify(user));
        }
      });

      app.post("/validate", async (req, res) => {
        if (!req.body.token) {
          res.status(404).send("Malformed data");
          return;
        }
        const user = await ds.manager.findOne(User, {
          where: { emailValidationKey: req.body.token },
        });

        if (!user) {
          res.status(401).json({ error: "Token is not valid" });
          return;
        }
        user.emailValidated = true;
        user.emailValidationKey = undefined;
        const edited = await ds
          .createQueryBuilder()
          .update(User)
          .set({
            emailValidated: true,
            emailValidationKey: null,
          })
          .where("id = :id", { id: Number(user.id) })
          .execute();

        console.info(edited);
        res.sendStatus(200);
      });

      app.post("/gps", async (req, res) => {
        if (!req.session.user && !req.body.unsecure) {
          res.send("Not authenticated").status(401);
          return;
        }
        if (
          Number.isNaN(Number(req.body.latitude)) ||
          Number.isNaN(Number(req.body.longitude)) ||
          !req.body.device
        ) {
          res.status(401).send("Malformed data");
          return;
        }
        const newPoint = {
          latitude: Number(req.body.latitude),
          longitude: Number(req.body.longitude),
          timestamp: new Date(),
        };

        const device = await ds.manager.findOne(Device, {
          where: {
            id: Number(req.body.device),
          },
        });
        if (device) {
          if (req.session.user) {
            // const geofences = await ds.manager.find(Geofences, {
            //   relations: { events: true },
            //   where: { user: req.session.user },
            // });

            const geofences = await ds.manager.query(
              `select * from geofences g
               left join events e on e."geofenceId" = g.id
               left JOIN device d on d.id = e."deviceId"
               where d."userId" = $1;`,
              [req.session.user.id]
            );

            geofences.forEach(async (g) => {
              //Check if there is a geofence event
              // const event = await ds.manager.findOne(Events, {
              //   where: { device: device, geofence: g },
              // });
              const isGeofence = isInGeofence(newPoint, g, g.radius);
              if (g === null) {
                if (isGeofence) {
                  console.info("Creating new geofence event");
                  await ds.manager.insert(Events, {
                    device: device,
                    geofence: g,
                    status: "enter",
                  });
                  //No previous geofences, generating one
                }
                console.info("No geofence event for this device");
              } else {
                const toUpdate = !isGeofence && g.status === "enter";
                if (toUpdate) {
                  console.info("To update event");
                  const edited = await ds
                    .createQueryBuilder()
                    .update(Events)
                    .set({
                      status: isGeofence ? "enter" : "exit",
                    })
                    .where("id = :id", { id: Number(g.id) })
                    .execute();
                }
              }
            });
          }

          const inserted = await ds.manager.insert(GPSPosition, {
            latitude: newPoint.latitude,
            longitude: newPoint.longitude,
            timestamp: newPoint.timestamp,
            satellites: req.body.satellites ? Number(req.body.satellites) : -1,
            speed: req.body.speed ? Number(req.body.speed) : -1,
            accuracy: req.body.accuracy ? Number(req.body.accuracy) : -1,
            activity: req.body.activity,
            device: device,
          });
          res.send("OK");
        } else {
          res.send("DEVICE_NOT_FOUND").status(404);
        }
      });

      app.get("/healthz", (req, res) => {
        res.sendStatus(200);
      });

      app.post("/password-reset", async (req, res) => {
        if (!req.body.id || !req.body.password || !req.body.token) {
          res.status(401).send("Malformed data");
          return;
        }
        const user = await ds.manager.findOne(User, {
          where: { id: Number(req.body.id) },
        });

        if (!user) {
          res.status(401).send("User not found");
          return;
        }
        if (req.body.token !== user.emailValidationKey) {
          res.status(401).send("Token expired");
          return;
        }
        const edited = await ds
          .createQueryBuilder()
          .update(User)
          .set({
            password: passwordHash.generate(req.body.password),
            emailValidated: true,
            emailValidationKey: null,
          })
          .where("id = :id", { id: Number(user.id) })
          .execute();

        if (edited.affected && edited.affected > 0) {
          res.send(JSON.stringify(user));
        } else {
          res.status(401).json({ error: "Password update error" });
          return;
        }
      });

      app.get("/geofences", async (req, res) => {
        if (!req.session.user) {
          res.status(401).send("Not authenticated");
          return;
        }
        const user = await ds.manager.findOne(User, {
          where: { id: Number(req.session.user.id) },
        });

        if (!user) {
          res.status(401).send("User not found");
          return;
        }
        if (!user) return [];
        const geofences = await ds.manager.find(Geofences, {
          where: { user: user },
        });
        res.send(geofences);
      });

      app.post("/sync", async (req, res) => {
        if (!req.session.user && !req.body.unsecure) {
          res.send("Not authenticated").status(401);
          return;
        }
        if (!req.body.history) {
          res.status(401).send("Malformed data");
          return;
        }
        const device = await ds.manager.findOne(Device, {
          where: {
            id: Number(req.body.history[0].device),
          },
        });
        console.info("Device:", device);
        if (device && req.session.user?.id) {
          req.body.history.map(async (gps) => {
            const newPoint = {
              latitude: Number(gps.latitude),
              longitude: Number(gps.longitude),
              timestamp: gps.timestamp ?? new Date(),
            };
            const geofences = await ds.manager.query(
              `select * from geofences g
               left join events e on e."geofenceId" = g.id
               left JOIN device d on d.id = e."deviceId"
               where d."userId" = $1;`,
              [req.session.user?.id]
            );

            geofences.forEach(async (g) => {
              const isGeofence = isInGeofence(newPoint, g, g.radius);
              if (g === null) {
                if (isGeofence) {
                  console.info(
                    "Creating new geofence event for ",
                    g.device,
                    isGeofence
                  );
                  await ds.manager.insert(Events, {
                    device: device,
                    geofence: g,
                    status: "enter",
                  });
                  //No previous geofences, generating one
                }
                console.info("No geofence event for this device");
              } else {
                const toUpdate = !isGeofence && g.status === "enter";
                console.info(
                  g.device,
                  " To update:",
                  toUpdate,
                  isGeofence,
                  g.status
                );
                if (toUpdate) {
                  console.info("To update event");
                  const edited = await ds
                    .createQueryBuilder()
                    .update(Events)
                    .set({
                      status: isGeofence ? "enter" : "exit",
                    })
                    .where("id = :id", { id: Number(g.id) })
                    .execute();
                }
              }
            });

            const inserted = await ds.manager.insert(GPSPosition, {
              latitude: newPoint.latitude,
              longitude: newPoint.longitude,
              timestamp: newPoint.timestamp,
              satellites: req.body.satellites
                ? Number(req.body.satellites)
                : -1,
              speed: req.body.speed ? Number(req.body.speed) : -1,
              accuracy: req.body.accuracy ? Number(req.body.accuracy) : -1,
              activity: req.body.activity,
              device: device,
            });
          });
          res.send("OK");
        } else {
          res.send("DEVICE_NOT_FOUND").status(404);
        }
      });

      if (process.env.SSL) {
        https
          .createServer(
            {
              key: fs.readFileSync(__dirname + "/ssl/localhost.key"),
              cert: fs.readFileSync(__dirname + "/ssl/localhost.crt"),
            },
            app
          )
          .listen(port);
      } else {
        server = app.listen(port);
      }
      resolve(server);
    })
    .catch((error) => console.error("DB ERROR", error));
});

serverPromise.then(() => {
  console.log(`Server started on port ${port}`);
});
