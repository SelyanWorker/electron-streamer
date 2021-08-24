const BrowserWindow = require("electron").BrowserWindow
const performanceNow = require("performance-now")
const urlExists = require('url-exists');

class OffscreenBrowser
{
    constructor({ resolution, fps })
    {
        this.#window = new BrowserWindow(
        {
            show: false,
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

        let loadStubPage = ()=>
        {
            this.#window.loadURL(stub_page).then(
                () =>
                {
                    console.log("Stub page was loaded")
                },
                () =>
                {
                    console.log("Failed to load stub page")
                })

            this.#intervalObject = setInterval(()=>
            {
                console.log("Try to reload page ...")
                urlExists(url, (err, exists)=>{
                    if (exists)
                    {
                        clearInterval(this.#intervalObject)
                        this.loadUrl(url)
                    }
                });
            }, 1000)
        }

        let loadGivenPage = ()=>
        {
            console.log("Try to load the given page: ", url)
            this.#window.loadURL(url).then(
                ()=>
                {
                    console.log("Page was loaded")
                },
                ()=>
                {
                    console.log("Failed to load page. Try to load stub page.")
                    loadStubPage()
                })
        }

        urlExists(url, (err, exists)=>{
            if (exists)
            {
                loadGivenPage()
            }
            else
            {
                loadStubPage()
            }
        });
    }

    resize({ width, height })
    {
        this.#window.setSize(width, height)
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

            callback(image)
        });
    }

    setOnCloseCallback(callback)
    {
        this.#window.on('close', ()=>
        {
            callback()
            this.#window.destroy()
        })
    }

    close()
    {
        this.#window.destroy()
    }

    #window
    #intervalObject
}

module.exports = OffscreenBrowser