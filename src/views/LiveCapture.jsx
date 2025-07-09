import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import { ECDHContext } from "../context/ECDHContext";
import { BLEContext } from "../context/BLEContext";

// Async queue utility
function createAsyncQueue() {
  const queue = [];
  let resolvers = [];

  const push = (item) => {
    if (resolvers.length > 0) {
      const resolve = resolvers.shift();
      resolve(item);
    } else {
      queue.push(item);
    }
  };

  const iterator = {
    [Symbol.asyncIterator]: async function* () {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          const item = await new Promise((resolve) => {
            resolvers.push(resolve);
          });
          yield item;
        }
      }
    },
  };

  return { push, iterator };
}

export default function LiveCapture() {
  const [buffer, setBuffer] = useState(""); // Displayed buffer of typed chars
  const queueRef = useRef(createAsyncQueue());
  const processingRef = useRef(false);
  const { pktCharacteristic, status, readyToReceive } = useContext(BLEContext);
  const { createEncryptedPackets } = useContext(ECDHContext);
  const inputRef = useRef(null);

  const waitForReady = useCallback(() => {
    if (!readyToReceive.current.promise) {
      readyToReceive.current.promise = new Promise((resolve) => {
        readyToReceive.current.resolve = resolve;
      });
    }
    return readyToReceive.current.promise;
  }, [readyToReceive]);

  useEffect(() => {
    const processQueue = async () => {
      console.log("Starting to process queue...");
      for await (const char of queueRef.current.iterator) {
        console.log("Got char from queue:", char);
        for await (const packet of createEncryptedPackets(0, char)) {
          console.log("Sending packet:", char);
          await pktCharacteristic.writeValueWithoutResponse(packet.serialize());

          waitForReady();
          await readyToReceive.current.promise;
        }
      }
    };

    if (!processingRef.current) {
      processingRef.current = true;
      processQueue();
    }
  }, [pktCharacteristic, waitForReady, readyToReceive]);

  const handleKeyDown = (e) => {
    e.preventDefault();

    let char = "";

    if (e.key === "Backspace") {
      setBuffer((prev) => prev.slice(0, -1));
      char = "\b";
    } else if (e.key === "Enter") {
      setBuffer((prev) => prev + "\n");
      char = "\n";
    } else if (e.key.length === 1) {
      setBuffer((prev) => prev + e.key);
      char = e.key;
    } else {
      // ignore Shift, Alt, Arrow keys, etc.
      return;
    }

    if (queueRef.current && char) {
      queueRef.current.push(char);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="p-4">
      <label className="block text-sm font-medium text-gray-200 mb-1">
        Type to Send:
      </label>
      <div
        ref={inputRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[48px] p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
      >
        {buffer || <span className="text-gray-500">Start typing...</span>}
      </div>
    </div>
  );
}
