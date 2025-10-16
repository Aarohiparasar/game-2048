import React from "react";
import Tile from "./Tile";
import "./css/board.css"; // Make sure this CSS file exists

const Board = React.forwardRef(function Board(
  { board, onHover, hoverPos, dragging, dragDirection, dragIndex, changedSet },
  ref
) {
  const size = board?.length || 4;

  // Dynamic grid style
  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, 1fr)`,
    gridTemplateRows: `repeat(${size}, 1fr)`,
    gap: `${Math.max(4, 12 - size)}px`, // smaller gaps for bigger boards
  };

  const boardCls = ["board", dragging ? "dragging" : ""].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={boardCls} style={gridStyle}>
      {board &&
        board.flatMap((row, i) =>
          row.map((value, j) => {
            const isHover = hoverPos && hoverPos.i === i && hoverPos.j === j;
            const inDragLine =
              dragging &&
              dragDirection &&
              ((dragDirection === "left" || dragDirection === "right")
                ? dragIndex === i
                : dragIndex === j);
            const isChanged = changedSet && changedSet.has && changedSet.has(`${i}-${j}`);

            const extraClass = [
              isHover ? "hovered" : "",
              inDragLine ? "highlight-line" : "",
              isChanged ? "changed" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Tile
                key={`${i}-${j}`}
                value={value}
                i={i}
                j={j}
                onHover={onHover}
                extraClass={extraClass}
                size={size} // Pass board size to dynamically scale tile font
              />
            );
          })
        )}
    </div>
  );
});

export default Board;
