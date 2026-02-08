import React, { useMemo, useRef, useState, useEffect } from 'react';

/**
 * GridBackground - Renders a grid overlay with selective square coloring
 * @param {Array} filledSquares - Array of objects: [{row: 0, col: 0, color: '#00A878'}, ...]
 * @param {number} squareSize - Size of each grid square in pixels (default: 50)
 * @param {string} borderColor - Color of grid lines (default: rgba(255, 255, 255, 0.05))
 * @param {number} borderWidth - Width of grid lines in pixels (default: 1)
 * @param {string} backgroundColor - Background fill color (default: transparent)
 */
export default function GridBackground({
  filledSquares = [],
  squareSize = 50,
  borderColor = 'rgba(255, 255, 255, 0.05)',
  borderWidth = 1,
  backgroundColor = 'transparent'
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Create a map for quick lookup of colored squares
  const filledSquaresMap = useMemo(() => {
    const map = new Map();
    filledSquares.forEach((square) => {
      map.set(`${square.row}-${square.col}`, square.color);
    });
    return map;
  }, [filledSquares]);

  // Calculate grid dimensions to cover entire viewport
  const maxRows = useMemo(() => {
    const rows = Math.ceil(dimensions.height / squareSize) + 1;
    const filledMax = filledSquares.length > 0 ? Math.max(...filledSquares.map(s => s.row)) + 1 : 0;
    return Math.max(rows, filledMax);
  }, [dimensions.height, squareSize, filledSquares]);

  const maxCols = useMemo(() => {
    const cols = Math.ceil(dimensions.width / squareSize) + 1;
    const filledMax = filledSquares.length > 0 ? Math.max(...filledSquares.map(s => s.col)) + 1 : 0;
    return Math.max(cols, filledMax);
  }, [dimensions.width, squareSize, filledSquares]);

  // Generate grid squares
  const squares = useMemo(() => {
    const result = [];
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const key = `${row}-${col}`;
        const color = filledSquaresMap.get(key);
        result.push({
          row,
          col,
          key,
          color,
          x: col * squareSize,
          y: row * squareSize
        });
      }
    }
    return result;
  }, [maxRows, maxCols, squareSize, filledSquaresMap]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <svg
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
      >
        {/* Render filled squares */}
        {squares.map((square) =>
          square.color ? (
            <rect
              key={`filled-${square.key}`}
              x={square.x}
              y={square.y}
              width={squareSize}
              height={squareSize}
              fill={square.color}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          ) : null
        )}

        {/* Render grid lines */}
        {/* Vertical lines */}
        {Array.from({ length: maxCols + 1 }).map((_, col) => (
          <line
            key={`v-${col}`}
            x1={col * squareSize}
            y1={0}
            x2={col * squareSize}
            y2={dimensions.height}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        ))}

        {/* Horizontal lines */}
        {Array.from({ length: maxRows + 1 }).map((_, row) => (
          <line
            key={`h-${row}`}
            x1={0}
            y1={row * squareSize}
            x2={dimensions.width}
            y2={row * squareSize}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        ))}
      </svg>
    </div>
  );
}
