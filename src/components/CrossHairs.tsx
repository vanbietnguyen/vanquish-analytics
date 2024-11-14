// CrossHairs.tsx
import React from "react";
import classNames from "classnames";

type CrossHairsProps = {
  x: number;
  y: number;
  chart_dims: {
    pixelWidth: number;
    pixelHeight: number;
  };
};

const CrossHairs: React.FC<CrossHairsProps> = ({ x, y, chart_dims }) => {
  if (x === 0 && y === 0) return null;

  return (
    <>
      <line
        x1={0}
        y1={y}
        x2={chart_dims.pixelWidth}
        y2={y}
        className={classNames("stroke-white opacity-70", "stroke-dasharray-cross-hair")}
      />
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={chart_dims.pixelHeight}
        className={classNames("stroke-white opacity-70", "stroke-dasharray-cross-hair")}
      />
    </>
  );
};

export default CrossHairs;
