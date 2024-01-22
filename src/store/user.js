export const storeFindOneByEmail = async (fastify, [...params]) => {
    const query = `
        SELECT * FROM "user" WHERE email = $1;
    `;

    return fastify.pg.query(query, params);
};

export const storeFindOneByEmailCount = async (fastify, [...params]) => {
    const query = `
        SELECT COUNT(*) AS count FROM "user" WHERE email = $1;
    `;

    return fastify.pg.query(query, params);
};

export const storeCreateUser = async (fastify, [...params]) => {
    const query = `
        INSERT INTO "user" (id, email, password, salt) 
        VALUES ($1, $2, $3, $4);
    `;

    return fastify.pg.query(query, params);
};
