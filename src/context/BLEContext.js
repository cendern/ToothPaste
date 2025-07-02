import React, { createContext, useContext, useState } from "react";
import { keyExists } from './Storage';


export const BLEContext = createContext();
export const useBLEContext = () => useContext(BLEContext);

export function BLEProvider({ children }) {
    const [status, setStatus] = React.useState(0); // 0 = disconnected, 1 = connected & paired, 2 = connected & not paired
    const [device, setDevice] = useState(null);
    const [server, setServer] = useState(null);
    const [characteristic, setCharacteristic] = useState(null);

    const serviceUUID = '19b10000-e8f2-537e-4f6c-d104768a1214'; // ClipBoard service UUID from example
    const characteristicUUID = '6856e119-2c7b-455a-bf42-cf7ddd2c5907'; // String characteristic UUID from example

    // Connecting to a clipboard device using WEB BLE
    const connectToDevice = async () => {
        try {
            // Look for device whose name starts with 'Clip' (change this later)
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: "Clip" },
                ],
                optionalServices: [serviceUUID],
            });

            // Set an on disconnect listener
            device.addEventListener("gattserverdisconnected", () => {
                setStatus(0);
                console.log("Clipboard Disconnected");
            });

            // Try to connect
            const server = await device.gatt.connect();

            // Get device info
            const service = await getServiceWithRetry(server, serviceUUID);
            const char = await service.getCharacteristic(characteristicUUID);

            setServer(server);
            setCharacteristic(char);
            setDevice(device);



            // If we don't know the public key of the device, we need to pair before sending
            if (!await keyExists(device.id)) {
                console.error("ECDH keys not found for device", device.id);
                setStatus(2);
            }

            // Else we can send
            else {
                setStatus(1);
            }
        }

        catch (error) {
            console.error("Connection failed", error);

            // Only set status to disconnected if the device is not connected, 
            // a ble scan cancel might fail but the device could still be connected
            if (!device || !device.gatt.connected) {
                setStatus(0);
            }
        }

    };

    // Retry service query to prevent "ghost connections" where BLE is connected but the service query returns too quickly
    const getServiceWithRetry = async (server, uuid, attempts = 3) => {
        for (let i = 0; i < attempts; i++) {
            try {
                return await server.getPrimaryService(uuid);
            } catch (err) {
                if (i < attempts - 1) {
                    console.warn("Retrying service discovery...", err);
                    await new Promise(r => setTimeout(r, 300));
                } else {
                    throw err;
                }
            }
        }
    }

    return (
        <BLEContext.Provider value={{
            device,
            setDevice,
            server,
            characteristic,
            status,
            connectToDevice
        }}>

            {children}
        </BLEContext.Provider>
    );
}