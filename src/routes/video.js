import {
    uploadHandler,
    getAllVideosHandler,
    getVideoByIdHandler,
    deleteVideoByIdHandler,
    createSocketConnectionHandler,
} from "../controllers/video.js";

const videoSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        video_url: { type: "string" },
        preview_url: { type: "string" },
    },
};

const messageSchema = {
    type: "object",
    properties: {
        message: { type: "string" },
    },
};

const uploadSchema = {
    headers: {
        type: "object",
        properties: {
            "content-length": { type: "string" },
        },
        required: ["content-length"],
    },
    response: {
        200: messageSchema,
        500: messageSchema,
    },
};

const getAllVideosSchema = {
    response: {
        200: {
            type: "array",
            items: videoSchema,
        },
        400: messageSchema,
    },
};

const getOneVideoSchema = {
    params: {
        type: "object",
        properties: {
            id: { type: "string" },
        },
        required: ["id"],
    },
    response: {
        200: videoSchema,
        400: messageSchema,
    },
};

const deleteOneVideoSchema = {
    params: {
        type: "object",
        properties: {
            id: { type: "string" },
        },
        required: ["id"],
    },
    response: {
        200: messageSchema,
        400: messageSchema,
    },
};

export async function videoRoutes(fastify, options) {
    fastify.post("/upload", {
        onRequest: [fastify.authenticate],
        schema: uploadSchema,
        handler: uploadHandler,
    });

    fastify.get("/uploadSocket", {
        websocket: true,
        handler: createSocketConnectionHandler,
    });

    fastify.get("/", {
        onRequest: [fastify.authenticate],
        schema: getAllVideosSchema,
        handler: getAllVideosHandler,
    });

    fastify.get("/:id", {
        onRequest: [fastify.authenticate],
        schema: getOneVideoSchema,
        handler: getVideoByIdHandler,
    });

    fastify.delete("/:id", {
        onRequest: [fastify.authenticate],
        schema: deleteOneVideoSchema,
        handler: deleteVideoByIdHandler,
    });
}
