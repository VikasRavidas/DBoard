import React, { createContext, useContext, useReducer } from "react";
import { TOOL_ITEMS, TOOLBOX_ACTIONS, COLORS } from "../../constants";

const toolboxContext = createContext();

// Define available font families
const FONT_FAMILIES = [
  { name: "Caveat", label: "Handwriting" },
  { name: "Arial", label: "Arial" },
  { name: "Times New Roman", label: "Times New Roman" },
  { name: "Courier New", label: "Courier New" },
  { name: "Georgia", label: "Georgia" },
  { name: "Verdana", label: "Verdana" },
  { name: "Comic Sans MS", label: "Comic Sans" },
];

const initialToolboxState = {
  [TOOL_ITEMS.BRUSH]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.LINE]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.RECTANGLE]: { stroke: COLORS.BLACK, fill: null, size: 1 },
  [TOOL_ITEMS.CIRCLE]: { stroke: COLORS.BLACK, fill: null, size: 1 },
  [TOOL_ITEMS.ARROW]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.ERASER]: { size: 10 },
  [TOOL_ITEMS.TEXT]: {
    stroke: COLORS.BLACK,
    size: 24,
    fontFamily: "Caveat",
  },
};

function toolboxReducer(state, action) {
  switch (action.type) {
    case TOOLBOX_ACTIONS.CHANGE_STROKE:
      return {
        ...state,
        [action.payload.tool]: {
          ...state[action.payload.tool],
          stroke: action.payload.color,
        },
      };
    case TOOLBOX_ACTIONS.CHANGE_FILL:
      return {
        ...state,
        [action.payload.tool]: {
          ...state[action.payload.tool],
          fill: action.payload.color,
        },
      };
    case TOOLBOX_ACTIONS.CHANGE_SIZE:
      return {
        ...state,
        [action.payload.tool]: {
          ...state[action.payload.tool],
          size: action.payload.size,
        },
      };
    case TOOLBOX_ACTIONS.CHANGE_FONT_FAMILY:
      return {
        ...state,
        [action.payload.tool]: {
          ...state[action.payload.tool],
          fontFamily: action.payload.fontFamily,
        },
      };
    default:
      return state;
  }
}

export const ToolboxProvider = ({ children }) => {
  const [toolboxState, dispatch] = useReducer(
    toolboxReducer,
    initialToolboxState
  );

  const value = {
    toolboxState,
    fontFamilies: FONT_FAMILIES,
    changeStroke: (tool, color) => {
      dispatch({
        type: TOOLBOX_ACTIONS.CHANGE_STROKE,
        payload: { tool, color },
      });
    },
    changeFill: (tool, color) => {
      dispatch({
        type: TOOLBOX_ACTIONS.CHANGE_FILL,
        payload: { tool, color },
      });
    },
    changeSize: (tool, size) => {
      // For text, allow larger sizes
      const maxSize = tool === TOOL_ITEMS.TEXT ? 72 : 10;
      const clampedSize = Math.min(Math.max(1, size), maxSize);

      dispatch({
        type: TOOLBOX_ACTIONS.CHANGE_SIZE,
        payload: { tool, size: clampedSize },
      });
    },
    changeFontFamily: (tool, fontFamily) => {
      dispatch({
        type: TOOLBOX_ACTIONS.CHANGE_FONT_FAMILY,
        payload: { tool, fontFamily },
      });
    },
  };

  return (
    <toolboxContext.Provider value={value}>{children}</toolboxContext.Provider>
  );
};

export const useToolbox = () => {
  const context = useContext(toolboxContext);
  if (!context) {
    throw new Error("useToolbox must be used within a ToolboxProvider");
  }
  return context;
};
