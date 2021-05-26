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
    port: 10004
}

let browser
app.whenReady().then(() =>
{
    browser = new OffscreenBrowser((image) => {
        ffmpeg.appendFrame(image.getBitmap())
        //ffmpeg.appendFrame(image.toJPEG(100))
        /*const fs = require('fs')
        fs.writeFileSync('ex.raw', image.getBitmap())*/
    })
    browser.resize(resolution)
    //browser.loadUrl("C:/dev/repos/cesium-electron-sandbox/example/cesium-simple/simple.html")
    browser.loadUrl("C:/dev/repos/cesium-electron-sandbox/example/cesium-plain/plain.html")
    //browser.loadUrl("http://192.168.165.124:8080/faces/_guest_dog_/geo.controller.l410f.L410fDependency.autoLoginVideoPage()")
    //browser.loadUrl("http://192.168.165.124:8080/faces/_guest_dog_/geo.controller.l410f.L410fDependency.autoLoginMapPage()")

    //browser.loadUrl()

    ffmpeg.start(ffmpeg_params)
})


/*setTimeout(()=>
{
    ffmpeg.stop()
    browser.close()
    console.log("Test passed!!!")
}, 1000000)*/

/*setInterval(()=>
{
    ffmpeg.stop()
    ffmpeg.start(ffmpeg_params)
}, 10000)*/


//--src C:/dev/repos/cesium-electron-sandbox/pages/cesium-plain/plain.html