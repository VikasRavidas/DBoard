import React, { useEffect, useRef } from "react";

const TextInput = ({ onSubmit, onCancel, initialText = "", position }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit(e.target.value);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialText}
        onKeyDown={handleKeyDown}
        onBlur={() => onSubmit(inputRef.current.value)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "24px",
          fontFamily: "Arial",
          color: "#000",
          padding: "4px",
          minWidth: "50px",
        }}
      />
    </div>
  );
};

export default TextInput;
