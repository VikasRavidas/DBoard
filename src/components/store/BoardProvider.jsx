import React, { useReducer, useContext, useCallback } from "react";
import { TOOL_ITEMS, TOOL_ACTION_TYPES } from "../../constants";
import { BoardContext } from "./Board-context";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates } from "../utils/math.jsx";
import { useToolbox } from "./toolbox-provider";

const generator = rough.generator();

const initialState = {
  elements: [],
  activeToolItems: null,
  history: {
    past: [],
    present: [],
    future: [],
  },
};

const boardReducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_TOOL_ITEMS":
      return {
        ...state,
        activeToolItems: action.payload,
      };
    case "ADD_ELEMENT":
      const newElements = [...state.elements, action.payload];
      return {
        ...state,
        elements: newElements,
        history: {
          past: [...state.history.past, state.elements],
          present: newElements,
          future: [],
        },
      };
    case "CLEAR_BOARD":
      return {
        ...state,
        elements: [],
        history: {
          past: [...state.history.past, state.elements],
          present: [],
          future: [],
        },
      };
    case "UNDO":
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      return {
        ...state,
        elements: previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.elements, ...state.history.future],
        },
      };
    case "REDO":
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        ...state,
        elements: next,
        history: {
          past: [...state.history.past, state.elements],
          present: next,
          future: newFuture,
        },
      };
    default:
      return state;
  }
};

const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { toolboxState } = useToolbox();

  const handleSetActiveToolItems = useCallback((tool) => {
    dispatch({ type: "SET_ACTIVE_TOOL_ITEMS", payload: tool });
  }, []);

  const handleAddElement = useCallback((element) => {
    dispatch({ type: "ADD_ELEMENT", payload: element });
  }, []);

  const handleClearBoard = useCallback(() => {
    dispatch({ type: "CLEAR_BOARD" });
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const value = {
    elements: state.elements,
    activeToolItems: state.activeToolItems,
    handleSetActiveToolItems,
    handleAddElement,
    handleClearBoard,
    handleUndo,
    handleRedo,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
};

export default BoardProvider;
