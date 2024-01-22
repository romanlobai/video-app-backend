import {
    S3Client,
    HeadObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import { getTmpPath } from "./utils.js";
import "dotenv/config";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const VIDEO_ORIGIN = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

const existsFolderS3 = async (Bucket, Key) => {
    const command = new HeadObjectCommand({ Bucket, Key });

    try {
        await s3.send(command);
        return true;
    } catch (error) {
        if (error.name === "NotFound") {
            return false;
        } else {
            throw error;
        }
    }
};

export const deleteFolderS3 = async (fileId, userId) => {
    const userFileS3Folder = getFolderUrlShortS3(userId, fileId);

    async function recursiveDeleteFolder(token) {
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET,
            Prefix: userFileS3Folder,
            ContinuationToken: token,
        });

        const list = await s3.send(listCommand);

        if (list.KeyCount) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: process.env.AWS_BUCKET,
                Delete: {
                    Objects: list.Contents.map((item) => ({ Key: item.Key })),
                    Quiet: false,
                },
            });

            const deleted = await s3.send(deleteCommand);

            if (deleted.Errors) {
                deleted.Errors.map((error) =>
                    console.log(
                        `${error.Key} could not be deleted - ${error.Code}`
                    )
                );
            }
        }

        if (list.NextContinuationToken) {
            recursiveDeleteFolder(list.NextContinuationToken);
        }

        return;
    }

    return recursiveDeleteFolder();
};

export const uploadFileToS3 = async (filePath, key) => {
    const uploadFileCommandS3 = new Upload({
        client: s3,
        params: {
            Bucket: process.env.AWS_BUCKET,
            Key: key,
            Body: fs.createReadStream(filePath),
        },
    });

    await uploadFileCommandS3.done();
};

export const uploadFolderToS3 = async (
    folderFilesPath,
    userId,
    fileId,
    webSocket
) => {
    const userFileS3Folder = getFolderUrlShortS3(userId, fileId);
    const fileTmpPath = getTmpPath(fileId);

    for (let i = 0; i < folderFilesPath.length; i++) {
        const filePath = folderFilesPath[i];
        const fileFullPath = `${fileTmpPath}/${filePath}`;
        const fileS3Key = `${userFileS3Folder}/${filePath}`;

        await uploadFileToS3(fileFullPath, fileS3Key);

        webSocket.send(
            JSON.stringify({
                stage: 2,
                status: "Uploading video",
                progress: ((i + 1) / folderFilesPath.length) * 100,
            })
        );
    }
};

export const isFileExistsS3 = async (userId, fileId) => {
    const isExists = await existsFolderS3(
        process.env.AWS_BUCKET,
        getFolderUrlShortS3(userId, fileId)
    );
    return isExists;
};

export const getFolderUrlShortS3 = (userId, fileId) => {
    return `${userId}/${fileId}`;
};

export const getFolderUrlFullS3 = (userId, fileId) => {
    return `${VIDEO_ORIGIN}${getFolderUrlShortS3(userId, fileId)}`;
};

export const getFileUrlShortS3 = (userId, fileId, fileExtension) => {
    return `${getFolderUrlShortS3(userId, fileId)}/${fileId}.${fileExtension}`;
};

export const getFileUrlFullS3 = (userId, fileId, fileExtension) => {
    return `${getFolderUrlFullS3(userId, fileId)}/${fileId}.${fileExtension}`;
};
