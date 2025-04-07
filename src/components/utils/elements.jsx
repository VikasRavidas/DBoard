import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import getStroke from "perfect-freehand";

import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates } from "./math.jsx";


const generator = rough.generator();

export const createElement = ({
  id,
  x1,
  y1,
  x2,
  y2,
  type,
  color,
  strokeWidth,
}) => {
  switch (type) {
    case "LINE":
      return {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        color,
        strokeWidth,
        roughElement: generator.line(x1, y1, x2, y2, {
          stroke: color,
          strokeWidth,
        }),
      };
    case "RECTANGLE":
      return {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        color,
        strokeWidth,
        roughElement: generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
          stroke: color,
          strokeWidth,
        }),
      };
    case "CIRCLE":
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        color,
        strokeWidth,
        roughElement: generator.ellipse(x1, y1, radius * 2, radius * 2, {
          stroke: color,
          strokeWidth,
        }),
      };
    case "ARROW":
      const arrowLength = 20;
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        arrowLength
      );
      return {
        id,
        x1,
        y1,
        x2,
        y2,
        x3,
        y3,
        x4,
        y4,
        type,
        color,
        strokeWidth,
        roughElement: [
          generator.line(x1, y1, x2, y2, {
            stroke: color,
            strokeWidth,
          }),
          generator.line(x2, y2, x3, y3, {
            stroke: color,
            strokeWidth,
          }),
          generator.line(x2, y2, x4, y4, {
            stroke: color,
            strokeWidth,
          }),
        ],
      };
    case TOOL_ITEMS.BRUSH:
      const brushElement = {
        id,
        points: [{ x: x1, y: y1 }],
        path: new Path2D(getSvgPathFromStroke(getStroke([{ x: x1, y: y1 }]))),
        type,
        stroke,
      };
      return brushElement;
    case TOOL_ITEMS.TEXT:
      return {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        color,
        strokeWidth,
        roughElement: generator.text(x1, y1, "", { color: color, strokeWidth }),
      };
    default:
      throw new Error(`Type not recognized: ${type}`);
  }
};

export const isPointNearElement = (element, pointX, pointY) => {
  const { x1, y1, x2, y2, type } = element;
  const context = document.getElementById("canvas").getContext("2d");
  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH:
      return context.isPointInPath(element.path, pointX, pointY);
    case TOOL_ITEMS.TEXT:
      context.font = `${element.size}px Caveat`;
      context.fillStyle = element.stroke;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size);
      context.restore();
      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1,
          x1 + textWidth,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1 + textHeight,
          x1,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    default:
      throw new Error("Type not recognized");
  }
};

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};
