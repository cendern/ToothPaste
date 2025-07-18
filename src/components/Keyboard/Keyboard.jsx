import React, { useEffect, useState, useRef } from "react";

const keys = [
  ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "←"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\" ],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "↩"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/",],
];

const MAX_HISTORY_LENGTH = keys[0].length;
const HISTORY_DURATION = 3000;

const Keyboard = () => {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [history, setHistory] = useState([]);
  const timeoutsRef = useRef({});
  const lastComboRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key === " " ? "SPACE" : e.key.toUpperCase();

      setActiveKeys((prevKeys) => {
        const updated = new Set(prevKeys);
        updated.add(key);
        const sortedCombo = Array.from(updated).sort().join("+");

        // Only register new combo
        if (sortedCombo !== lastComboRef.current) {
          lastComboRef.current = sortedCombo;

          // Add to history
          const newEntry = { key: sortedCombo, id: Date.now() };
          setHistory((prev) => {
            const updatedHistory = [...prev, newEntry].slice(-MAX_HISTORY_LENGTH);
            return updatedHistory;
          });

          // Remove from history after delay
          const id = newEntry.id;
          timeoutsRef.current[id] = setTimeout(() => {
            setHistory((prev) => prev.filter((entry) => entry.id !== id));
            delete timeoutsRef.current[id];
          }, HISTORY_DURATION);
        }

        return updated;
      });
    };

    const handleKeyUp = (e) => {
      const key = e.key === " " ? "SPACE" : e.key.toUpperCase();
      setActiveKeys((prevKeys) => {
        const updated = new Set(prevKeys);
        updated.delete(key);
        lastComboRef.current = null; // Reset combo on key release
        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const isKeyActive = (key) => activeKeys.has(key);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
      
      
      {/* Command History */}
      <div className="flex space-x-2 overflow-hidden">
        {history.map((entry) => (
          <div
            key={entry.id}
            style={{animationDuration: `${HISTORY_DURATION}ms`}}
            className="px-2 py-1 flex items-right justify-right text-sm font-bold rounded border border-gray-500 bg-primary animate-fadeout"
          >
            {entry.key}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {row.map((key) => (
            <div
              key={key}
              className={`w-10 h-12 border border-gray-500 flex items-center justify-center text-lg rounded ${
                isKeyActive(key) ? "bg-primary" : "bg-black"
              }`}
            >
              {key}
            </div>
          ))}
        </div>
      ))}

      {/* Spacebar */}
      <div className="flex justify-center mt-2">
        <div
          className={`w-64 h-12 border border-gray-500 flex items-center justify-center text-lg rounded ${
            isKeyActive("SPACE") ? "bg-primary" : "bg-black"
          }`}
        >
          SPACE
        </div>
      </div>
    </div>
  );
};

export default Keyboard;