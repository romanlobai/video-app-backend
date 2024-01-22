export const storeCreateVideo = async (fastify, [...params]) => {
    const query = `
        INSERT INTO "video" (id, title, description, video_url, user_id, preview_url) 
        VALUES ($1, $2, $3, $4, $5, $6);
    `;

    return fastify.pg.query(query, params);
};

export const storeDeleteVideo = async (fastify, [...params]) => {
    const query = `
        DELETE FROM "video"
        WHERE id = $1 AND user_id = $2
    `;

    return fastify.pg.query(query, params);
};

export const storeGetVideo = async (fastify, [...params]) => {
    const query = `
        SELECT * FROM "video"
        WHERE id = $1 AND user_id = $2
    `;

    return fastify.pg.query(query, params);
};

export const storeGetAllVideo = async (fastify, [...params]) => {
    const query = `
        SELECT * FROM "video"
        WHERE user_id = $1
    `;

    return fastify.pg.query(query, params);
};
