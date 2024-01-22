import { loginHandler, registrationHandler } from "../controllers/user.js";

const authJsonSchema = {
    body: {
        type: "object",
        required: ["email", "password"],
        properties: {
            email: { type: "string" },
            password: { type: "string" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                accessToken: { type: "string" },
            },
        },
        400: {
            type: "object",
            properties: {
                message: { type: "string" },
            },
        },
    },
};

export async function userRoutes(fastify, options) {
    fastify.post("/login", {
        schema: authJsonSchema,
        handler: loginHandler,
    });

    fastify.post("/registration", {
        schema: authJsonSchema,
        handler: registrationHandler,
    });
}
