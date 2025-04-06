import React, { createContext, useContext, useReducer } from "react";
import { TOOL_ITEMS, TOOL_ACTION_TYPES, COLORS } from "../../constants";
import * as perfectFreehand from "perfect-freehand";
import { getStroke } from "perfect-freehand";

export const BoardContext = createContext();

const BOARD_ACTIONS = {
  SET_ACTIVE_TOOL_ITEMS: "SET_ACTIVE_TOOL_ITEMS",
  SET_TOOL_ACTION_TYPE: "SET_TOOL_ACTION_TYPE",
  SET_ELEMENTS: "SET_ELEMENTS",
  SET_IS_DRAWING: "SET_IS_DRAWING",
  SET_START_POINT: "SET_START_POINT",
  SET_CURRENT_ELEMENT: "SET_CURRENT_ELEMENT",
  DRAW_START: "DRAW_START",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
  ERASE: "ERASE",
  UNDO: "UNDO",
  REDO: "REDO",
};

const initialState = {
  activeToolItems: TOOL_ITEMS.LINE,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  isDrawing: false,
  startPoint: null,
  currentElement: null,
  history: [[]],
  index: 0,
};

const isPointNearElement = (element, x, y) => {
  if (!element) return false;

  // For brush strokes
  if (element.type === TOOL_ITEMS.BRUSH && element.points) {
    const options = {
      size: element.size || 1,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    };
    const stroke = getStroke(element.points, options);
    const ctx = document.createElement("canvas").getContext("2d");

    // Create a path from the stroke points
    ctx.beginPath();
    for (let i = 0; i < stroke.length; i++) {
      const [sx, sy] = stroke[i];
      if (i === 0) {
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.closePath();

    // Check if point is within the stroke
    return ctx.isPointInPath(x, y);
  }

  // For lines and arrows
  if (
    (element.type === TOOL_ITEMS.LINE || element.type === TOOL_ITEMS.ARROW) &&
    element.roughElement?.options
  ) {
    const start = element.roughElement.options.start;
    const end = element.roughElement.options.end;
    const strokeWidth = element.roughElement.options.strokeWidth || 1;

    if (!start || !end) return false;

    // Calculate distance from point to line
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dot = ((x - start.x) * dx + (y - start.y) * dy) / (length * length);

    // Find closest point on line
    let closestX, closestY;
    if (dot < 0) {
      closestX = start.x;
      closestY = start.y;
    } else if (dot > 1) {
      closestX = end.x;
      closestY = end.y;
    } else {
      closestX = start.x + dot * dx;
      closestY = start.y + dot * dy;
    }

    // Check if point is within stroke width of the line
    const distance = Math.sqrt(
      Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2)
    );
    return distance <= strokeWidth * 2;
  }

  // For rectangles and circles
  if (
    (element.type === TOOL_ITEMS.RECTANGLE ||
      element.type === TOOL_ITEMS.CIRCLE) &&
    element.roughElement?.options
  ) {
    const ctx = document.createElement("canvas").getContext("2d");
    const path = new Path2D();

    if (element.type === TOOL_ITEMS.RECTANGLE) {
      const start = element.roughElement.options.start;
      const end = element.roughElement.options.end;
      if (!start || !end) return false;
      path.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (element.type === TOOL_ITEMS.CIRCLE) {
      const center = element.roughElement.options.center;
      const radius = element.roughElement.options.radius;
      if (!center || radius === undefined) return false;
      path.arc(center.x, center.y, radius, 0, Math.PI * 2);
    }

    return ctx.isPointInPath(path, x, y);
  }

  return false;
};

const getBrushStrokeOptions = (size) => ({
  size: size,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
});

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.SET_ACTIVE_TOOL_ITEMS:
      return { ...state, activeToolItems: action.payload };
    case BOARD_ACTIONS.SET_TOOL_ACTION_TYPE:
      return { ...state, toolActionType: action.payload };
    case BOARD_ACTIONS.SET_ELEMENTS:
      const newHistory = [
        ...state.history.slice(0, state.index + 1),
        action.payload,
      ];
      return {
        ...state,
        elements: action.payload,
        history: newHistory,
        index: newHistory.length - 1,
      };
    case BOARD_ACTIONS.SET_IS_DRAWING:
      return { ...state, isDrawing: action.payload };
    case BOARD_ACTIONS.SET_START_POINT:
      return { ...state, startPoint: action.payload };
    case BOARD_ACTIONS.SET_CURRENT_ELEMENT:
      return { ...state, currentElement: action.payload };
    case BOARD_ACTIONS.DRAW_START: {
      const { clientX, clientY, toolActionType } = action.payload;
      const newElement = {
        type: toolActionType,
        points: [{ x: clientX, y: clientY }],
        stroke: action.payload.stroke,
        fill: action.payload.fill,
        size: action.payload.size,
      };

      if (toolActionType === TOOL_ITEMS.BRUSH) {
        const options = getBrushStrokeOptions(action.payload.size);
        newElement.path = new Path2D(
          perfectFreehand.getSvgPathFromStroke(
            perfectFreehand.getStroke(newElement.points, options)
          )
        );
      }

      return {
        ...state,
        elements: [...state.elements, newElement],
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY, toolActionType } = action.payload;
      const newElements = [...state.elements];
      const index = newElements.length - 1;

      if (index < 0) return state;

      switch (toolActionType) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.ARROW:
          newElements[index].points = [
            newElements[index].points[0],
            { x: clientX, y: clientY },
          ];
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
          newElements[index].points = [
            newElements[index].points[0],
            { x: clientX, y: clientY },
          ];
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          const options = getBrushStrokeOptions(newElements[index].size);
          newElements[index].path = new Path2D(
            perfectFreehand.getSvgPathFromStroke(
              perfectFreehand.getStroke(newElements[index].points, options)
            )
          );
          return {
            ...state,
            elements: newElements,
          };
        default:
          throw new Error("Type not recognized");
      }
    }
    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
      });
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO:
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    case BOARD_ACTIONS.REDO:
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    default:
      return state;
  }
};

