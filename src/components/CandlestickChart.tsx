import React, { useState } from "react";
import * as d3 from "d3";
import Candle from "./Candle";
import CrossHairs from "~/components/CrossHairs";
import { useWindowDimensions } from "~/hooks/useWindowDimensions";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
// import { dollarAt } from "~/utils/chartUtils";
import type TickData from "~/types/TickData.type";

type ChartProps = {
  tickData?: TickData[];
};

const CandlestickChart: React.FC<ChartProps> = ({ tickData = [] }) => {
  console.log("data.length", tickData.length);
  const dimensions = useWindowDimensions();
  const data = aggregateTicksToOHLC(tickData, 2000);

  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  // Set the candle width and gap between each bar
  const gap = 2; // Adjust this value to control spacing between bars
  const candleWidth = Math.max(
    1,
    Math.floor((dimensions.width - gap * (data.length - 1)) / data.length),
  );

  // Calculate min and max price with padding of 10 units
  const priceMax = Math.ceil(d3.max(data.map((bar) => bar.high))! + 10);
  const priceMin = Math.floor(d3.min(data.map((bar) => bar.low))! - 10);

  const chartDims = {
    pixelWidth: dimensions.width,
    pixelHeight: dimensions.height,
    dollarHigh: priceMax,
    dollarLow: priceMin,
    dollarDelta: priceMax - priceMin,
  };

  // Map price values to pixel values based on chart height
  const pixelFor = (price: number) => {
    return (
      ((price - chartDims.dollarLow) / chartDims.dollarDelta) *
      chartDims.pixelHeight
    );
  };

  const dollarAt = (pixel: number) => {
    const dollar =
      ((chartDims.pixelHeight - pixel) / chartDims.pixelHeight) *
        chartDims.dollarDelta +
      chartDims.dollarLow;
    return pixel > 0 ? dollar.toFixed(2) : "-";
  };

  const onMouseLeave = () => setMouseCoords({ x: 0, y: 0 });

  const onMouseMoveInside = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      className="bg-chart-bg text-white"
      onMouseMove={onMouseMoveInside}
      onClick={() => console.log(`Click at ${mouseCoords.x}, ${mouseCoords.y}`)}
      onMouseLeave={onMouseLeave}
    >
      {data.map((bar, i) => {
        const candleX = i * (candleWidth + gap); // Adjust candle position with fixed gap
        return (
          <Candle
            key={i}
            data={bar}
            x={candleX}
            candle_width={candleWidth}
            pixelFor={pixelFor}
          />
        );
      })}
      <text x="10" y="16" fill="white" fontSize="10">
        <tspan>
          Mouse: {mouseCoords.x}, {mouseCoords.y}
        </tspan>
        <tspan x="10" y="30">
          Dollars: ${dollarAt(mouseCoords.y)}
        </tspan>
      </text>
      <CrossHairs x={mouseCoords.x} y={mouseCoords.y} chart_dims={chartDims} />
    </svg>
  );
};

export default CandlestickChart;
