const spawn = require('child_process').spawn
const ffmpeg_path = /*"ffmpeg/bin/ffmpeg.exe"*/ 'C:/dev/tools/ffmpeg-4.4-full_build/bin/ffmpeg.exe'

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
            let args = this.#getFfmpegArgvCPU(params)
            //let args = this.#getFfmpegArgvGPU_Intel(params)
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

    #getFfmpegArgvCPU(params)
    {
        let args = ['-hide_banner']

        if (params.mode === 'jpeg')
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

        args.push('-g', '1',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline', '-preset', 'ultrafast',
            '-tune', 'zerolatency')

        args.push('-f', 'rtp')
        args.push('-sdp_file', 'video.sdp')

        args.push(params.protocol + "://" + params.url + ':' + params.port)

        return args
    }

    #getFfmpegArgvGPU_Intel(params)
    {
        let args = []
        if (params.mode === 'jpeg')
            args.push('-f', 'image2pipe')
        else
        {
            args.push('-vcodec', 'rawvideo',
                '-f', 'rawvideo',
                '-pix_fmt', 'bgra')
            args.push('-s:v', '' + (+params.resolution.width) + 'x' +
                (+params.resolution.height))
        }

        args.push('-r', '' + (+30),
                  '-i', 'pipe:0')
        args.push('-g', '1')

        args.push(//'-init_hw_device', 'qsv:hw',
                  '-b:v', '30000K',
                  '-c:v', 'h264_qsv',
                  '-preset:v', 'slow'
        )

        /*args.push('-pix_fmt', 'yuv420p',
            '-profile:v', 'baseline', '-preset', 'ultrafast',
            '-tune', 'zerolatency')*/

        /*args.push('-hwaccel', 'cuvid',
                  //'-hwaccel_output_format', 'cuda'
        )

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
                '-pix_fmt', 'yuv420p',
                '-b:v', '8M',
                '-maxrate:v', '10M',
                '-c:a', 'aac',
                '-b:a', '224k'
        )*/

        /*args.push('-hwaccel', 'cuvid',
                  //'-hwaccel_output_format', 'cuda'
        )

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
                '-pix_fmt', 'yuv420p',
                '-b:v', '8M',
                '-maxrate:v', '10M',
                '-c:a', 'aac',
                '-b:a', '224k'
        )*/

        args.push('-f', 'rtp')
        args.push('-sdp_file', 'video.sdp')

        args.push(params.protocol + "://" + params.url + ':' + params.port)

        return args
    }

    #ffmpegSpawn
}

module.exports = FfmpegStreamer