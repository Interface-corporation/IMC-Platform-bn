import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import errorHandler from "@/middleware/errorHandler";
import { jwtAuthMiddleware } from "@/middleware/passport";
import { googleAuthStrategy } from "@/middleware/passport";
import rateLimiter from "@/middleware/rateLimiter";
import requestLogger from "@/middleware/requestLogger";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { env } from "@/config/envConfig";
import { authenticationRouters } from "@/routes/authentication/authenticationRouters";
import { cartRouter } from "@/routes/cart/cartRouter";
// Routers import
import { productRouter } from "@/routes/products/productRouter";
import { userRouter } from "@/routes/users/userRouter";
import MongoStore from "connect-mongo";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ 
    origin: ["http://localhost:3000", "https://imc.rw"],//env.CORS_ORIGIN, 
    credentials: true 
}));

app.use(helmet());
app.use(compression());
app.use(rateLimiter);

// Convert bigInt to string
app.set("json replacer", (key: string, value: any) => {
    return typeof value === "bigint" ? value.toString() : value;
});

// MIDDLEWARES SETUP
app.use(cookieParser(process.env.SESSION_SECRET || ""));

app.use(
  session({
    store: MongoStore.create({
        mongoUrl: env.DATABASE_URL_LOCAL, // Your MongoDB connection string
        ttl: 30 * 60, // Session expiration in seconds (30 minutes)
    }),
    secret: process.env.SESSION_SECRET || "",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

jwtAuthMiddleware(passport); //Set UP strategies
googleAuthStrategy(passport);
app.use(requestLogger); // Request logging

// Routes
app.use("/", authenticationRouters);
app.use("/users", userRouter);
app.use("/products", productRouter);
app.use("/carts", cartRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
