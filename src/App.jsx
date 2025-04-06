import React from "react";
import Board from "./components/Board";
import Toolbar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import { BoardProvider } from "./components/store/Board-context";
import { ToolboxProvider } from "./components/store/toolbox-provider";

function App() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <div className="relative w-full h-screen bg-white">
          <Board />
          <Toolbar />
          <Toolbox />
        </div>
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default App;
