import pump from "pump";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { getTmpPath, createTmpFolders } from "./utils.js";
import { getFolderUrlFullS3 } from "./s3.js";

export const createVidePreviewFile = (fileId, tmpPath, videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on("error", function (err, stdout, stderr) {
                reject(err.message);
                console.log(
                    "createVidePreviewFile - an error occurred: " + err.message,
                    err,
                    stderr
                );
            })
            .on("end", function (err, stdout, stderr) {
                resolve();
            })
            .screenshots({
                timestamps: ["00:00:02.000"],
                count: 1,
                filename: `${fileId}.jpg`,
                folder: `${tmpPath}/`,
            });
    });
};

export const createVideoM3U8File = (
    fileId,
    tmpPath,
    videoPath,
    hlsSegmentS3Path,
    webSocket
) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                "-c:v libx264",
                "-f hls",
                "-max_muxing_queue_size 1024",
                "-hls_time 10",
                "-hls_list_size 0",
                "-hls_segment_filename",
                `${tmpPath}/${process.env.AWS_BUCKET_VIDEO_HLS_SEGMENTS_FOLDER_NAME}/filesequence%d.ts`,
                `-hls_base_url ${hlsSegmentS3Path}`,
            ])
            .output(`${tmpPath}/${fileId}.m3u8`)
            .on("start", function (commandline) {
                webSocket.send(
                    JSON.stringify({
                        stage: 1,
                        status: "Processing video",
                        progress: 0,
                    })
                );
            })
            .on("error", function (err, stdout, stderr) {
                reject(err.message);

                console.log(
                    `createVideoM3U8File - an error occurred: ${err.message}`,
                    err,
                    stderr
                );
            })
            .on("progress", function (progress) {
                webSocket.send(
                    JSON.stringify({
                        stage: 1,
                        status: "Processing video",
                        progress: Math.floor(progress.percent),
                    })
                );
            })
            .on("end", function (err, stdout, stderr) {
                webSocket.send(
                    JSON.stringify({
                        stage: 1,
                        status: "Processing video",
                        progress: 100,
                    })
                );

                resolve();
            })
            .run();
    });
};

export const processingVideo = async (
    fileStream,
    fileId,
    fileExtension,
    userId,
    webSocket
) => {
    const tmpPath = getTmpPath(fileId);
    const videoPath = `${tmpPath}/${fileId}.${fileExtension}`;
    const hlsSegmentS3Path = `${getFolderUrlFullS3(userId, fileId)}/${
        process.env.AWS_BUCKET_VIDEO_HLS_SEGMENTS_FOLDER_NAME
    }/`;

    await createTmpFolders(
        `${tmpPath}/${process.env.AWS_BUCKET_VIDEO_HLS_SEGMENTS_FOLDER_NAME}`
    );

    return new Promise((resolve, reject) => {
        pump(fileStream, fs.createWriteStream(videoPath), function (err) {
            const videoM3U8Promise = createVideoM3U8File(
                fileId,
                tmpPath,
                videoPath,
                hlsSegmentS3Path,
                webSocket
            );

            const videPreviewPromise = createVidePreviewFile(
                fileId,
                tmpPath,
                videoPath,
                hlsSegmentS3Path
            );

            Promise.all([videoM3U8Promise, videPreviewPromise])
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    });
};
