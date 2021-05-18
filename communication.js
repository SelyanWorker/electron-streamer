let net = require('net');

class Communicator {
    constructor() {
        this.#socket = new net.Socket();

        this.#socket.on('close', function ()
        {
            console.log('Connection closed');
        });

        this.#socket.on('data', (data)=>
        {
            this.#parseBuffer(data)
        });
    }

    connect(address, port) {
        this.#socket.connect(port, address, () => {
            console.log('Connected');
        });
    }

    setCallback(callable) {
        this.#callback = callable
    }

    // buffer per command
    #parseBuffer(buffer)
    {
        const exp_header_label = 0x4815
        let header_label = buffer.readInt16BE(0)
        if (header_label != exp_header_label)
            return

        let command_type = buffer.readInt16BE(2)
        if (command_type > 4 && command_type < 9)
            return

        let checksum = buffer.readInt16BE(4)
        let length = buffer.readInt16BE(6)

        switch (command_type) {
            case 5:

                break

        }

        this.#callback()
    }

    #parseLoadUrlCommand(buffer)
    {

    }

    #socket
    #callback
}
