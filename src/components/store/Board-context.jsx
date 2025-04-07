import React, { createContext, useContext, useReducer } from "react";
import { TOOL_ITEMS, TOOL_ACTION_TYPES, COLORS } from "../../constants";
import { getStroke } from "perfect-freehand";
import { isPointCloseToLine } from "../utils/math.jsx";
import { createElement } from "../utils/elements.jsx";

// Import the ELEMENT_ERASE_THRESHOLD constant
const ELEMENT_ERASE_THRESHOLD = 10; // Default value if not available in constants

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
  SET_HISTORY: "SET_HISTORY",
  SET_INDEX: "SET_INDEX",
  SET_ERASER_SIZE: "SET_ERASER_SIZE",
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
  eraserSize: 20, // Increased from 10 to 20 for better initial usability
};

// Helper function to calculate distance between points
const distanceBetweenPoints = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// Updated isPointNearElement function based on the reference implementation
const isPointNearElement = (element, pointX, pointY, eraserSize) => {
  if (!element) {
    console.error("isPointNearElement: element is null or undefined");
    return false;
  }

  console.log("Checking element:", element);

  // For brush strokes
  if (element.type === TOOL_ITEMS.BRUSH && element.points) {
    // Check if any point in the stroke is near the eraser point
    const size = element.size || 1;
    const threshold = size * 5;

    for (let i = 0; i < element.points.length; i++) {
      const point = element.points[i];
      const distance = Math.sqrt(
        Math.pow(pointX - point.x, 2) + Math.pow(pointY - point.y, 2)
      );
      if (distance <= threshold) {
        return true;
      }
    }
    return false;
  }

  // For lines, arrows, rectangles, and circles
  if (element.roughElement) {
    const roughElement = element.roughElement;
    console.log("Processing roughElement:", roughElement);

    // Extract coordinates from the roughElement's operations
    if (roughElement.sets && roughElement.sets.length > 0) {
      const ops = roughElement.sets[0].ops;
      if (ops && ops.length >= 2) {
        // Get start point from first 'move' operation
        const startOp = ops.find((op) => op.op === "move");
        if (startOp && startOp.data && startOp.data.length >= 2) {
          const x1 = startOp.data[0];
          const y1 = startOp.data[1];

          // Get end point from last operation's data
          const lastOp = ops[ops.length - 1];
          if (lastOp && lastOp.data) {
            let x2, y2;

            if (lastOp.op === "bcurveTo") {
              // For bezier curves, use the last two points
              x2 = lastOp.data[lastOp.data.length - 2];
              y2 = lastOp.data[lastOp.data.length - 1];
            } else {
              // For other operations, use the first two points
              x2 = lastOp.data[0];
              y2 = lastOp.data[1];
            }

            console.log(
              `Extracted coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`
            );

            // For lines and arrows
            if (
              element.type === TOOL_ITEMS.LINE ||
              element.type === TOOL_ITEMS.ARROW
            ) {
              const lineThreshold = eraserSize * 3;

              // Calculate the distance from the point to the line
              const A = pointX - x1;
              const B = pointY - y1;
              const C = x2 - x1;
              const D = y2 - y1;

              const dot = A * C + B * D;
              const lenSq = C * C + D * D;
              let param = -1;

              if (lenSq !== 0) {
                param = dot / lenSq;
              }

              let xx, yy;

              if (param < 0) {
                xx = x1;
                yy = y1;
              } else if (param > 1) {
                xx = x2;
                yy = y2;
              } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
              }

              const dx = pointX - xx;
              const dy = pointY - yy;
              const distance = Math.sqrt(dx * dx + dy * dy);

              const isNear = distance <= lineThreshold;
              console.log(
                `Distance to ${element.type}: ${distance}, threshold: ${lineThreshold}, isNear: ${isNear}`
              );

              return isNear;
            }

            // For rectangles
            if (element.type === TOOL_ITEMS.RECTANGLE) {
              const rectThreshold = eraserSize * 3;

              // For rectangles, we need to find the actual bounding box from all operations
              let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

              // Extract all points from the operations to find the true bounds
              roughElement.sets.forEach((set) => {
                set.ops.forEach((op) => {
                  if (op.op === "move") {
                    minX = Math.min(minX, op.data[0]);
                    minY = Math.min(minY, op.data[1]);
                    maxX = Math.max(maxX, op.data[0]);
                    maxY = Math.max(maxY, op.data[1]);
                  } else if (op.op === "bcurveTo") {
                    // For bezier curves, check all control points
                    op.data.forEach((coord, index) => {
                      if (index % 2 === 0) {
                        // x coordinates
                        minX = Math.min(minX, coord);
                        maxX = Math.max(maxX, coord);
                      } else {
                        // y coordinates
                        minY = Math.min(minY, coord);
                        maxY = Math.max(maxY, coord);
                      }
                    });
                  }
                });
              });

              // Calculate the width and height
              const width = maxX - minX;
              const height = maxY - minY;

              // Check if point is near any edge of the rectangle
              const distanceToLeft = Math.abs(pointX - minX);
              const distanceToRight = Math.abs(pointX - maxX);
              const distanceToTop = Math.abs(pointY - minY);
              const distanceToBottom = Math.abs(pointY - maxY);

              // Point is near if it's within threshold of any edge
              const isNearLeft =
                distanceToLeft <= rectThreshold &&
                pointY >= minY &&
                pointY <= maxY;
              const isNearRight =
                distanceToRight <= rectThreshold &&
                pointY >= minY &&
                pointY <= maxY;
              const isNearTop =
                distanceToTop <= rectThreshold &&
                pointX >= minX &&
                pointX <= maxX;
              const isNearBottom =
                distanceToBottom <= rectThreshold &&
                pointX >= minX &&
                pointX <= maxX;

              if (isNearLeft || isNearRight || isNearTop || isNearBottom) {
                console.log(
                  `Point is near rectangle edge: ${Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)} <= ${rectThreshold}`
                );
                return true;
              }
              console.log("Point is not near any rectangle edge");
              return false;
            }

            // For circles
            if (element.type === TOOL_ITEMS.CIRCLE) {
              // For circles, we need to find the bounding box from all operations
              let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

              // Extract all points from the operations
              const points = [];
              roughElement.sets[0].ops.forEach((op) => {
                if (op.op === "move" && op.data && op.data.length >= 2) {
                  points.push([op.data[0], op.data[1]]);
                } else if (
                  op.op === "bcurveTo" &&
                  op.data &&
                  op.data.length >= 6
                ) {
                  // For bezier curves, add the end point
                  points.push([op.data[4], op.data[5]]);
                }
              });

              // Find the bounding box
              points.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              });

              // Calculate center and radius
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;
              const radius = Math.max((maxX - minX) / 2, (maxY - minY) / 2);

              console.log(
                `Circle bounds: (${minX}, ${minY}) to (${maxX}, ${maxY})`
              );
              console.log(
                `Circle center: (${centerX}, ${centerY}), radius: ${radius}`
              );

              // Calculate the distance from the point to the circle's circumference
              const distance = Math.abs(
                Math.sqrt(
                  Math.pow(pointX - centerX, 2) + Math.pow(pointY - centerY, 2)
                ) - radius
              );

              // Use a larger threshold for circles to make them easier to erase
              const circleThreshold = eraserSize * 3;
              const isNear = distance <= circleThreshold;

              console.log(
                `Distance to circle: ${distance}, threshold: ${circleThreshold}, isNear: ${isNear}`
              );

              return isNear;
            }
          }
        }
      }
    }
  }

  // If we couldn't process the element, return false
  console.log(`Could not process element of type: ${element.type}`);
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
      console.log("SET_ELEMENTS action:", action.payload);
      const elementsHistory = [
        ...state.history.slice(0, state.index + 1),
        action.payload,
      ];
      return {
        ...state,
        elements: action.payload,
        history: elementsHistory,
        index: elementsHistory.length - 1,
      };
    case BOARD_ACTIONS.SET_IS_DRAWING:
      return { ...state, isDrawing: action.payload };
    case BOARD_ACTIONS.SET_START_POINT:
      return { ...state, startPoint: action.payload };
    case BOARD_ACTIONS.SET_CURRENT_ELEMENT:
      return { ...state, currentElement: action.payload };
    case BOARD_ACTIONS.DRAW_START: {
      const { clientX, clientY } = action.payload;
      const { x, y } = getCoordinates(clientX, clientY);
      console.log(
        `DRAW_START at (${x}, ${y}) with tool: ${state.activeToolItems}`
      );

      // Create a new element based on the active tool
      const newElement = createElement({
        id: Date.now().toString(),
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        type: state.activeToolItems,
        color: action.payload.color || "#000000",
        strokeWidth: action.payload.strokeWidth || 2,
        size: action.payload.size || 5,
      });

      console.log("Created new element:", newElement);

      return {
        ...state,
        isDrawing: true,
        startPoint: { x, y },
        currentElement: newElement,
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      if (!state.isDrawing) return state;

      const { clientX, clientY } = action.payload;
      const { x, y } = getCoordinates(clientX, clientY);

      // Update the current element based on the active tool
      let updatedElement = { ...state.currentElement };

      if (state.activeToolItems === TOOL_ITEMS.BRUSH) {
        // For brush strokes, add the new point to the points array
        updatedElement.points = [...(updatedElement.points || []), { x, y }];
      } else {
        // For other tools, update the end coordinates
        updatedElement.x2 = x;
        updatedElement.y2 = y;
      }

      return {
        ...state,
        currentElement: updatedElement,
      };
    }
    case BOARD_ACTIONS.DRAW_UP: {
      if (!state.isDrawing) return state;

      const { clientX, clientY } = action.payload;
      const { x: x2, y: y2 } = getCoordinates(clientX, clientY);

      // Log the coordinates of the shape being drawn
      console.log(
        `Drawing ${state.activeToolItems} from (${state.startPoint.x}, ${state.startPoint.y}) to (${x2}, ${y2})`
      );

      let elementsAfterDraw = [...state.elements];

      if (state.activeToolItems === TOOL_ITEMS.LINE) {
        const lineElement = createElement({
          id: state.currentElement.id,
          x1: state.startPoint.x,
          y1: state.startPoint.y,
          x2,
          y2,
          type: TOOL_ITEMS.LINE,
          color: state.currentElement.color,
          strokeWidth: state.currentElement.strokeWidth,
        });
        elementsAfterDraw = [...state.elements, lineElement];

        // Log the created line element
        console.log("Created LINE element:", lineElement);
      } else if (state.activeToolItems === TOOL_ITEMS.RECTANGLE) {
        const rectangleElement = createElement({
          id: state.currentElement.id,
          x1: state.startPoint.x,
          y1: state.startPoint.y,
          x2,
          y2,
          type: TOOL_ITEMS.RECTANGLE,
          color: state.currentElement.color,
          strokeWidth: state.currentElement.strokeWidth,
        });
        elementsAfterDraw = [...state.elements, rectangleElement];

        // Log the created rectangle element
        console.log("Created RECTANGLE element:", rectangleElement);
      } else if (state.activeToolItems === TOOL_ITEMS.CIRCLE) {
        const circleElement = createElement({
          id: state.currentElement.id,
          x1: state.startPoint.x,
          y1: state.startPoint.y,
          x2,
          y2,
          type: TOOL_ITEMS.CIRCLE,
          color: state.currentElement.color,
          strokeWidth: state.currentElement.strokeWidth,
        });
        elementsAfterDraw = [...state.elements, circleElement];

        // Log the created circle element
        console.log("Created CIRCLE element:", circleElement);
      } else if (state.activeToolItems === TOOL_ITEMS.ARROW) {
        const arrowElement = createElement({
          id: state.currentElement.id,
          x1: state.startPoint.x,
          y1: state.startPoint.y,
          x2,
          y2,
          type: TOOL_ITEMS.ARROW,
          color: state.currentElement.color,
          strokeWidth: state.currentElement.strokeWidth,
        });
        elementsAfterDraw = [...state.elements, arrowElement];

        // Log the created arrow element
        console.log("Created ARROW element:", arrowElement);
      } else if (state.activeToolItems === TOOL_ITEMS.BRUSH) {
        // For brush strokes, we need to create a path from the points
        const brushElement = {
          id: state.currentElement.id,
          points: state.currentElement.points,
          path: new Path2D(
            getSvgPathFromStroke(
              getStroke(state.currentElement.points, {
                size: state.currentElement.size,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
              })
            )
          ),
          type: TOOL_ITEMS.BRUSH,
          size: state.currentElement.size,
          color: state.currentElement.color,
        };
        elementsAfterDraw = [...state.elements, brushElement];

        // Log the created brush element
        console.log("Created BRUSH element:", brushElement);
      }

      // Log all elements after drawing
      console.log("All elements after drawing:", elementsAfterDraw);

      // Create a new history entry
      const drawHistory = [
        ...state.history.slice(0, state.index + 1),
        elementsAfterDraw,
      ];

      return {
        ...state,
        elements: elementsAfterDraw,
        history: drawHistory,
        index: state.index + 1,
        isDrawing: false,
        currentElement: null,
        startPoint: null,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      console.log(
        `ERASE action triggered at coordinates: (${clientX}, ${clientY}) with size: ${state.eraserSize}`
      );

      // Find all elements that are near the clicked point
      const erasableElements = state.elements
        .map((element, index) => {
          const isNear = isPointNearElement(
            element,
            clientX,
            clientY,
            state.eraserSize
          );
          console.log(`Element ${index} (${element.type}): isNear = ${isNear}`);
          return { element, index, isNear };
        })
        .filter(({ isNear }) => isNear);

      console.log(`Found ${erasableElements.length} erasable elements`);

      if (erasableElements.length === 0) {
        console.log("No elements found to erase");
        return state;
      }

      // Get the topmost element (the last drawn)
      const { element: elementToErase, index } =
        erasableElements[erasableElements.length - 1];
      console.log(`Erasing element at index ${index}:`, elementToErase);

      // Create a new array without the erased element
      const newElements = [...state.elements];
      newElements.splice(index, 1);

      console.log(`Remaining elements: ${newElements.length}`);

      // Update the history
      const newHistory = [
        ...state.history.slice(0, state.index + 1),
        newElements,
      ];

      return {
        ...state,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      console.log("UNDO action - reverting to previous state");
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      console.log("REDO action - restoring to next state");
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.SET_HISTORY:
      return { ...state, history: action.payload };
    case BOARD_ACTIONS.SET_INDEX:
      return { ...state, index: action.payload };
    case BOARD_ACTIONS.SET_ERASER_SIZE:
      return { ...state, eraserSize: action.payload };
    default:
      return state;
  }
};

export const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  // Add a useEffect to log elements whenever they change
  React.useEffect(() => {
    console.log("Current elements state:", state.elements);
  }, [state.elements]);

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
      console.log("handleErase called with coordinates:", { clientX, clientY });

      // Simply dispatch the ERASE action with the coordinates
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
    handleSetEraserSize: (size) => {
      dispatch({ type: BOARD_ACTIONS.SET_ERASER_SIZE, payload: size });
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
