const BrowserWindow = require("electron").BrowserWindow

let browser

function create({ onPaintCallback, resolution, fps })
{
    browser = new BrowserWindow(
    {
        width: resolution.width,
        height: resolution.height,
        webPreferences:
        {
            offscreen: true
        }
    });

    setOnPaintCallback(onPaintCallback)

    browser.webContents.setFrameRate(fps)
}

function loadUrl(url)
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
        browser.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
    }
    else
    {
        browser.loadURL(url).then(pageLoaded, () =>
        {
            console.log('Failed to load the given page:', url)
            browser.loadURL(stub_page).then(pageLoaded, failedLoadStubPage)
        })
    }
}

function resize({ width, height })
{
    browser.setSize(width, height)

    /*if (Number.isInteger(width) && Number.isInteger(height))
    {
        const magicNumber = 1.25;
        let correctWidth = Math.floor(width / magicNumber)
        let correctHeight = Math.floor(height / magicNumber)
        browser.setSize(correctWidth, correctHeight)
    }*/
}

function close()
{
    browser.close()
}

function setOnCloseCallback(callback)
{
    browser.on('close', callback)
}

function setOnPaintCallback(callback)
{
    const times = []
    const outputDelay = 1000
    let lastOutputTime = 0
    let fps_;
    browser.webContents.on('paint', (event, dirty, image) => {
        const performanceNow = require("performance-now")
        const now = performanceNow()
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps_ = times.length;
        if (times[times.length - 1] - lastOutputTime >= outputDelay) {
            lastOutputTime = times[times.length - 1];
            console.log(fps_);
        }

        /*console.log('Image size: ', image.getSize().width, image.getSize().height, image.getScaleFactors(),
            'Dirty size: ', dirty.width, dirty.height,
            'Content size: ', browser.getContentBounds().width, browser.getContentBounds().height)
        console.log('Windows size: ', browser.getSize()[0], browser.getSize()[1])*/

        callback(image)
    });
}

module.exports = { create, loadUrl, resize, close, setOnCloseCallback, setOnPaintCallback }