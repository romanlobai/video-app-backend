import Fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import fastifyPostgres from "@fastify/postgres";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { fastifyJwt } from "@fastify/jwt";
import authenticatePlugin from "./src/plugins/authenticate.js";
import { parseQueryParams } from "./src/utils/utils.js";
import { routes } from "./src/routes/routes.js";
import "dotenv/config.js";

const fastify = Fastify({
    logger: true,
});

fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
});

fastify.register(cors);
fastify.register(websocket, {
    options: {
        maxPayload: 1048576,
        verifyClient: function (info, next) {
            const { accessToken } = parseQueryParams(info.req);

            if (!accessToken) {
                return next(false);
            }

            try {
                fastify.jwt.verify(accessToken);
            } catch (error) {
                fastify.log.error(error);
                return next(false);
            }

            return next(true);
        },
    },
});

fastify.register(fastifyPostgres, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
});

fastify.register(authenticatePlugin);
fastify.register(routes);

const start = async () => {
    try {
        fastify.listen({ port: process.env.PORT });
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
