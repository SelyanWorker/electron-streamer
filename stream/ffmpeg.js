const spawn = require('child_process').spawn
const ffmpeg_path = /*"ffmpeg/bin/ffmpeg.exe"*/ 'D:/dev/tools/ffmpeg-4.4-full_build/bin/ffmpeg.exe'

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
        }

        args.push('-r', '' + (+30), '-i', 'pipe:0')

        if (params.codec === 'h264')
            args.push('-c:v', 'libx264')

        args.push('-g', '1', '-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline', '-preset', 'ultrafast',
            '-tune', 'zerolatency')*/

        /*args.push('-hwaccel', 'cuvid')

        args.push('-vcodec', 'rawvideo',
                  '-f', 'rawvideo',
                  '-pix_fmt', 'bgra')
        args.push('-s:v', '' + (+params.resolution.width) + 'x' +
            (+params.resolution.height))
        args.push('-r', '' + (+60),
                  '-i', 'pipe:0',
                  '-g', '1'
        )

        args.push('-c:v', 'h264_nvenc',
                '-preset', 'slow',
                '-level', '4.1',
                '-qmin', '10',
                '-qmax', '52',
                //'-pix_fmt', 'yuv420p',
                //'-rc', 'vbr_hq',
                // '-b:v', '8M',
                // '-maxrate:v', '10M',
                // '-c:a', 'aac',
                // '-b:a', '224k'
        )*/

        args.push('-loglevel', 'debug',
             '-threads', '1',
             '-hwaccel', 'nvdec',
             '-hwacccel_output_format', 'cuda', '\\')
        args.push('-vcodec', 'rawvideo',
            '-f', 'rawvideo',
            '-pix_fmt', 'bgra', '\\')
        args.push('-s:v', '' + (+params.resolution.width) + 'x' +
            (+params.resolution.height))
        args.push('-r', '' + (+60),
            '-i', 'pipe:0',
            '-g', '1', '\\')

        args.push('-filter:v', '"scale_npp=w=1920:h=1080:interp_algo=lanczos"', '\\',
            '-c:v', 'h264_nvenc', '-b:v', '4M', '-maxrate:v', '5M', '-bufsize:v', '8M', '-profile:v', 'main','\\',
            '-level:v', '4.1', '-rc:v', 'vbr_hq', '-rc-lookahead:v', '32', '-spatial_aq:v', '1','\\',
            '-aq-strength:v', '15', '-coder:v', 'cabac', '\\')
        
        args.push('-f', 'mpegts')

        args.push(params.protocol + "://" + params.url + ':' + params.port)

        return args
    }

    #ffmpegSpawn
}

module.exports = FfmpegStreamer