import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { createApiReqestBody, createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { z } from "zod";
import { UserSchema } from "../users/userModel";
import { aunthenticationController } from "./authenticationController";

export const authenticationRegistry = new OpenAPIRegistry();
export const authenticationRouters: Router = express.Router();

//REGISTRACTION
authenticationRegistry.registerPath({
  method: "post",
  path: "/register",
  request: {
    body: createApiReqestBody(UserSchema.pick({ name: true, email: true, password: true })),
  },
  tags: ["Authentication"],
  responses: createApiResponse(UserSchema, "User registered successfully", StatusCodes.OK),
});

authenticationRouters.post("/register", aunthenticationController.registerUser);


//LOGIN WITH CREDENTIALS
authenticationRegistry.registerPath({
  method: "post",
  path: "/credentials-login",
  description: `## After login, session-token will be automatically stored in your browser. You can use the following format to send it to request.
        const response = await fetch("{backend_url}/users/profile", {
            method: "GET",
            credentials: "include" // include this line to get your token sent on request
        });
        For other libraries like **Axios** refer to online documentations for how to send request with httpOnly Token
    `,
  tags: ["Authentication"],
  request: {
    body: createApiReqestBody(UserSchema.pick({ email: true, password: true })),
  },
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.post("/credentials-login", aunthenticationController.loginUser);

// LOGIN WITH GOOGLE
authenticationRegistry.registerPath({
  method: "get",
  path: "/google-login",
  description: "*Paste in browser: http://localhost:8080/google-login*",
  tags: ["Authentication"],
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.get(
  "/google-login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

authenticationRegistry.registerPath({
  method: "get",
  path: "/auth/google/redirect",
  description: "*After Login with google response will come to this route*",
  tags: ["Authentication"],
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.get(
  "/auth/google/redirect",
  passport.authenticate("google"),
  aunthenticationController.googleLogin,
);

// HANDLE FORGOT PASSWORD
authenticationRegistry.registerPath({
  method: "post",
  path: "/forgot-password",
  tags: ["Authentication"],
  request: {
    body: createApiReqestBody(UserSchema.pick({ email: true })),
  },
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.post("/forgot-password", aunthenticationController.forgotPassword);

// HANDLE RESET PASSWORD
authenticationRegistry.registerPath({
  method: "post",
  path: "/reset-password/{resetCode}",
  tags: ["Authentication"],
  request: {
    params: z.object({ resetCode: z.number() }),
    body: createApiReqestBody(UserSchema.pick({ password: true }).extend({ confirmPassword: z.string() })),
  },
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.post("/reset-password/:resetCode", aunthenticationController.resetPassword);

// LOGOUT USER AND CLEAR COOKIES
authenticationRegistry.registerPath({
  method: "delete",
  path: "/logout",
  tags: ["Authentication"],
  responses: createApiResponse(UserSchema, "Success"),
});

authenticationRouters.delete("/logout", aunthenticationController.userLogout);
