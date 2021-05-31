const BrowserWindow = require("electron").BrowserWindow
const performanceNow = require("performance-now")

class OffscreenBrowser
{
    constructor({ resolution, fps })
    {
        this.#window = new BrowserWindow(
        {
            show: false,
            kiosk: true,
            width: resolution.width,
            height: resolution.height,
            webPreferences:
            {
                offscreen: true
            },
        });

        this.#window.webContents.setFrameRate(fps)
    }

    loadUrl(url)
    {
        const stub_page = "file:///" + __dirname + '/stub-page/stub.html'

        let failedLoadStubPage = ()=>
        {
            console.error("Stub page not found:", stub_page)
        }

        let pageLoaded = ()=>
        {
            console.log("Page loaded")
        }

        if (!url)
        {
            console.log("Invalid page url:", url, 'loading stub page')
            this.#window.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
        }
        else
        {
            this.#window.loadURL(url).then(
            ()=>
            {
                pageLoaded()
                this.#window.webContents.on('unresponsive', ()=>
                {
                    console.log('Current page unresponsive, trying reload')
                    //this.#window.webContents.reload()
                    this.#window.webContents.reloadIgnoringCache()
                })
            },
            () =>
            {
                console.log('Failed to load the given page:', url, "loading stub page")
                this.#window.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
            })
        }
    }

    resize({ width, height })
    {
        this.#window.setSize(width, height)

        /*if (Number.isInteger(width) && Number.isInteger(height))
        {
            const magicNumber = 1.25;
            let correctWidth = Math.floor(width / magicNumber)
            let correctHeight = Math.floor(height / magicNumber)
            this.#window.setSize(correctWidth, correctHeight)
        }*/
    }

    setOnPaintCallback(callback)
    {
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

            callback(image)
        });
    }

    setOnCloseCallback(callback)
    {
        this.#window.on('close', callback)
    }

    close()
    {
        this.#window.close()
    }

    #window
}

module.exports = OffscreenBrowser