import React, { createContext, useContext, useState } from "react";


// Base class for all packets (optional, for shared logic)
class Packet {
    MAX_DATA_SIZE = 200; // Safe estimate for max gATT payload size - protocol overhead

    constructor(type, payload, serial = 0, totalChunks = 1) {
        this.type = type; // string or enum to identify packet type
        this.payload; // The data contents of the packet
        this.serial = serial; // Packet number
        this.totalChunks = totalChunks;
    }

    // Instance method to turn a packet into JSON
    toJSON() {
        return JSON.stringify(this);
    }

    // Instance method to create a packet -> returns an iterator of one or more packets where payload size < max_data_size
    static async *create(type, payload) {
        const data = (payload instanceof Uint8Array) ? payload : new Uint8Array(payload);
        const totalChunks = Math.ceil(data.length / Packet.MAX_DATA_SIZE);
        
        for (let i = 0; i < totalChunks; i++){
            const chunk = data.slice(i * Packet.MAX_DATA_SIZE, (i+1) * Packet.MAX_DATA_SIZE);
            yield new Packet(type, chunk, i, totalChunks);
        }
    }

    // Static method to create a packet from JSON
    static fromJSON(jsonStr) {
        const obj = JSON.parse(jsonStr);
        switch (obj.type) {
            case 'HandshakePacket': return HandshakePacket.fromObject(obj);
            case 'DataPacket': return DataPacket.fromObject(obj);
            case 'ErrorPacket': return ErrorPacket.fromObject(obj);
            default: throw new Error(`Unknown packet type: ${obj.type}`);
        }
    }
}

class HandshakePacket extends Packet {
    constructor(deviceId, publicKey) {
        super('HandshakePacket');
        this.deviceId = deviceId;
        this.publicKey = publicKey;
    }

    static fromObject(obj) {
        return new HandshakePacket(obj.deviceId, obj.publicKey);
    }
}

class DataPacket extends Packet {
    constructor(payload, sequence) {
        super('DataPacket');
        this.payload = payload;         // e.g., encrypted message
        this.sequence = sequence;       // for ordering
    }

    static fromObject(obj) {
        return new DataPacket(obj.payload, obj.sequence);
    }
}