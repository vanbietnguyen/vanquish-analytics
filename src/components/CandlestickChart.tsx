import React, { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import Candle from "./Candle";
import CrossHairs from "~/components/CrossHairs";
import { useWindowDimensions } from "~/hooks/useWindowDimensions";
// import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import { calculateTrend } from "~/utils/calculateThreePointTrendLines";
import { useVirtualizer } from "@tanstack/react-virtual";
// import type TickData from "~/types/TickData.type";
import useDebouncedCallback from "~/hooks/useDebounceCallback";
import { OHLCData } from "~/types";

type ChartProps = {
  data?: OHLCData[];
  defaultMax?: number;
  defaultMin?: number;
};

const CandlestickChart: React.FC<ChartProps> = ({ data = [], defaultMax, defaultMin }) => {
  const dimensions = useWindowDimensions();
  const minorTrendLines = useMemo(() => calculateTrend(data), [data]);
  const majorTrendLines = useMemo(() => calculateTrend(data, 10), [data]);

  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  const handleMouseCords = useDebouncedCallback(setMouseCoords, .5);

  const containerRef = useRef<HTMLDivElement>(null);
  const gap = 2;
  const candleWidth = 1;
  //   Math.max(
  //   1,
  //   Math.floor((dimensions.width - gap * (data.length - 1)) / data.length)
  // );

  console.log('candleWidth', candleWidth);

  const priceMax = defaultMax ?? Math.ceil(d3.max(data.map((bar) => bar.high))! + 10) ;
  const priceMin = defaultMin ?? Math.floor(d3.min(data.map((bar) => bar.low))! - 10);

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

  const [, setScrollPosition] = useState(0);

  // Define the debounced scroll handler
  const handleScroll = useDebouncedCallback(() => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft);
    }
  }, 100); // Debounce delay of 200ms

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Attach the scroll listener
    container.addEventListener("scroll", handleScroll);

    // Cleanup the listener on unmount
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => candleWidth + gap,
    horizontal: true,
    overscan: 500, // Render 5 extra items on each side
  });
  const onMouseLeave = () => handleMouseCords({ x: 0, y: 0 });

  const onMouseMoveInside = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMouseCords({
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
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        display: "flex", // Use flexbox to align the Y-axis and chart
        position: "relative",
      }}
    >
      {/* Y-Axis Container */}
      <svg
        width={50} // Fixed width for Y-axis labels
        height={chartDims.pixelHeight}
        className="bg-chart-bg text-white"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 1,
        }}
      >
        {yTicks.map((tick, index) => (
          <text
            key={`y-tick-${index}`}
            x={30} // Position the text within the Y-axis container
            y={pixelFor(tick)}
            fill="white"
            fontSize="10"
            textAnchor="end"
          >
            {tick}
          </text>
        ))}
      </svg>

      {/* Chart Container */}
      <div
        ref={containerRef}
        style={{
          width: dimensions.width - 50, // Subtract Y-axis width
          height: dimensions.height,
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          marginLeft: 50, // Offset to align with Y-axis
        }}
      >
        <svg
          width={rowVirtualizer.getTotalSize()}
          height={chartDims.pixelHeight}
          className="bg-chart-bg text-white"
          onMouseMove={onMouseMoveInside}
          onClick={() =>
            console.log(`Click at ${mouseCoords.x}, ${mouseCoords.y}`)
          }
          onMouseLeave={onMouseLeave}
        >
          {/* Render Virtualized Candles */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const bar = data[virtualItem.index];
            const candleX = virtualItem.start;

            return (
              <Candle
                key={virtualItem.index}
                data={bar}
                x={candleX}
                candle_width={candleWidth}
                pixelFor={pixelFor}
              />
            );
          })}

          {/* Render Trendlines */}
          {minorTrendLines.map((line, index) => {
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
                strokeDasharray={line.direction === "down" ? "4 4" : undefined}
              />
            );
          })}

          {majorTrendLines.map((line, index) => {
            const start = line.points[0];
            const end = line.points[line.points.length - 1];

            return (
              <line
                key={`trendline-${index}`}
                x1={start.x * (candleWidth + gap)}
                y1={pixelFor(start.y)}
                x2={end.x * (candleWidth + gap)}
                y2={pixelFor(end.y)}
                stroke={"orange"}
                strokeWidth="2"
                strokeDasharray={line.direction === "down" ? "4 4" : undefined}
              />
            );
          })}

          {/* Display CrossHairs */}
          <CrossHairs
            x={mouseCoords.x}
            y={mouseCoords.y}
            chart_dims={chartDims}
          />

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
      </div>
    </div>
  );
};

export default CandlestickChart;