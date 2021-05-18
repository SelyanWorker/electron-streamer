const spawn = require('child_process').spawn
const ffmpeg_path = "ffmpeg/bin/ffmpeg.exe"

// TODO: catch ffmpeg not found error

class FfmpegStreamer
{
    appendFrame(image)
    {
        if (this.#ffmpegSpawn &&
            !this.#ffmpegSpawn.killed)
        {
            this.#ffmpegSpawn.stdin.write(image)
        }
    }

    start(params)
    {
        if (!this.#ffmpegSpawn ||
            this.#ffmpegSpawn.killed)
        {
            let args = this.#getFfmpegArgv(params)
            let path = ffmpeg_path

            console.log(path)
            console.log(args)

            this.#ffmpegSpawn = spawn(path, args)

            this.#ffmpegSpawn.stderr.on('data', data =>
            {
                console.error(`stderr: ${data}`);
            });
        }
    }

    stop()
    {
        this.#ffmpegSpawn.stdin.pause()
        console.log("kill result:", this.#ffmpegSpawn.kill())
    }

    #getFfmpegArgv(params)
    {
        let args = []
        /*if (params.mode === 'jpeg')
            args.push('-f', 'image2pipe')
        else
        {
            args.push('-vcodec', 'rawvideo',
                '-f', 'rawvideo',
                '-pix_fmt', 'bgra')
            args.push('-s:v', '' + (+params.resolution.width) + 'x' +
                (+params.resolution.height))
        }*/
        args.push('-f', 'image2pipe')
        args.push('-r', '' + (+24), '-i', 'pipe:0')

        if (params.codec === 'h264')
            args.push('-c:v', 'libx264')

        args.push('-g', '1', '-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline', '-preset', 'ultrafast',
            '-tune', 'zerolatency')

        args.push('-f', 'mpegts')

        args.push(params.protocol + "://" + params.url + ':' + params.port)

        return args
    }

    #ffmpegSpawn
}

module.exports = FfmpegStreamer