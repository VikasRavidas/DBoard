import React, { useContext } from "react";
import { TOOL_ITEMS } from "../../constants";
import { BoardContext } from "../store/Board-context";
import { useToolbox } from "../store/toolbox-provider";
import {
  FaSlash,
  FaRegSquare,
  FaRegCircle,
  FaArrowRight,
  FaPencilAlt,
  FaEraser,
  FaUndo,
  FaRedo,
  FaFont,
  FaDownload,
  FaMinus,
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
  const { toolboxState } = useToolbox();

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataURL;
    link.click();
  };

  const tools = [
    { id: TOOL_ITEMS.BRUSH, icon: <FaPencilAlt />, label: "Brush" },
    { id: TOOL_ITEMS.LINE, icon: <FaMinus />, label: "Line" },
    { id: TOOL_ITEMS.RECTANGLE, icon: <FaRegSquare />, label: "Rectangle" },
    { id: TOOL_ITEMS.CIRCLE, icon: <FaRegCircle />, label: "Circle" },
    { id: TOOL_ITEMS.ARROW, icon: <FaArrowRight />, label: "Arrow" },
    { id: TOOL_ITEMS.TEXT, icon: <FaFont />, label: "Text" },
    { id: TOOL_ITEMS.ERASER, icon: <FaEraser />, label: "Eraser" },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-row gap-2">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleSetActiveToolItems(tool.id)}
          className={`p-2 rounded-lg transition-colors ${
            activeToolItems === tool.id
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-100"
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      <div className="w-px h-8 bg-gray-200 mx-2 self-center" />
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
      <div className="w-px h-8 bg-gray-200 mx-2 self-center" />
      <button
        onClick={handleDownload}
        className="p-2 rounded-lg hover:bg-gray-100"
        title="Download"
      >
        <FaDownload />
      </button>
    </div>
  );
};

export default Toolbar;
