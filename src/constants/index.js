export const TOOL_ITEMS = {
  LINE: "LINE",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  ARROW: "ARROW",
  BRUSH: "BRUSH",
  ERASER: "ERASER",
};

export const TOOL_ACTION_TYPES = {
  NONE: "NONE",
  DRAWING: "DRAWING",
  ERASING: "ERASING",
};

export const COLORS = {
  BLACK: "#000000",
  RED: "#ff0000",
  GREEN: "#00ff00",
  BLUE: "#0000ff",
  ORANGE: "#ffa500",
  YELLOW: "#ffff00",
  WHITE: "#ffffff",
};

export const STROKE_TOOL_TYPES = [
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.BRUSH,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
];

export const FILL_TOOL_TYPES = [TOOL_ITEMS.RECTANGLE, TOOL_ITEMS.CIRCLE];

export const SIZE_TOOL_TYPES = [
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.BRUSH,
  TOOL_ITEMS.ERASER,
];
