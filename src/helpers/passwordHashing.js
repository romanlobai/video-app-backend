import { randomBytes, pbkdf2 } from "node:crypto";

export const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString("hex");
        pbkdf2(password, salt, 1000, 64, "sha512", (err, derivedKey) => {
            if (err) reject(err);
            else resolve({ salt, hash: derivedKey.toString("hex") });
        });
    });
};

export const comparePassword = async (
    inputPassword,
    storedPassword,
    storedSalt
) => {
    return new Promise((resolve, reject) => {
        pbkdf2(
            inputPassword,
            storedSalt,
            1000,
            64,
            "sha512",
            (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey.toString("hex") === storedPassword);
            }
        );
    });
};
