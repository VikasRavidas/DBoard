import React, { useContext } from "react";
import { TOOL_ITEMS } from "../../constants";
import { BoardContext } from "../store/Board-context";
import {
  FaSlash,
  FaRegSquare,
  FaRegCircle,
  FaArrowRight,
  FaPencilAlt,
  FaEraser,
  FaUndo,
  FaRedo,
} from "react-icons/fa";

const Toolbar = () => {
  const {
    activeToolItems,
    handleSetActiveToolItems,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useContext(BoardContext);

  const handleToolClick = (tool) => {
    console.log("Setting tool to:", tool); // Debug log
    handleSetActiveToolItems(tool);
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 flex gap-2 bg-white p-2 rounded-lg shadow-lg">
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.LINE)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.LINE
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Line"
      >
        <FaSlash />
      </button>
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.RECTANGLE)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.RECTANGLE
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Rectangle"
      >
        <FaRegSquare />
      </button>
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.CIRCLE)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.CIRCLE
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Circle"
      >
        <FaRegCircle />
      </button>
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.ARROW)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.ARROW
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Arrow"
      >
        <FaArrowRight />
      </button>
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.BRUSH)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.BRUSH
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Brush"
      >
        <FaPencilAlt />
      </button>
      <button
        onClick={() => handleToolClick(TOOL_ITEMS.ERASER)}
        className={`p-2 rounded-lg ${
          activeToolItems === TOOL_ITEMS.ERASER
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100"
        }`}
        title="Eraser"
      >
        <FaEraser />
      </button>
      <div className="h-8 w-px bg-gray-300 mx-2 my-2" />
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`p-2 rounded-lg ${
          !canUndo ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
        title={!canUndo ? "Nothing to undo" : "Undo"}
      >
        <FaUndo />
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`p-2 rounded-lg ${
          !canRedo ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
        title={!canRedo ? "Nothing to redo" : "Redo"}
      >
        <FaRedo />
      </button>
    </div>
  );
};

export default Toolbar;
