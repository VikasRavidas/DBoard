export const ELEMENT_ERASE_THRESHOLD = 5;
export const ARROW_LENGTH = 20;

export const COLORS = {
  BLACK: "#000000",
  RED: "#ff0000",
  GREEN: "#00ff00",
  BLUE: "#0000ff",
  YELLOW: "#ffff00",
  PURPLE: "#800080",
  ORANGE: "#ffa500",
  PINK: "#ffc0cb",
  WHITE: "#ffffff",
};

export const TOOL_ITEMS = {
  BRUSH: "BRUSH",
  LINE: "LINE",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  ARROW: "ARROW",
  ERASER: "ERASER",
  TEXT: "TEXT",
};

export const TOOL_ACTION_TYPES = {
  NONE: "NONE",
  DRAWING: "DRAWING",
  ERASING: "ERASING",
  WRITING: "WRITING",
};

export const BOARD_ACTIONS = {
  CHANGE_TOOL: "CHANGE_TOOL",
  DRAW_DOWN: "DRAW_DOWN",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
  ERASE: "ERASE",
  CHANGE_ACTION_TYPE: "CHANGE_ACTION_TYPE",
  CHANGE_TEXT: "CHANGE_TEXT",
  UNDO: "UNDO",
  REDO: "REDO",
};

export const TOOLBOX_ACTIONS = {
  CHANGE_STROKE: "CHANGE_STROKE",
  CHANGE_FILL: "CHANGE_FILL",
  CHANGE_SIZE: "CHANGE_SIZE",
};

// Define which tools should show stroke color options
export const STROKE_TOOL_TYPES = [
  TOOL_ITEMS.BRUSH,
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];

// Define which tools should show fill color options
export const FILL_TOOL_TYPES = [TOOL_ITEMS.RECTANGLE, TOOL_ITEMS.CIRCLE];

// Define which tools should show size options
export const SIZE_TOOL_TYPES = [
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];
