const BrowserWindow = require("electron").BrowserWindow
const performanceNow = require("performance-now")

const stub_page = "file:///" + __dirname + '/stub-page/stub.html'

class OffscreenBrowser
{
    constructor(onPaintCallback,
                { resolution, src, fps })
    {
        this.#onPaintCallback = onPaintCallback

        this.#window = new BrowserWindow(
        {
            useContentSize: true, // doesn't work on Windows, but work ion Linux
            webPreferences:
            {
                offscreen: true
            }
        });

        const times = []
        const outputDelay = 1000
        let lastOutputTime = 0
        let fps_;
        this.#window.webContents.on('paint', (event, dirty, image) =>
        {
            const now = performanceNow()
            while (times.length > 0 && times[0] <= now - 1000)
            {
                times.shift();
            }
            times.push(now);
            fps_ = times.length;
            if (times[times.length - 1] - lastOutputTime >= outputDelay)
            {
                lastOutputTime = times[times.length - 1];
                console.log(fps_);
            }

            /*console.log('Image size: ', image.getSize().width, image.getSize().height, image.getScaleFactors(),
                        'Dirty size: ', dirty.width, dirty.height,
                        'Content size: ', this.#window.getContentBounds().width, this.#window.getContentBounds().height)
            console.log('Windows size: ', this.#window.getSize()[0], this.#window.getSize()[1])*/

            this.#onPaintCallback(image)
        });

        this.#window.webContents.setFrameRate(fps)

        this.resize(resolution)
        this.loadUrl(src)
    }

    loadUrl(url)
    {
        let failedLoadStubPage = ()=>
        {
            console.error("Stub page not found:", stub_page)
        }

        let pageLoaded = ()=>
        {
            console.log("Page loaded ... ")
        }

        if (!url)
        {
            console.log("Invalid page url:", url)
            this.#window.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
        }
        else
        {
            this.#window.loadURL(url).then(pageLoaded, () =>
            {
                console.log(url, 'not found, loading stub page')
                this.#window.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
            })
        }
    }

    resize({ width, height })
    {
        if (Number.isInteger(width) && Number.isInteger(height))
        {
            const magicNumber = 1.25;
            let correctWidth = Math.floor(width / magicNumber)
            let correctHeight = Math.floor(height / magicNumber)
            this.#window.setSize(correctWidth, correctHeight)
        }
    }

    close()
    {
        this.#window.destroy()
    }

    #window
    #onPaintCallback
}

module.exports = OffscreenBrowser