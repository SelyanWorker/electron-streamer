const spawn = require('child_process').spawn
const ffmpeg_path_default = 'ffmpeg'

// TODO: catch ffmpeg not found error

class FfmpegStreamer
{
    appendFrame(image)
    {
        if (this.#isAlive())
        {
            this.#ffmpegSpawn.stdin.write(image)
            return
        }
        console.log("FFmpeg is not alive")
    }

    start(params)
    {
        if (!this.#isAlive())
        {
            let args = FfmpegStreamer.#getFfmpegArgvCPU(params)
            let path = params.ffmpeg_path ? params.ffmpeg_path : ffmpeg_path_default

            console.log(path)
            console.log(args)

            this.#ffmpegSpawn = spawn(path, args)

            this.#ffmpegSpawn.on('error', (err) =>
            {
                console.error(`FFmpeg spawn error:`, err);
            });

            this.#ffmpegSpawn.stderr.on('data', data =>
            {
                console.error(`stderr: ${data}`);
            });

            this.#ffmpegSpawn.stdout.on('data', data =>
            {
                console.log(`stdout: ${data}`);
            });

            return
        }
        console.log("FFmpeg already created")
    }

    stop()
    {
        if (!this.#isAlive())
            return

        this.#ffmpegSpawn.stdin.pause()
        console.log("Kill ffmpeg spawn:", this.#ffmpegSpawn.kill())
    }

    restart(params)
    {
        this.stop()
        this.start(params)
    }

    static #getFfmpegArgvCPU(params)
    {
        let args = ['-hide_banner']

        if (params.mode === 'jpeg')
        {
            args.push('-f', 'image2pipe')
        }
        else
        {
            args.push('-vcodec', 'rawvideo',
                '-f', 'rawvideo',
                '-pix_fmt', 'bgra')
            args.push('-s:v', '' + (+params.resolution.width) + 'x' +
                (+params.resolution.height))
        }

        args.push('-r', '' + (+params.fps), '-i', 'pipe:0')

        if (params.codec === 'h264')
            args.push('-c:v', 'libx264')

        args.push('-g', '1',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline', '-preset', 'ultrafast',
            '-tune', 'zerolatency')


        if (params.output === "file")
        {
            args.push('-map', '0',
                '-segment_time', '00:01:00',
                '-f', 'segment',
                '-reset_timestamps', '1',
                'output%03d.mp4');
        }
        else
        {
            args.push('-f', 'h264')
            args.push("udp://" + params.url + ':' + params.port)
        }


        return args
    }

    #isAlive()
    {
        return this.#ffmpegSpawn && !this.#ffmpegSpawn.killed
    }

    #ffmpegSpawn
}

module.exports = FfmpegStreamer