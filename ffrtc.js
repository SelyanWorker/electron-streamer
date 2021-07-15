// Makes element to play video from server via webrtc.
// Automatically re-connects ad infinitum.
// Arguments:
//   videoElement - <video> tag object
//   webSocketUrl - server url, i.e. "ws://127.0.0.1:8081/ffrtc"
//   videoStateCallback - (optional) function invoked when video state is changed.
//                        Called with 'true' when starts receiving video.
//                        Called with 'false' when video timeouts.
//   enableLog - (optional) if true, everything is logged, otherwise nothing is
//
function playWebrtc(videoElement, webSocketUrl, videoStateCallback, enableLog)
{
    //
    // Settings
    //

    // SDP mode:
    //  true  - send local offer, wait remote answer
    //  false - wait remote offer, send local answer
    // Must be set to value opposite to the one set on server
    const localOffer = false

    // milliseconds; timeout before trying again
    const reconnectTimeout = 1000

    // used in server messages
    const descr_separator = '\1'

    // milliseconds; video is reported lost after that
    const videoTimeout = 3000

    //
    // Current state
    //

    var pc = null // WebRTC PeerConnection
    var sock = null // Websocket used for signaling

    // WebRTC descriptions: type + SDP
    var localDescr = null
    var remoteDescr = null
    var sentLocalDescr = false

    var reconnectingAlready = false

    //
    // Video state
    //

    // interval id for stats querying
    var statsInterval

    var lastReceivedVideo
    var videoLost

    // milliseconds; how often stats are queried
    const statsIntervalValue = 1000

    if (!videoStateCallback) {// make it always defined
        videoStateCallback = function(){}
    }
    if (enableLog) {
        var f = videoStateCallback
        videoStateCallback = function(state) {
            console.log('ffrtc: receiving video: ', state)
            f(state)
        }
    }

    //
    // Funcs
    //

    // begin connecting
    function start() {
        reconnectingAlready = false
        localDescr = null
        remoteDescr = null
        sentLocalDescr = false

        if (localOffer) createPeerConnection()
        createWebsocket()
    }

    // destroy everything
    function stop() {
        if (statsInterval) window.clearInterval(statsInterval)

        // destroy reference to media track
        videoElement.srcObject = null

        if (pc) pc.close()
        if (sock) sock.close()

        pc = null
        sock = null
    }

    // begin reconnect attempt
    function reconnect() {
        if (reconnectingAlready) return
        if (enableLog) {
            console.log('ffrtc: reconnecting...')
        }
        videoStateCallback(false)

        stop()
        window.setTimeout(start, reconnectTimeout) // calls start after timeout
        reconnectingAlready = true
    }

    function createPeerConnection() {
        pc = new RTCPeerConnection()

        if (enableLog) {
            // in old browsers these functions can be invoken when pc is already null
            pc.addEventListener('icegatheringstatechange',  function() {if (pc) console.log('ffrtc: icegatheringstatechange:',  pc.iceGatheringState )})
            pc.addEventListener('iceconnectionstatechange', function() {if (pc) console.log('ffrtc: iceconnectionstatechange:', pc.iceConnectionState)})
            pc.addEventListener('signalingstatechange',     function() {if (pc) console.log('ffrtc: signalingstatechange:',     pc.signalingState    )})
        }

        // detect connection is broken
        // pc.connectionState should be used, but it's not implemented in Firefox 85 and older Chromes
        pc.addEventListener('iceconnectionstatechange', function() {
            var fail = (!pc || pc.iceConnectionState == 'failed' || pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'closed')
            if (fail) {
                reconnect()
            }
        })

        // actually show video
        pc.addEventListener('track', function(evt) {
            if (evt.track.kind == 'video') {
                videoElement.srcObject = evt.streams[0]
                if (enableLog) {
                    console.log('ffrtc: got video track')
                }

                lastReceivedVideo = Date.now()
                videoLost = true
                statsInterval = window.setInterval(function() {
                    pc.getStats(null).then(function(stats) {
                        stats.forEach(function(report) {
                            if (report.type == "inbound-rtp") {
                                lastReceivedVideo = report.lastPacketReceivedTimestamp
                            }
                        })

                        if (Date.now() - lastReceivedVideo > videoTimeout) {
                            if (!videoLost) {
                                videoLost = true
                                videoStateCallback(false)
                            }
                        }
                        else if (videoLost) {
                            videoLost = false
                            videoStateCallback(true)
                        }
                    })
                }, statsIntervalValue)
            }
        })

        // This is da wey, but it's not available in Chrome on Astra Linux.
        // If we start using Chrome 69+ - uncomment this
        // and remove arguments to createOffer() and createAnswer()
        //pc.addTransceiver('video', { 'direction': "recvonly" })

        if (localOffer) {
            pc.createOffer({ 'offerToReceiveVideo': true }).then(function(d) {
                localDescr = d
                try_send_local_descr()
                pc.setLocalDescription(localDescr)
            })
        }
    }

    function createWebsocket() {
        sock = new WebSocket(webSocketUrl)

        if (enableLog) {
            sock.addEventListener('open',  function() {console.log('ffrtc: socket open')})
            sock.addEventListener('close', function() {console.log('ffrtc: socket closed')})
            sock.addEventListener('error', function() {console.log('ffrtc: socket error')})
        }

        // has connected
        sock.addEventListener('open', function() {
            if (localOffer) {
                try_send_local_descr()
            }
        })

        // received message
        sock.addEventListener('message', function(event) {
            var parsedMsg = event.data.split(descr_separator)
            remoteDescr = new RTCSessionDescription({ 'type': parsedMsg[0], 'sdp': parsedMsg[1] })

            if (enableLog) {
                console.log('ffrtc: got remote descr: ', remoteDescr)
            }
            
            if (!pc) createPeerConnection()
            var hasRemote = pc.setRemoteDescription(remoteDescr)
            if (!localOffer) {
                hasRemote.then(function() {
                    pc.createAnswer().then(function(d) {
                        localDescr = d
                        try_send_local_descr()
                        pc.setLocalDescription(localDescr)
                    })
                })
            }
        })

        // closed or failed
        sock.addEventListener('close', function() {
            // signaling wasn't complete
            if (!remoteDescr || !sentLocalDescr) {
                reconnect()
            }
        })
    }

    // sends if has localSdp AND socket is connected
    function try_send_local_descr() {
        if (localDescr && sock && sock.readyState == 1) {
            var s = localDescr.type + descr_separator + localDescr.sdp
            sock.send(s)
            sentLocalDescr = true

            if (enableLog) {
                console.log('ffrtc: sent local descr: ', localDescr)
            }
        }
    }

    start()
    if (enableLog) {
	    console.log('ffrtc: inited')
    }
}
