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

let resolution = { width: 1920, height: 1080 }
let ffmpeg_params =
{
    mode: 'raw',
    resolution: resolution,
    codec: 'h264',
    protocol: 'udp',
    url: '127.0.0.1',
    port: 23000
}


app.on( 'child-process-gone', (event, details)=>
{
    console.log(details.type, details.reason, details.exitCode)
})

app.on('render-process-gone', (event, webContents, details)=>
{
    console.log(details.reason, webContents ,details.exitCode)
})

app.whenReady().then(() =>
{
    browser = new OffscreenBrowser((image) => {
        ffmpeg.appendFrame(image.getBitmap())
        //ffmpeg.appendFrame(image.toJPEG(100))
        /*const fs = require('fs')
        fs.writeFileSync('ex.raw', image.getBitmap())*/
    })
    browser.resize(resolution)
    browser.loadUrl("D:/dev/repos/cesium-electron-sandbox/example/cesium-plain/plain.html")

    //browser.loadUrl()

    ffmpeg.start(ffmpeg_params)

})


setTimeout(()=>
{
    ffmpeg.stop()
    browser.close()
    console.log("Test passed!!!")
}, 1000000)

/*setInterval(()=>
{
    ffmpeg.stop()
    ffmpeg.start(ffmpeg_params)
}, 10000)*/


//--src C:/dev/repos/cesium-electron-sandbox/pages/cesium-plain/plain.html