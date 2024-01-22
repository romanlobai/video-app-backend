import { videoRoutes } from "./video.js";
import { userRoutes } from "./user.js";

export async function routes(fastify) {
    fastify.register(videoRoutes, { prefix: "/video" });
    fastify.register(userRoutes, { prefix: "/user" });
}
