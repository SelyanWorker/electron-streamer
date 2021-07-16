const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

let params = yargs(hideBin(process.argv))
    .option('tcp_protocol', {
        alias: 'tcp',
        type: 'string',
        description: 'tcp options',
        default: '127.0.0.1:23000'
    })
    .option('src', {
        alias: 's',
        type: 'string',
        description: 'src page',
        default: ''
    })
    .option('res', {
        alias: 'r',
        type: 'string',
        description: 'resolution',
        default: '1280x768'
    })
    .option('fps', {
        type: 'number',
        description: 'fps',
        default: 30
    })
    .option('ffmpeg', {
        alias: 'f',
        type: 'string',
        description: 'ffmpeg path',
        default: 'ffmpeg'
    })
    .option('url', {
        alias: 'u',
        type: 'string',
        description: 'destination stream url',
        default: '127.0.0.1'
    })
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'destination stream port',
        default: 10004
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        description: 'output to file/url',
        default: 'url'
    })
    .argv

function getResolution(strRes)
{
    let resStringArray = strRes.split('x')
    return {
        width: parseInt(resStringArray[0]),
        height: parseInt(resStringArray[1])
    }
}

const FfmpegStreamer = require("./stream/ffmpeg")
const OffscreenBrowser = require("./stream/offscreen-browser")
const app = require("electron").app

app.whenReady().then(() =>
{
    let ffmpeg = new FfmpegStreamer

    let resolution = getResolution(params.res)

    let browser = new OffscreenBrowser({
        resolution: resolution,
        src: params.src,
        fps: params.fps
    })
    browser.setOnPaintCallback((image) =>
    {
        ffmpeg.appendFrame(image.getBitmap())
    })
    browser.setOnCloseCallback(()=>
    {
        ffmpeg.stop()
    })

    browser.loadUrl(params.src)

    ffmpeg.start({
        mode: 'raw',
        resolution: resolution,
        codec: 'h264',
        url: params.url,
        port: params.port,
        fps: params.fps,
        ffmpeg_path: params.ffmpeg,
        output: params.output
    })
})