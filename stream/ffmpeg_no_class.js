const spawn = require('child_process').spawn
const ffmpeg_path_default = /*"ffmpeg/bin/ffmpeg.exe"*/ 'ffmpeg'

// TODO: catch ffmpeg not found error

let ffmpeg_spawn

function isDead()
{
    return !ffmpeg_spawn || ffmpeg_spawn.killed
}

function appendFrame(image)
{
    if (!isDead())
    {
        ffmpeg_spawn.stdin.write(image)
    }
}

function start(params)
{
    if (isDead())
    {
        let args = getFfmpegArgvCPU(params)
        //let args = this.#getFfmpegArgvGPU_Intel(params)
        let path = params.ffmpeg_path ? params.ffmpeg_path : ffmpeg_path_default

        console.log(path)
        console.log(args)

        ffmpeg_spawn = spawn(path, args)

        ffmpeg_spawn.on('error', (err)=>
        {
            console.error("Failed to create ffmpeg spawn, ffmpeg path:", path)
        })

        ffmpeg_spawn.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ffmpeg_spawn.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    }
}

function stop()
{
    if (isDead())
        return

    ffmpeg_spawn.stdin.pause()
    console.log("kill result:", ffmpeg_spawn.kill())
}

function getFfmpegArgvCPU(params)
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

    args.push('-r', '' + (+params.fps), '-i', 'pipe:0')

    if (params.codec === 'h264')
        args.push('-c:v', 'libx264')

    args.push('-g', '1',
        '-pix_fmt', 'yuv420p',
        '-profile:v', 'baseline', '-preset', 'ultrafast',
        '-tune', 'zerolatency')

    /*args.push('-f', 'rtp')
    args.push('-sdp_file', 'video.sdp')*/
    args.push('-f', 'mpegts')

    args.push(params.protocol + "://" + params.url + ':' + params.port)

    return args
}

function getFfmpegArgvGPU_Intel(params)
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

module.exports = { start, stop, appendFrame }