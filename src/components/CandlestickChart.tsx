import React, { useMemo, useState } from "react";
import * as d3 from "d3";
import Candle from "./Candle";
import CrossHairs from "~/components/CrossHairs";
import { useWindowDimensions } from "~/hooks/useWindowDimensions";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import calculateThreePointTrendLines from "~/utils/calculateThreePointTrendLines";
import type TickData from "~/types/TickData.type";

type ChartProps = {
  tickData?: TickData[];
};

const CandlestickChart: React.FC<ChartProps> = ({ tickData = [] }) => {
  const dimensions = useWindowDimensions();
  const data = useMemo(() => aggregateTicksToOHLC(tickData, 2000), [tickData]);

  const trendLines = useMemo(() => calculateThreePointTrendLines(data), [data]);

  console.log('trendLines', trendLines);

  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const gap = 2;
  const candleWidth = Math.max(
    1,
    Math.floor((dimensions.width - gap * (data.length - 1)) / data.length),
  );

  const priceMax = Math.ceil(d3.max(data.map((bar) => bar.high))! + 10);
  const priceMin = Math.floor(d3.min(data.map((bar) => bar.low))! - 10);

  const chartDims = {
    pixelWidth: dimensions.width,
    pixelHeight: dimensions.height,
    dollarHigh: priceMax,
    dollarLow: priceMin,
    dollarDelta: priceMax - priceMin,
  };

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
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Generate y-axis ticks
  const yTicks = useMemo(() => {
    const scale = d3
      .scaleLinear()
      .domain([priceMin, priceMax])
      .range([chartDims.pixelHeight, 0]);
    return scale.ticks(10); // 10 tick marks for the y-axis
  }, [priceMin, priceMax, chartDims.pixelHeight]);

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      className="bg-chart-bg text-white"
      onMouseMove={onMouseMoveInside}
      onClick={() => console.log(`Click at ${mouseCoords.x}, ${mouseCoords.y}`)}
      onMouseLeave={onMouseLeave}
    >
      {/* Render Y-Axis Labels */}
      {yTicks.map((tick, index) => (
        <g key={`y-tick-${index}`} transform={`translate(0, ${pixelFor(tick)})`}>
          <line
            x1={40} // Reserve space for labels
            x2={dimensions.width}
            stroke="gray"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <text x="30" y="5" fill="white" fontSize="10" textAnchor="end">
            {tick}
          </text>
        </g>
      ))}

      {/* Render Candles */}
      {data.map((bar, i) => {
        const candleX = i * (candleWidth + gap);
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

      {/* Render Trendlines */}
      {trendLines.map((line, index) => {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];

        return (
          <line
            key={`trendline-${index}`}
            x1={start.x * (candleWidth + gap)}
            y1={pixelFor(start.y)}
            x2={end.x * (candleWidth + gap)}
            y2={pixelFor(end.y)}
            stroke={line.direction === "up" ? "green" : "red"}
            strokeWidth="2"
            strokeDasharray={line.direction === "down" ? "4 4" : undefined} // Dotted for downtrend (optional)
          />
        );
      })}

      {/* Display CrossHairs */}
      <CrossHairs x={mouseCoords.x} y={mouseCoords.y} chart_dims={chartDims} />

      {/* Display Mouse Coordinates */}
      <text x="10" y="16" fill="white" fontSize="10">
        <tspan>
          Mouse: {mouseCoords.x}, {mouseCoords.y}
        </tspan>
        <tspan x="10" y="30">
          Dollars: ${dollarAt(mouseCoords.y)}
        </tspan>
      </text>
    </svg>
  );
};

export default CandlestickChart;