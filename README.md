## Installation

Application requires [Node.js](https://nodejs.org/) v20+ to run.
Project based on [Fastify](https://fastify.dev/) v4 version
In order to work with videos  [Ffmpeg](https://ffmpeg.org/) was used
[Postgres](https://ffmpeg.org/) database was used for storing user and data
[AWS S3](https://aws.amazon.com/s3/) was used to story videos

1) Provide basic .env configuration (see .env.example)

2) Install **FfMpeg** on your machine
```
brew install ffmpeg
```
3) Install the dependencies and devDependencies and start the server.
```sh
npm i
npm run start
```

## Explanation regarding implementation
This implementation can be improved. It would be nice to add docker/docker-compose configuration and process video uploads in [Lambda](https://aws.amazon.com/lambda/) function.