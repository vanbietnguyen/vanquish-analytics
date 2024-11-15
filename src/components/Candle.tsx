import React from "react";
import classNames from "classnames";

type CandleProps = {
  data: {
    open: number;
    close: number;
    high: number;
    low: number;
  };
  x: number;
  candle_width: number;
  pixelFor: (value: number) => number;
};

const Candle: React.FC<CandleProps> = React.memo(({ data, x, candle_width, pixelFor }) => {
  const up = data.close > data.open;

  // Calculate bar and wick positions
  const barTop = pixelFor(up ? data.close : data.open);
  const barBottom = pixelFor(up ? data.open : data.close);
  const barHeight = Math.abs(barBottom - barTop); // Ensure height is positive
  const wickTop = pixelFor(data.high);
  const wickBottom = pixelFor(data.low);

  return (
    <>
      {/* Candle body */}
      <rect
        x={x - candle_width / 2}
        y={Math.min(barTop, barBottom)} // Position at the topmost point
        width={candle_width}
        height={barHeight}
        className={classNames(
          "stroke-1",
          up ? "fill-candle-up stroke-candle-up" : "fill-candle-down stroke-candle-down"
        )}
      />
      {/* Top wick */}
      <line
        x1={x}
        y1={barTop}
        x2={x}
        y2={wickTop}
        className={classNames(
          "stroke-1.5",
          up ? "stroke-candle-up" : "stroke-candle-down"
        )}
      />
      {/* Bottom wick */}
      <line
        x1={x}
        y1={barBottom}
        x2={x}
        y2={wickBottom}
        className={classNames(
          "stroke-1.5",
          up ? "stroke-candle-up" : "stroke-candle-down"
        )}
      />
    </>
  );
});

Candle.displayName = 'Candle';
export default Candle;
