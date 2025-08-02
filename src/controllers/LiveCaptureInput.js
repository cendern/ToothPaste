import { useRef, useState, useEffect, useCallback, useContext } from 'react';
import { BLEContext } from "../context/BLEContext";
import { ECDHContext } from "../context/ECDHContext";


export function useInputController() {
    // BLE and ECDH contexts
    const { pktCharacteristic, status, readyToReceive, sendEncrypted } = useContext(BLEContext);
    const { createEncryptedPackets } = useContext(ECDHContext);
    
    // Text input handler settings
    const DEBOUNCE_INTERVAL_MS = 100; // Interval to wait before sending input data
    const inputRef = useRef(null); // The input DOM element reference


    const ctrlPressed = useRef(false); // Flag to indicate if Ctrl is pressed
    const [buffer, setBuffer] = useState(""); // Holds the full input to render (not needed for current implementation)
    const bufferRef = useRef(""); // Tracks the current input buffer
    const lastSentBuffer = useRef(""); // tracks last sent buffer
    const isIMERef = useRef(false); // Flag to indicate if IME is active
    const isComposingRef = useRef(false);
    const lastInputRef = useRef(""); // Last input value to compare with current input
    const compositionStartRef = useRef(""); // Flag to indicate if composition has started

    const debounceTimeout = useRef(null); // Holds the promise to send the buffer data after DEBOUNCE_INTERVAL_MS
    const specialEvents = useRef([]); // store special keys pressed but not modifying buffer

    // Send packets periodically unless reset
    const sendDiff = useCallback(async () => {
        var keycode = new Uint8Array(8); // Payload for special characters
        keycode[0] = 1; // DATA_TYPE is TEXT

        const current = bufferRef.current; // Current text data (new data + last sent data)
        const previous = lastSentBuffer.current; // Last sent text data

        let payload = "";

        // If data was added, add a slice of the new buffer that is the size of the difference to the payload
        if (current.length > previous.length) {
            payload += current.slice(previous.length);

            // If data was removed, add n backspaces to the payload where n is the difference in length
        } else if (current.length < previous.length) {
            const numDeleted = previous.length - current.length;
            payload += "\b".repeat(numDeleted);
        }

        // Append special events payloads
        if (specialEvents.current.length > 0) {
            for (const ev of specialEvents.current) {
                switch (ev) {
                    case "Backspace":
                        payload += "\b";
                        break;
                    case "Enter":
                        payload += "\n";
                        break;
                    case "Tab":
                        payload += "\t";
                        break;
                    case "ArrowUp":
                        keycode[1] = 0xda;
                        break;
                    case "ArrowDown":
                        keycode[1] = 0xd9;
                        break;
                    case "ArrowLeft":
                        keycode[1] = 0xd8;
                        break;
                    case "ArrowRight":
                        keycode[1] = 0xd7;
                        break;
                    // add other special keys as needed
                }
            }
            // If there are any special events that dont modify the buffer, send them as keycodes
            if (keycode[1] !== 0) {
                console.log("Sending keycode");
                sendEncrypted(keycode);
                keycode[1] = 0;
            }
            specialEvents.current = []; // Clear the special events after sending
        }

        

        if (payload.length === 0) {
            return;
        }

        // Update lastSentBuffer early to avoid duplicate sends
        lastSentBuffer.current = current;

        sendEncrypted(payload); // Send the input
    }, [createEncryptedPackets, pktCharacteristic, readyToReceive]);

    // Schedule the sendDiff function to be called after a delay, calling it again within the delay resets the timer
    const scheduleSend = useCallback(() => {
        // If schedulesSend is called while another timeout is running, reset it
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        // Schedule the sendDiff function after DEBOUNCE_INTERVAL_MS
        debounceTimeout.current = setTimeout(() => {
            sendDiff();
        }, DEBOUNCE_INTERVAL_MS);
    }, [sendDiff]);

    // Handle each keypress and reset the timer
    function updateBufferAndSend(newBuffer) {
        bufferRef.current = newBuffer;
        setBuffer(newBuffer);
        scheduleSend();
    }

    // Intercept keydown events
    function handleKeyDown(e) {
        console.log("Keydown event: ", e.key, "Code: ", e.code);


        const isCtrl = e.ctrlKey || e.metaKey;
        const buffer = bufferRef.current;

        if (isCtrl && e.key !== "Control") { // Just Ctrl does nothing
            if(e.key !== "v") {
                e.preventDefault();
                handleModifierShortcut(e, 0x80);
            }
            return;
        }

        // Let IME fill in the input without interference
        if (!isIMERef.current) {
            e.preventDefault();
        }

        if (e.altKey && e.key !== "Alt") { // Just Alt does nothing
            handleModifierShortcut(e, 0x83);
            return;
        }

        if (handleSpecialKey(e, buffer)) return; // Handle special keys first

        // if (e.key === "Control") {
        //     ctrlPressed.current = true;
        //     return;
        // }

        // If the key is a printing character (length 1), update the buffer and send
        if (e.key.length === 1) {
            lastInputRef.current = inputRef.current.value; // Update last input value to the current input
            updateBufferAndSend(buffer + e.key);
            return true;
        }
        return false;
    }

    // Helper: handle special key events (Backspace, Enter, Arrow, Tab)
    function handleSpecialKey(e, buffer) {
        switch (e.key) {
            case "Backspace":
                if (buffer.length === 0) {
                    specialEvents.current.push("Backspace");
                    scheduleSend();
                } else {
                    updateBufferAndSend(buffer.slice(0, -1));
                }
                return true;
            case "Enter":
                if (buffer.length === 0) {
                    specialEvents.current.push("Enter");
                    scheduleSend();
                } else {
                    updateBufferAndSend(buffer + "\n");
                }
                return true;
            case "Tab":
                e.preventDefault();
                updateBufferAndSend(buffer + "\t");
                return true;
            default:
                if (e.key.startsWith("Arrow")) {
                    specialEvents.current.push(e.key);
                    scheduleSend();
                    return true;
                }
                return false;
        }
    }

    // Helper: handle Ctrl/Alt + alpha shortcuts (Currently does not work with system shortcuts like alt+tab)
    function handleModifierShortcut(e, modifierByte) {
        let keypress = e.key === "Backspace" ? "\b" : e.key;
        let keycode = new Uint8Array(8);
        keycode[0] = 1;
        keycode[1] = modifierByte;
        keycode[2] = keypress.charCodeAt(0);
        sendEncrypted(keycode);
    }

    const handleKeyUp = (e) => {
        //console.log("Keyup event: ", e.key, "Code: ", e.code);

        if (e.key === "Control") {
            ctrlPressed.current = false;
        }
    };

    
    // Handle paste events (append pasted text to buffer)
    function handlePaste(e) {
        e.preventDefault();
        const newBuffer = buffer + e.clipboardData.getData("text");
        bufferRef.current = newBuffer;
        setBuffer(newBuffer);
        scheduleSend();
        return;
    }

    // When the input is a result of an IME non-composition event, it contains NEW data
    const handleOnBeforeInput = (event) => {
        console.log("Touch input event handled in beforeInput: ", event.data);
        isIMERef.current = true; // Set IME flag on beforeinput
        
        // Ignore any intermediate composition events
        if (isComposingRef.current) {
            return;
        }
        
        // Send the new data 
        updateBufferAndSend(bufferRef.current + event.data)
        isIMERef.current = false; // Reset IME flag on afterinput

        // -> This will fire an onChange event for the input div 
    };

    // Composition event handlers
    function handleCompositionStart(event) {
        console.log("Composition started++++++++++++++");
        isComposingRef.current = true;
        compositionStartRef.current = event.target.value; // Store the initial composition data

        console.log("Event target value: ", event.target.value);
        console.log("Last input value: ", lastInputRef.current);
 

    };

    // When composition ends it contains a CORRECTED word, which is presumably the final word typed
    function handleCompositionEnd(event) {
        console.log("Composition ended with data: ", event.data);
        
        if ((compositionStartRef.current).trim() !== event.data.trim())  {
            handleModifierShortcut({key: "Backspace"}, 0x80); // Delete the word typed word (ctrl + backspace)
            //backspaceString = "\b" * compositionStartRef.current.trim().length ; // Create a backspace string to delete the word typed
            updateBufferAndSend(bufferRef.current + event.data); // Add the new word
        }

        inputRef.current.value = ""; // Clear the input field
        lastInputRef.current = inputRef.current.value; // Update last input value to the new word
        isComposingRef.current = false;
    };
    
    function handleOnChange(event) {
        console.log("Input changed: ", event.target.value);
        console.log("Last input value: ", lastInputRef.current);

        // If the onChange event is fired but input size has shrunk, backspace was pressed
        if (lastInputRef.current.length > event.target.value.length) {
            console.log("Handling backspace for input change");
            handleSpecialKey({key:"Backspace"}, buffer);
        }

        lastInputRef.current = event.target.value; // Update last input value to the current input
    }
    
    return {
        inputRef,
        handleKeyDown,
        handleKeyUp,
        handlePaste,
        handleOnBeforeInput,
        handleCompositionStart,
        handleCompositionEnd,
        handleOnChange,
    };
}
