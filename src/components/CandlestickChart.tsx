import React, {useEffect, useMemo, useRef, useState} from "react";
import * as d3 from "d3";
import {useVirtualizer} from "@tanstack/react-virtual";
import {useWindowDimensions} from "~/hooks/useWindowDimensions";
import {type OHLCData, type Point, type Trend} from "~/types";

type ChartProps = {
  data?: OHLCData[];
  trendLines?: Trend[];
  defaultMax?: number;
  defaultMin?: number;
  turningPoints?: Point[];
};

const CandlestickChart: React.FC<ChartProps> = ({
  data = [],
  trendLines = [],
  turningPoints = [],
  defaultMax,
  defaultMin,
}) => {
  const dimensions = useWindowDimensions();
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; trend: Trend | null }>({
    x: 0,
    y: 0,
    trend: null,
  });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const candleWidth = 6;
  const gap = 2;

  const priceMax = defaultMax ?? Math.ceil(d3.max(data.map((bar) => bar.high))! + 10);
  const priceMin = defaultMin ?? Math.floor(d3.min(data.map((bar) => bar.low))! - 10);

  const chartDims = {
    pixelWidth: dimensions.width - 50, // Subtract Y-axis width
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

  const yTicks = useMemo(() => {
    const scale = d3
      .scaleLinear()
      .domain([priceMin, priceMax])
      .range([chartDims.pixelHeight, 0]);
    return scale.ticks(10);
  }, [priceMin, priceMax, chartDims.pixelHeight]);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => candleWidth + gap,
    horizontal: true,
    overscan: 50,
  });

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setTooltipData({ x: 0, y: 0, trend: null });
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const visibleData = rowVirtualizer.getVirtualItems().map((virtualItem) => ({
      ...data[virtualItem.index],
      x: virtualItem.start,
    }));

    const svg = d3.select(svgRef.current);

    // Clear previous renderings
    svg.selectAll("*").remove();

    // Render Y-Axis Ticks
    svg
      .selectAll(".y-tick")
      .data(yTicks)
      .join("text")
      .attr("class", "y-tick")
      .attr("x", 30)
      .attr("y", (d) => pixelFor(d))
      .attr("fill", "white")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .text((d) => d);

    // Render Candlesticks
    svg
      .selectAll(".candle")
      .data(visibleData)
      .join("g")
      .attr("class", "candle")
      .each(function (d) {
        const group = d3.select(this);

        const x = d.x;
        const up = d.close > d.open;

        const barTop = pixelFor(up ? d.close : d.open);
        const barBottom = pixelFor(up ? d.open : d.close);
        const barHeight = Math.abs(barBottom - barTop);

        const wickTop = pixelFor(d.high);
        const wickBottom = pixelFor(d.low);

        group
          .append("rect")
          .attr("x", x - candleWidth / 2)
          .attr("y", Math.min(barTop, barBottom))
          .attr("width", candleWidth)
          .attr("height", barHeight)
          .attr("fill", up ? "#00ff00" : "#ff0000")
          .attr("stroke", up ? "#008000" : "#800000")
          .attr("stroke-width", 1);

        group
          .append("line")
          .attr("x1", x)
          .attr("y1", barTop)
          .attr("x2", x)
          .attr("y2", wickTop)
          .attr("stroke", up ? "#008000" : "#800000")
          .attr("stroke-width", 1);

        group
          .append("line")
          .attr("x1", x)
          .attr("y1", barBottom)
          .attr("x2", x)
          .attr("y2", wickBottom)
          .attr("stroke", up ? "#008000" : "#800000")
          .attr("stroke-width", 1);
      });

    // Render Turning Points
    svg
      .selectAll(".turning-point")
      .data(turningPoints)
      .join("circle")
      .attr("class", "turning-point")
      .attr("cx", (d) => d.x * (candleWidth + gap))
      .attr("cy", (d) => pixelFor(d.y))
      .attr("r", 5)
      .attr("fill", (d) => (d.type === "high" ? "blue" : "orange"))
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Render Trend Lines with Tooltips
    svg
      .selectAll(".trend-line")
      .data(trendLines)
      .join("line")
      .attr("class", "trend-line")
      .attr("x1", (d) => d.points[0].x * (candleWidth + gap))
      .attr("y1", (d) => pixelFor(d.points[0].y))
      .attr("x2", (d) => d.points[d.points.length - 1].x * (candleWidth + gap))
      .attr("y2", (d) => pixelFor(d.points[d.points.length - 1].y))
      .attr("stroke", (d) => (d.direction === "up" ? "green" : "red"))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.direction === "down" ? "4 4" : null))
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltipData({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          trend: d,
        });
      })
      .on("mouseleave", () => {
        setTooltipData({ x: 0, y: 0, trend: null });
      });

    // Initialize crosshair elements
    const horizontalLine = svg.append("line").attr("class", "crosshair-line");
    const verticalLine = svg.append("line").attr("class", "crosshair-line");

    const handleMouseMove = (event: MouseEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Update crosshairs
      horizontalLine
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", chartDims.pixelWidth)
        .attr("y2", y)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .attr("opacity", 0.7);

      verticalLine
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", chartDims.pixelHeight)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .attr("opacity", 0.7);

      // Update React state for info box
      setMouseCoords({ x, y });
    };

    svg.on("mousemove", handleMouseMove);
    svg.on("mouseleave", () => {
      horizontalLine.attr("opacity", 0);
      verticalLine.attr("opacity", 0);
      setMouseCoords({ x: 0, y: 0 });
    });
  }, [rowVirtualizer.getVirtualItems(), turningPoints, trendLines, chartDims, yTicks]);

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 relative overflow-x-auto"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg
        ref={svgRef}
        className="bg-gray-800"
        width={rowVirtualizer.getTotalSize()}
        height={chartDims.pixelHeight}
      />
      {tooltipData.trend && (
        <div
          ref={tooltipRef}
          className="absolute bg-gray-700 text-white text-sm p-2 rounded shadow-lg z-50"
          style={{
            top: tooltipData.y + 10,
            left: tooltipData.x + 10,
          }}
        >
          <p><strong>Trend Details:</strong></p>
          <p>Direction: {tooltipData.trend.direction}</p>
          <p>Slope: {tooltipData.trend.slope?.toFixed(2)}</p>
          <p>Touches: {tooltipData.trend.points.length}</p>
        </div>
      )}
      <div className="absolute top-2 left-2 text-white text-sm">
        <p>Mouse: {mouseCoords.x}, {mouseCoords.y}</p>
        <p>Dollars: ${dollarAt(mouseCoords.y)}</p>
      </div>
    </div>
  );
};

export default CandlestickChart;
