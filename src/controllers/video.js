import { v4 as uuidv4 } from "uuid";
import {
    storeCreateVideo,
    storeDeleteVideo,
    storeGetVideo,
    storeGetAllVideo,
} from "../store/video.js";
import {
    getFileExtension,
    deleteTmpOneFile,
    deleteAllTmpFiles,
    getAllTmpFilesPath,
} from "../utils/utils.js";
import {
    uploadFolderToS3,
    getFileUrlShortS3,
    deleteFolderS3,
    isFileExistsS3,
    VIDEO_ORIGIN,
} from "../utils/s3.js";
import { processingVideo } from "../utils/ffmpeg.js";
import { webSocketConnections } from "../utils/webSocket.js";

export const uploadHandler = async (request, reply) => {
    const {
        payload: { id },
    } = request.user;

    if (!webSocketConnections.has(id)) {
        return reply.status(400).send({
            message: "No connection to WebSocket, please try again later",
        });
    }

    const userWebSocket = webSocketConnections.get(id);

    const data = await request.file();
    const description = data.fields?.description?.value;
    const title = data.fields?.title?.value;

    if (!data.file || !description || !title) {
        return reply
            .status(400)
            .send({ message: "Invalid input, missing file or description" });
    }

    const videoId = uuidv4();
    const videoExtension = getFileExtension(data.filename);
    const videoUrl = getFileUrlShortS3(id, videoId, "m3u8");
    const previewUrl = getFileUrlShortS3(id, videoId, "jpg");

    reply.send({ message: "Upload started" });

    try {
        await processingVideo(
            data.file,
            videoId,
            videoExtension,
            id,
            userWebSocket
        );

        await deleteTmpOneFile(videoId, videoExtension);

        const tmpFilesPath = await getAllTmpFilesPath(videoId);

        const uploadVideoFolderToS3Promise = uploadFolderToS3(
            tmpFilesPath,
            id,
            videoId,
            userWebSocket
        );
        const uploadToDatabasePromise = storeCreateVideo(request.server, [
            videoId,
            title,
            description,
            videoUrl,
            id,
            previewUrl,
        ]);

        await Promise.all([
            uploadVideoFolderToS3Promise,
            uploadToDatabasePromise,
        ]);
        await deleteAllTmpFiles(videoId);
    } catch (error) {
        request.server.log.error(error);

        await Promise.allSettled([
            deleteFolderS3(videoId, id),
            storeDeleteVideo(request.server, [videoId, id]),
            deleteAllTmpFiles(videoId),
        ]);

        userWebSocket.close(3001, "There was a problem uploading video");
    }

    userWebSocket.send(
        JSON.stringify({
            stage: 3,
            status: "The video has been uploaded",
        })
    );
    userWebSocket.close();
};

export const getAllVideosHandler = async (request, reply) => {
    const {
        payload: { id: userId },
    } = request.user;
    const { rows } = await storeGetAllVideo(request.server, [userId]);

    const videos = rows.map((video) => {
        const videoUrlFull = `${VIDEO_ORIGIN}${video.video_url}`;
        const previewUrlFull = `${VIDEO_ORIGIN}${video.preview_url}`;

        return {
            ...video,
            video_url: videoUrlFull,
            preview_url: previewUrlFull,
        };
    });

    return reply.send(videos);
};

export const getVideoByIdHandler = async (request, reply) => {
    const { id } = request.params;
    const {
        payload: { id: userId },
    } = request.user;
    const {
        rows: [video],
    } = await storeGetVideo(request.server, [id, userId]);

    if (!video) {
        return reply.status(400).send({ message: "Video not found" });
    }

    const videoUrlFull = `${VIDEO_ORIGIN}${video.video_url}`;
    const previewUrlFull = `${VIDEO_ORIGIN}${video.preview_url}`;

    return {
        ...video,
        video_url: videoUrlFull,
        preview_url: previewUrlFull,
    };
};

export const deleteVideoByIdHandler = async (request, reply) => {
    const { id } = request.params;
    const {
        payload: { id: userId },
    } = request.user;

    const videoDatabase = await storeGetVideo(request.server, [id, userId]);
    const videoS3 = await isFileExistsS3(id, userId);

    if (!videoDatabase.rowCount && !videoS3) {
        return reply.status(400).send({ message: "Video not found" });
    }

    const deleteFromS3 = deleteFolderS3(id, userId);
    const deleteFromDatabase = storeDeleteVideo(request.server, [id, userId]);

    await Promise.all([deleteFromS3, deleteFromDatabase]);

    reply.send({ message: "File was successfully deleted" });
};

export const createSocketConnectionHandler = async (connection, request) => {
    const { accessToken } = request.query;
    const {
        payload: { id },
    } = request.server.jwt.decode(accessToken);

    webSocketConnections.set(id, connection.socket);

    connection.socket.on("close", () => {
        webSocketConnections.delete(id);
    });
};
