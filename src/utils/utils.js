import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const getFileExtension = (filename) => {
    const [videoExtension] = filename
        .split("")
        .reverse()
        .join("")
        .split(".")
        .filter(Boolean);

    return videoExtension.split("").reverse().join("");
};

export const getRootDirName = () => {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename).replace("/src/utils", "");
};

export const getTmpPath = (fileId) => {
    return `${getRootDirName()}/${process.env.TMP_FOLDER_NAME}/${fileId}`;
};

export const isFileExistsAsync = (dir) => {
    return fs.promises
        .access(dir, fs.constants.R_OK)
        .then(() => true)
        .catch(() => false);
};

export const createTmpFolders = async (dir) => {
    const isFileExists = await isFileExistsAsync(dir);

    if (!isFileExists) {
        await fs.promises.mkdir(dir, { recursive: true });
    }
};

export const deleteTmpOneFile = (fileId, extension) => {
    const tmpPath = getTmpPath(fileId);
    const filePath = `${tmpPath}/${fileId}.${extension}`;
    return deleteFileAsync(filePath);
};

export const deleteAllTmpFiles = (fileId) => {
    const tmpPath = getTmpPath(fileId);
    return deleteFileAsync(tmpPath);
};

export const getAllTmpFilesPath = async (fileId) => {
    const fileTmpPath = getTmpPath(fileId);

    const filesNames = await fs.promises.readdir(fileTmpPath, {
        recursive: true,
    });

    return filesNames.filter(
        (fileName) =>
            fileName !== process.env.AWS_BUCKET_VIDEO_HLS_SEGMENTS_FOLDER_NAME
    );
};

export const deleteFileAsync = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.rm(
            filePath,
            {
                recursive: true,
                force: true,
            },
            (err) => {
                if (err) {
                    reject(err);
                }

                resolve();
            }
        );
    });
};

export const parseQueryParams = (request) => {
    const url = request.url;
    const [, queryParamsInline] = url.split("?");
    const queryParams = {};

    queryParamsInline.split("&").forEach((queryParamInline) => {
        const [key, value] = queryParamInline.split("=");
        queryParams[key] = value;
    });

    return queryParams;
};