export const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  const value = {
    ...state,
    handleSetActiveToolItems: (tool) => {
      dispatch({ type: BOARD_ACTIONS.SET_ACTIVE_TOOL_ITEMS, payload: tool });
    },
    handleSetToolActionType: (type) => {
      dispatch({ type: BOARD_ACTIONS.SET_TOOL_ACTION_TYPE, payload: type });
    },
    handleSetElements: (elements) => {
      dispatch({ type: BOARD_ACTIONS.SET_ELEMENTS, payload: elements });
    },
    handleSetIsDrawing: (isDrawing) => {
      dispatch({ type: BOARD_ACTIONS.SET_IS_DRAWING, payload: isDrawing });
    },
    handleSetStartPoint: (point) => {
      dispatch({ type: BOARD_ACTIONS.SET_START_POINT, payload: point });
    },
    handleSetCurrentElement: (element) => {
      dispatch({ type: BOARD_ACTIONS.SET_CURRENT_ELEMENT, payload: element });
    },
    handleMouseDown: (e) => {
      const { clientX, clientY } = e;
      dispatch({
        type: BOARD_ACTIONS.DRAW_START,
        payload: {
          clientX,
          clientY,
          toolActionType: state.activeToolItems,
          stroke: state.toolboxState?.stroke || "#000000",
          fill: state.toolboxState?.fill || null,
          size: state.toolboxState?.size || 1,
        },
      });
    },
    handleMouseMove: (e) => {
      if (e.buttons !== 1) return;
      const { clientX, clientY } = e;
      dispatch({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
          toolActionType: state.activeToolItems,
        },
      });
    },
    handleMouseUp: () => {
      dispatch({ type: BOARD_ACTIONS.DRAW_UP });
    },
    handleErase: (e) => {
      const { clientX, clientY } = e;
      dispatch({
        type: BOARD_ACTIONS.ERASE,
        payload: { clientX, clientY },
      });
    },
    handleUndo: () => {
      dispatch({ type: BOARD_ACTIONS.UNDO });
    },
    handleRedo: () => {
      dispatch({ type: BOARD_ACTIONS.REDO });
    },
    canUndo: state.index > 0,
    canRedo: state.index < state.history.length - 1,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
};

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
};
