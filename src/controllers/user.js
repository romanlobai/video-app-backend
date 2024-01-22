import { hashPassword, comparePassword } from "../helpers/passwordHashing.js";
import { v4 as uuidv4 } from "uuid";
import {
    storeFindOneByEmail,
    storeFindOneByEmailCount,
    storeCreateUser,
} from "../store/user.js";

export const loginHandler = async (request, reply) => {
    const { email, password } = request.body;

    const {
        rows: [user],
    } = await storeFindOneByEmail(request.server, [email]);

    if (!user) {
        return reply.status(400).send({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await comparePassword(
        password,
        user.password,
        user.salt
    );

    if (!isPasswordCorrect) {
        return reply.status(400).send({ message: "Invalid email or password" });
    }

    const token = request.server.jwt.sign({
        payload: {
            id: user.id,
            email: user.email,
        },
    });

    return { accessToken: token };
};

export const registrationHandler = async (request, reply) => {
    const { email, password } = request.body;

    const {
        rows: [{ count }],
    } = await storeFindOneByEmailCount(request.server, [email]);

    if (count >= 1) {
        return reply
            .status(400)
            .send({ message: `User with email: ${email}, already exists` });
    }

    const { salt, hash } = await hashPassword(password);
    const userId = uuidv4();

    await storeCreateUser(request.server, [userId, email, hash, salt]);

    const token = request.server.jwt.sign({
        payload: {
            id: userId,
            email,
        },
    });

    return { accessToken: token };
};
