// Board.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { TOOL_ITEMS, COLORS } from "../../constants";
import { BoardContext } from "../store/Board-context";
import { useToolbox } from "../store/toolbox-provider";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates } from "../utils/math";
import { getStroke } from "perfect-freehand";

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

const Board = () => {
  const canvasRef = useRef(null);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState(null);
  const [editingTextElement, setEditingTextElement] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
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
    eraserSize,
    handleChangeText,
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
      } else if (element.type === TOOL_ITEMS.TEXT) {
        // Draw text elements
        context.save();
        context.textBaseline = "top";
        const fontSize = element.size || toolboxState[TOOL_ITEMS.TEXT].size;
        const fontFamily =
          element.fontFamily || toolboxState[TOOL_ITEMS.TEXT].fontFamily;
        context.font = `${fontSize}px "${fontFamily}"`;
        context.fillStyle =
          element.stroke || toolboxState[TOOL_ITEMS.TEXT].stroke;
        context.fillText(element.text || "", element.x1, element.y1);
        context.restore();
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

    // Initialize rough canvas first
    const rc = rough.canvas(canvas);

    // Set canvas size to match window size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Redraw elements after resize
      drawElements(rc, context, elements);
    };

    // Initial size
    updateCanvasSize();

    // Update size on window resize
    window.addEventListener("resize", updateCanvasSize);

    // Function to draw everything
    const draw = () => {
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all elements
      drawElements(rc, context, elements);

      // Always draw the text input if typing
      if (isTyping && textPosition) {
        context.save();
        context.textBaseline = "top";
        const fontSize = toolboxState[TOOL_ITEMS.TEXT].size;
        const fontFamily = toolboxState[TOOL_ITEMS.TEXT].fontFamily;
        context.font = `${fontSize}px "${fontFamily}"`;

        // Draw the text input
        context.fillStyle = toolboxState[TOOL_ITEMS.TEXT].stroke;
        context.fillText(textInput, textPosition.x, textPosition.y);
        context.restore();
      }
    };

    // Draw initially
    draw();

    // If typing, set up a blinking cursor effect
    let cursorInterval;
    if (isTyping && textPosition) {
      let cursorVisible = true;
      cursorInterval = setInterval(() => {
        cursorVisible = !cursorVisible;

        // Redraw everything
        draw();

        // Only draw the cursor if it should be visible
        if (cursorVisible) {
          context.save();
          context.textBaseline = "top";
          const fontSize = toolboxState[TOOL_ITEMS.TEXT].size;
          const fontFamily = toolboxState[TOOL_ITEMS.TEXT].fontFamily;
          context.font = `${fontSize}px "${fontFamily}"`;

          // Draw cursor at the correct position
          const textBeforeCursor = textInput.slice(0, cursorPosition);
          const textWidth = context.measureText(textBeforeCursor).width;
          const cursorX = textPosition.x + textWidth;
          context.beginPath();
          context.moveTo(cursorX, textPosition.y);
          context.lineTo(cursorX, textPosition.y + fontSize);
          context.strokeStyle = toolboxState[TOOL_ITEMS.TEXT].stroke;
          context.lineWidth = 2;
          context.stroke();

          context.restore();
        }
      }, 500); // Blink every 500ms
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (cursorInterval) {
        clearInterval(cursorInterval);
      }
    };
  }, [
    elements,
    isTyping,
    textInput,
    textPosition,
    toolboxState,
    cursorPosition,
  ]);

  // Add keyboard event handler for text input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isTyping) return;

      if (e.key === "Enter") {
        // Submit text
        if (textInput.trim()) {
          if (editingTextElement) {
            // Update existing text element
            const updatedElements = elements.map((el) =>
              el.id === editingTextElement.id
                ? {
                    ...el,
                    text: textInput,
                    stroke: toolboxState[TOOL_ITEMS.TEXT].stroke,
                    size: toolboxState[TOOL_ITEMS.TEXT].size,
                    fontFamily: toolboxState[TOOL_ITEMS.TEXT].fontFamily,
                  }
                : el
            );
            handleSetElements(updatedElements);
            setEditingTextElement(null);
          } else {
            // Create new text element
            const newTextElement = {
              id: Date.now().toString(),
              type: TOOL_ITEMS.TEXT,
              x1: textPosition.x,
              y1: textPosition.y,
              text: textInput,
              stroke: toolboxState[TOOL_ITEMS.TEXT].stroke,
              size: toolboxState[TOOL_ITEMS.TEXT].size,
              fontFamily: toolboxState[TOOL_ITEMS.TEXT].fontFamily,
            };
            handleSetElements([...elements, newTextElement]);
          }
        }
        setIsTyping(false);
        setTextPosition(null);
      } else if (e.key === "Escape") {
        // Cancel text input
        setIsTyping(false);
        setTextPosition(null);
        setEditingTextElement(null);
      } else if (e.key === "Backspace") {
        // Handle backspace
        if (cursorPosition > 0) {
          setTextInput((prev) => {
            const newText =
              prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition);
            setCursorPosition(cursorPosition - 1);
            return newText;
          });
        }
      } else if (e.key === "ArrowLeft") {
        // Move cursor left
        if (cursorPosition > 0) {
          setCursorPosition(cursorPosition - 1);
        }
      } else if (e.key === "ArrowRight") {
        // Move cursor right
        if (cursorPosition < textInput.length) {
          setCursorPosition(cursorPosition + 1);
        }
      } else if (e.key.length === 1) {
        // Handle regular character input
        setTextInput((prev) => {
          const newText =
            prev.slice(0, cursorPosition) + e.key + prev.slice(cursorPosition);
          setCursorPosition(cursorPosition + 1);
          return newText;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isTyping,
    textInput,
    textPosition,
    editingTextElement,
    elements,
    toolboxState,
    cursorPosition,
  ]);

  // Add cursor style effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeToolItems === TOOL_ITEMS.ERASER) {
      // Create a circular cursor for the eraser using the dynamic eraserSize
      const svg = `
        <svg width="${eraserSize}" height="${eraserSize}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${eraserSize / 2}" cy="${eraserSize / 2}" r="${eraserSize / 2 - 1}" fill="none" stroke="black" stroke-width="1"/>
          <circle cx="${eraserSize / 2}" cy="${eraserSize / 2}" r="${eraserSize / 2 - 3}" fill="white" stroke="black" stroke-width="1"/>
        </svg>
      `;
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      canvas.style.cursor = `url(${dataUrl}) ${eraserSize / 2} ${eraserSize / 2}, auto`;
    } else {
      canvas.style.cursor = "default";
    }
  }, [activeToolItems, eraserSize]);

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
    } else if (activeToolItems === TOOL_ITEMS.TEXT) {
      // For text tool, start typing directly on canvas
      setTextPosition({ x: offsetX, y: offsetY });
      setIsTyping(true);
      setTextInput("");
      setCursorPosition(0);
    } else if (activeToolItems === TOOL_ITEMS.ERASER) {
      // Check if we're clicking on a text element to edit it
      const clickedElement = elements.find(
        (element) =>
          element.type === TOOL_ITEMS.TEXT &&
          isPointNearTextElement(element, offsetX, offsetY)
      );

      if (clickedElement) {
        setEditingTextElement(clickedElement);
        setTextPosition({ x: clickedElement.x1, y: clickedElement.y1 });
        setTextInput(clickedElement.text || "");
        setCursorPosition(clickedElement.text ? clickedElement.text.length : 0);
        setIsTyping(true);
      }
    }
  };

  // Function to check if a point is near a text element
  const isPointNearTextElement = (element, pointX, pointY) => {
    if (element.type !== TOOL_ITEMS.TEXT) return false;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.font = `${element.size}px "${element.fontFamily}"`;
    const textWidth = context.measureText(element.text || "").width;
    const textHeight = parseInt(element.size);

    // Check if point is within the text bounding box
    return (
      pointX >= element.x1 &&
      pointX <= element.x1 + textWidth &&
      pointY >= element.y1 &&
      pointY <= element.y1 + textHeight
    );
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
        if (currentElement && currentElement.type === TOOL_ITEMS.BRUSH) {
          // Update the current element's points
          const updatedElement = {
            ...currentElement,
            points: [...currentElement.points, { x: offsetX, y: offsetY }],
          };
          handleSetCurrentElement(updatedElement);

          // Clear the canvas and redraw all elements
          context.clearRect(0, 0, canvas.width, canvas.height);
          drawElements(rc, context, elements);

          // Draw the current brush stroke with more natural settings
          const options = {
            ...getBrushStrokeOptions(updatedElement.size),
            thinning: 0.3, // Less thinning for more natural look
            smoothing: 0.3, // Less smoothing for more responsive feel
            streamline: 0.3, // Less streamline for more natural movement
          };
          const stroke = getStroke(updatedElement.points, options);

          context.beginPath();
          context.fillStyle = updatedElement.stroke;

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
          return;
        }
        break;
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
      // For brush strokes, ensure we have the final path
      if (currentElement.type === TOOL_ITEMS.BRUSH) {
        const options = getBrushStrokeOptions(currentElement.size);
        const stroke = getStroke(currentElement.points, options);
        currentElement.path = new Path2D(
          `M ${stroke.map(([x, y]) => `${x} ${y}`).join(" L ")}`
        );
      }
      handleSetElements([...elements, currentElement]);
    }

    handleSetIsDrawing(false);
    handleSetStartPoint(null);
    handleSetCurrentElement(null);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    const { clientX, clientY } = e;
    if (activeToolItems === TOOL_ITEMS.ERASER) {
      handleErase(e);
      handleSetIsDrawing(true);
    } else {
      boardMouseDownHandler(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (e.buttons !== 1) return; // Only handle when left mouse button is pressed
    const { clientX, clientY } = e;
    if (activeToolItems === TOOL_ITEMS.ERASER) {
      handleErase(e);
    } else {
      boardMouseMoveHandler(e);
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    if (activeToolItems === TOOL_ITEMS.ERASER) {
      handleSetIsDrawing(false);
    }
    boardMouseUpHandler();
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
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute top-0 left-0 w-full h-full"
    />
  );
};

export default Board;
