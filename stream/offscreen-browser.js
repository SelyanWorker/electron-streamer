const BrowserWindow = require("electron").BrowserWindow
const performanceNow = require("performance-now")

const stub_page = __dirname + '\\stub-page\\stub.html'

class OffscreenBrowser
{
    constructor(onPaintCallback)
    {
        this.#onPaintCallback = onPaintCallback

        this.#window = new BrowserWindow(
        {
            //useContentSize: true,
            /*show: false,
            frame: false,*/
            webPreferences:
            {
                offscreen: true
            }
        });

        const times = []
        const outputDelay = 1000
        let lastOutputTime = 0
        let fps;
        this.#window.webContents.on('paint', (event, dirty, image) =>
        {
            const now = performanceNow()
            while (times.length > 0 && times[0] <= now - 1000)
            {
                times.shift();
            }
            times.push(now);
            fps = times.length;
            if (times[times.length - 1] - lastOutputTime >= outputDelay)
            {
                lastOutputTime = times[times.length - 1];
                console.log(fps);
            }

            this.#onPaintCallback(image)
        });

        this.#window.webContents.setFrameRate(30)
    }

    loadUrl(url)
    {
        if (!url)
            this.#window.loadURL(stub_page)
        else
            this.#window.loadURL(url).then(null, () =>
            {
                console.log(url, 'not found, loading stub page')
                this.#window.loadURL(stub_page)
            })
    }

    resize({ width, height })
    {
        if (Number.isInteger(width) && Number.isInteger(height))
            this.#window.setSize(width, height)
    }

    close()
    {
        this.#window.destroy()
    }

    #window
    #onPaintCallback
}

module.exports = OffscreenBrowser