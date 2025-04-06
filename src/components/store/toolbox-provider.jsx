import React, { createContext, useContext, useReducer } from "react";
import { TOOL_ITEMS, TOOLBOX_ACTIONS, COLORS } from "../../constants";

const toolboxContext = createContext();

const initialToolboxState = {
  [TOOL_ITEMS.BRUSH]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.LINE]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.RECTANGLE]: { stroke: COLORS.BLACK, fill: null, size: 1 },
  [TOOL_ITEMS.CIRCLE]: { stroke: COLORS.BLACK, fill: null, size: 1 },
  [TOOL_ITEMS.ARROW]: { stroke: COLORS.BLACK, size: 1 },
  [TOOL_ITEMS.ERASER]: { size: 1 },
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
      dispatch({
        type: TOOLBOX_ACTIONS.CHANGE_SIZE,
        payload: { tool, size },
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
