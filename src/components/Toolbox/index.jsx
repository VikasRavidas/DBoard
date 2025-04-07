import React, { useContext, useState } from "react";
import {
  TOOL_ITEMS,
  STROKE_TOOL_TYPES,
  FILL_TOOL_TYPES,
  SIZE_TOOL_TYPES,
  COLORS,
} from "../../constants";
import { BoardContext } from "../store/Board-context";
import { useToolbox } from "../store/toolbox-provider";
import { FaPalette, FaChevronRight } from "react-icons/fa";

const Toolbox = () => {
  const { activeToolItems, handleSetEraserSize, eraserSize } =
    useContext(BoardContext);
  const {
    toolboxState,
    changeStroke,
    changeFill,
    changeSize,
    changeFontFamily,
    fontFamilies,
  } = useToolbox();
  const [isMinimized, setIsMinimized] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  console.log("Toolbox State:", toolboxState);
  console.log("Active Tool:", activeToolItems);

  const showStroke = STROKE_TOOL_TYPES.includes(activeToolItems);
  const showFill = FILL_TOOL_TYPES.includes(activeToolItems);
  const showSize = SIZE_TOOL_TYPES.includes(activeToolItems);
  const showEraserSize = activeToolItems === TOOL_ITEMS.ERASER;

  // Get the current color based on the active tool
  const getCurrentColor = () => {
    if (!activeToolItems) return COLORS.BLACK;
    const toolState = toolboxState[activeToolItems];

    // For circle and rectangle, prioritize fill color
    if (
      activeToolItems === TOOL_ITEMS.CIRCLE ||
      activeToolItems === TOOL_ITEMS.RECTANGLE
    ) {
      return toolState?.fill || toolState?.stroke || COLORS.BLACK;
    }

    // For other tools, use stroke color
    if (showStroke) return toolState?.stroke || COLORS.BLACK;
    if (showFill) return toolState?.fill || COLORS.BLACK;
    return COLORS.BLACK;
  };

  const currentColor = getCurrentColor();

  const handleSizeChange = (e, tool) => {
    const newSize = parseInt(e.target.value);
    if (!isNaN(newSize)) {
      changeSize(tool, newSize);
    }
  };

  const getMaxSize = (tool) => {
    switch (tool) {
      case TOOL_ITEMS.TEXT:
        return 100; // Increased max size for text
      case TOOL_ITEMS.ERASER:
        return 50;
      default:
        return 20;
    }
  };

  const getMinSize = (tool) => {
    switch (tool) {
      case TOOL_ITEMS.TEXT:
        return 12; // Minimum text size
      case TOOL_ITEMS.ERASER:
        return 5;
      default:
        return 1;
    }
  };

  const getDefaultSize = (tool) => {
    switch (tool) {
      case TOOL_ITEMS.TEXT:
        return 24; // Medium size for text
      case TOOL_ITEMS.ERASER:
        return 20;
      default:
        return 2;
    }
  };

  return (
    <>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed top-20 left-4 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-20 group"
          style={{
            background: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor} 100%)`,
            border: `2px solid ${currentColor === COLORS.WHITE ? "#e5e7eb" : currentColor}`,
          }}
        >
          <div className="relative">
            <FaPalette
              className={`w-6 h-6 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}
            />
          </div>
          <div className="absolute left-14 bg-white text-gray-700 px-3 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Toolbox
          </div>
        </button>
      ) : (
        <div className="fixed top-20 left-4 bg-white p-4 rounded-lg shadow-lg z-10 min-w-[200px] transition-all duration-300">
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>

          {showStroke && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Stroke Color</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(COLORS).map(([name, color]) => (
                  <button
                    key={name}
                    className={`w-8 h-8 rounded-full border-2 ${
                      toolboxState[activeToolItems]?.stroke === color
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => changeStroke(activeToolItems, color)}
                  />
                ))}
              </div>
            </div>
          )}

          {showFill && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Fill Color</h3>
              <div className="grid grid-cols-4 gap-2">
                <button
                  className={`w-8 h-8 rounded-full border-2 ${
                    toolboxState[activeToolItems]?.fill === null
                      ? "border-blue-500"
                      : "border-gray-200"
                  } bg-gradient-to-br from-gray-100 to-gray-300`}
                  onClick={() => changeFill(activeToolItems, null)}
                />
                {Object.entries(COLORS).map(([name, color]) => (
                  <button
                    key={name}
                    className={`w-8 h-8 rounded-full border-2 ${
                      toolboxState[activeToolItems]?.fill === color
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => changeFill(activeToolItems, color)}
                  />
                ))}
              </div>
            </div>
          )}

          {showSize && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Size</h3>
              <input
                type="range"
                min={getMinSize(activeToolItems)}
                max={getMaxSize(activeToolItems)}
                value={
                  toolboxState[activeToolItems]?.size ||
                  getDefaultSize(activeToolItems)
                }
                onChange={(e) => handleSizeChange(e, activeToolItems)}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {toolboxState[activeToolItems]?.size ||
                  getDefaultSize(activeToolItems)}
                px
              </div>
            </div>
          )}

          {showEraserSize && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Eraser Size</h3>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserSize}
                onChange={(e) => handleSetEraserSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {eraserSize}px
              </div>
            </div>
          )}

          {activeToolItems === TOOL_ITEMS.TEXT && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                value={toolboxState[TOOL_ITEMS.TEXT].fontFamily}
                onChange={(e) => {
                  console.log("Changing font to:", e.target.value);
                  changeFontFamily(TOOL_ITEMS.TEXT, e.target.value);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: toolboxState[TOOL_ITEMS.TEXT].fontFamily }}
              >
                {fontFamilies.map((font) => (
                  <option
                    key={font.name}
                    value={font.name}
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Toolbox;
