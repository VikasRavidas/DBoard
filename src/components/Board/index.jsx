// Board.jsx
import React, { useContext, useEffect, useRef } from "react";
import { TOOL_ITEMS, COLORS } from "../../constants";
import { BoardContext } from "../store/Board-context";
import { useToolbox } from "../store/toolbox-provider";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates } from "../utils/math";
import { getStroke } from "perfect-freehand";

const Board = () => {
  const canvasRef = useRef(null);
  const {
    activeToolItems,
    elements,
    handleSetElements,
    isDrawing,
    handleSetIsDrawing,
    startPoint,
    handleSetStartPoint,
    currentElement,
    handleSetCurrentElement,
    handleUndo,
    handleRedo,
    handleErase,
  } = useContext(BoardContext);
  const { toolboxState } = useToolbox();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl/Cmd + Z is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

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

  const drawElements = (rc, context, elementsToDraw) => {
    // Clear canvas
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw all elements
    elementsToDraw.forEach((element) => {
      if (element.type === TOOL_ITEMS.BRUSH) {
        // Draw brush strokes
        const options = getBrushStrokeOptions(element.size);
        const stroke = getStroke(element.points, options);

        context.beginPath();
        context.fillStyle = element.stroke;

        for (let i = 0; i < stroke.length; i++) {
          const [x, y] = stroke[i];
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.closePath();
        context.fill();
      } else if (
        element.type === TOOL_ITEMS.LINE ||
        element.type === TOOL_ITEMS.RECTANGLE ||
        element.type === TOOL_ITEMS.CIRCLE ||
        element.type === TOOL_ITEMS.ARROW
      ) {
        rc.draw(element.roughElement);
        // Draw arrowhead for arrows
        if (element.type === TOOL_ITEMS.ARROW) {
          const startPoint = element.roughElement.options.start;
          const endPoint = element.roughElement.options.end;
          const arrowLength =
            (element.roughElement.options.strokeWidth || 1) * 15;
          const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
            startPoint.x,
            startPoint.y,
            endPoint.x,
            endPoint.y,
            arrowLength
          );

          context.beginPath();
          context.moveTo(x3, y3);
          context.lineTo(endPoint.x, endPoint.y);
          context.lineTo(x4, y4);
          context.fillStyle =
            element.roughElement.options.stroke || COLORS.BLACK;
          context.fill();
        }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    // Set canvas size to match window size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial size
    updateCanvasSize();

    // Update size on window resize
    window.addEventListener("resize", updateCanvasSize);

    const rc = rough.canvas(canvas);
    drawElements(rc, context, elements);

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [elements]);

  const boardMouseDownHandler = (event) => {
    if (!activeToolItems) return;

    const { offsetX, offsetY } = event.nativeEvent;
    handleSetStartPoint({ x: offsetX, y: offsetY });
    handleSetIsDrawing(true);

    if (activeToolItems === TOOL_ITEMS.BRUSH) {
      const newElement = {
        type: TOOL_ITEMS.BRUSH,
        points: [{ x: offsetX, y: offsetY }],
        stroke: toolboxState[activeToolItems]?.stroke || COLORS.BLACK,
        size: toolboxState[activeToolItems]?.size || 1,
      };
      handleSetCurrentElement(newElement);
      handleSetElements([...elements, newElement]);
    }
  };

  const boardMouseMoveHandler = (event) => {
    if (!isDrawing || !startPoint || !activeToolItems || event.buttons !== 1)
      return;

    const { offsetX, offsetY } = event.nativeEvent;
    const currentPoint = { x: offsetX, y: offsetY };

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rc = rough.canvas(canvas);
    let roughElement;

    switch (activeToolItems) {
      case TOOL_ITEMS.LINE:
        roughElement = rc.line(
          startPoint.x,
          startPoint.y,
          currentPoint.x,
          currentPoint.y,
          {
            stroke: toolboxState[activeToolItems]?.stroke || COLORS.BLACK,
            strokeWidth: toolboxState[activeToolItems]?.size || 1,
          }
        );
        break;
      case TOOL_ITEMS.RECTANGLE:
        roughElement = rc.rectangle(
          startPoint.x,
          startPoint.y,
          currentPoint.x - startPoint.x,
          currentPoint.y - startPoint.y,
          {
            stroke: toolboxState[activeToolItems]?.stroke || COLORS.BLACK,
            fill: toolboxState[activeToolItems]?.fill || null,
            strokeWidth: toolboxState[activeToolItems]?.size || 1,
          }
        );
        break;
      case TOOL_ITEMS.CIRCLE:
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
        );
        roughElement = rc.circle(startPoint.x, startPoint.y, radius * 2, {
          stroke: toolboxState[activeToolItems]?.stroke || COLORS.BLACK,
          fill: toolboxState[activeToolItems]?.fill || null,
          strokeWidth: toolboxState[activeToolItems]?.size || 1,
        });
        break;
      case TOOL_ITEMS.ARROW:
        roughElement = rc.line(
          startPoint.x,
          startPoint.y,
          currentPoint.x,
          currentPoint.y,
          {
            stroke: toolboxState[activeToolItems]?.stroke || COLORS.BLACK,
            strokeWidth: toolboxState[activeToolItems]?.size || 1,
            start: startPoint,
            end: currentPoint,
          }
        );
        break;
      case TOOL_ITEMS.BRUSH:
        const newElements = [...elements];
        const currentBrushElement = newElements[newElements.length - 1];
        if (
          currentBrushElement &&
          currentBrushElement.type === TOOL_ITEMS.BRUSH
        ) {
          currentBrushElement.points = [
            ...currentBrushElement.points,
            { x: offsetX, y: offsetY },
          ];
          handleSetElements(newElements);
        }
        return;
      case TOOL_ITEMS.ERASER:
        // Eraser is handled separately
        break;
      default:
        return;
    }

    if (roughElement) {
      const newElement = {
        type: activeToolItems,
        roughElement,
      };

      handleSetCurrentElement(newElement);
      drawElements(rc, context, [...elements, newElement]);
    }
  };

  const boardMouseUpHandler = () => {
    if (!isDrawing) return;

    if (currentElement) {
      handleSetElements([...elements, currentElement]);
    }

    handleSetIsDrawing(false);
    handleSetStartPoint(null);
    handleSetCurrentElement(null);
  };

  const handleCanvasMouseDown = (e) => {
    if (activeToolItems === TOOL_ITEMS.ERASER) {
      const { offsetX, offsetY } = e.nativeEvent;
      handleErase({ clientX: offsetX, clientY: offsetY });
    } else {
      boardMouseDownHandler(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (activeToolItems === TOOL_ITEMS.ERASER && e.buttons === 1) {
      const { offsetX, offsetY } = e.nativeEvent;
      handleErase({ clientX: offsetX, clientY: offsetY });
    } else {
      boardMouseMoveHandler(e);
    }
  };

  const handleMouseUp = () => {
    boardMouseUpHandler();
  };

  const drawArrow = (ctx, from, to, size) => {
    const headLength = size * 5; // Arrowhead size proportional to line width
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleMouseUp}
      className="absolute top-0 left-0"
    />
  );
};

export default Board;
