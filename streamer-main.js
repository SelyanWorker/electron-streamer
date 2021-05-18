const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

let params = yargs(hideBin(process.argv))
    .option('tcp_protocol ', {
        alias: 'tcp',
        type: 'string',
        description: 'tcp options',
        default: '127.0.0.1:23000'
    })
    .argv

const FfmpegStreamer = require("./stream/ffmpeg")

let ffmpeg = new FfmpegStreamer

let browser
const OffscreenBrowser = require("./stream/offscreen-browser")
const app = require("electron").app

let ffmpeg_params = {
    resolution: { width: 1024, height: 768 },
    codec: 'h264',
    protocol: 'udp',
    url: '127.0.0.1',
    port: 23000 }

app.whenReady().then(() =>
{
    browser = new OffscreenBrowser((image) => {
        ffmpeg.appendFrame(image.toJPEG(100))
    })
    browser.loadUrl()

    ffmpeg.start(ffmpeg_params)
})

/*setInterval(()=>
{
    ffmpeg.stop()
    ffmpeg.start(ffmpeg_params)
}, 10000)*/


//--src C:\dev\repos\cesium-electron-sandbox\pages\cesium-plain\plain.html