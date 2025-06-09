import React, { useState, useEffect, useRef } from "react";
import "./CustomTyping.css"; // We'll define animations here

const CustomTyping = () => {
  const [caretIndex, setCaretIndex] = useState(0);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (e) => {
    setInput(e.target.value);
    setCaretIndex(e.target.selectionStart);
  };

  const handleKeyUp = (e) => {
    setCaretIndex(e.target.selectionStart);
  };

  const handleClick = (e) => {
    setCaretIndex(e.target.selectionStart);
  };

  const renderContentWithCaret = () => {
    const before = input.slice(0, caretIndex);
    const after = input.slice(caretIndex);

    return (
      <>
        {before}
        <span className="custom-caret" />
        {after}
      </>
    );
  };

  return (
    <div className="typing-container" onClick={() => inputRef.current?.focus()}>
      <pre className="text-display">
        {renderContentWithCaret()}
      </pre>
      <textarea
        ref={inputRef}
        value={input}
        onChange={handleInput}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        className="hidden-input"
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};


export default CustomTyping;
