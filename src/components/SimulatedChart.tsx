'use client';
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import CandlestickChart from "~/components/CandlestickChart";
import useSimulatedLiveData from "~/hooks/useSimulateLiveData";
import useMockData from "~/hooks/useMockData";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import { calculateTrend } from "~/utils/calculateThreePointTrendLines";
import * as d3 from "d3";
import { Trend, Point } from "~/types";

const SimulatedChart = () => {
  const [ticksPerInterval, setTicksPerInterval] = useState(200);
  const [trendLines, setTrendLines] = useState<Trend[]>([]);
  const folderPath = "src/parsers/data";

  const { data: tickData, isLoading, error } = useMockData();
  const { liveData, start, stop, restart, isRunning } = useSimulatedLiveData(
    tickData,
    1000,
    ticksPerInterval,
  );

  // Aggregate ticks into OHLC bars
  const ogData = useMemo(() => aggregateTicksToOHLC(tickData, 2000), [tickData]);
  const data = useMemo(() => aggregateTicksToOHLC(liveData, 2000), [liveData]);

  // add min value
  const priceMax = useMemo(
    () => Math.ceil(d3.max(ogData.map((bar) => bar.high))! + 10),
    [ogData],
  );
  const priceMin = useMemo(
    () => Math.floor(d3.min(ogData.map((bar) => bar.low))! - 10),
    [ogData],
  );

  useEffect(() => {
    if (data.length === 0) return;

    // TODO add a new attribute that is a boolean - if the data is either above or below depending on the trend direction
    //  (above === uptrend, below ==== downtrend),
    //  then we don't make any more trends in the same direction
    // once it goes a certain amount of distance in the opposite direction, we switch the boolean
    // then we close the trade and go in the opposite direction once a trend is identified
    // same rule applies to the next trend
    const newTrends = calculateTrend(data);

    setTrendLines((prevTrends) => {
      const extendedTrends = prevTrends.map((prevTrend) => {
        const lastPoint = prevTrend.points[prevTrend.points.length - 1];
        const slope = (lastPoint.y - prevTrend.points[0].y) / (lastPoint.x - prevTrend.points[0].x);

        // Extend the trendline by projecting the slope
        const nextX = Math.min(data.length - 1, lastPoint.x + 10); // Add a cushion of +10 bars
        const nextY = lastPoint.y + slope * (nextX - lastPoint.x);

        const overlappingTrend = newTrends.find((newTrend) => {
          const newTrendStartX = newTrend.points[0].x;
          return newTrendStartX >= lastPoint.x && newTrendStartX <= nextX;
        });

        if (overlappingTrend) {
          // Stop extending at the start of the overlapping trend
          const stopX = overlappingTrend.points[0].x;
          const stopY = lastPoint.y + slope * (stopX - lastPoint.x);
          return {
            ...prevTrend,
            points: [
              prevTrend.points[0],
              { x: stopX, y: stopY } as Point,
            ],
          };
        }

        return {
          ...prevTrend,
          points: [
            prevTrend.points[0],
            { x: nextX, y: nextY } as Point,
          ],
        };
      });

      const newConfirmedTrends = newTrends.filter(
        (newTrend) =>
          !prevTrends.some(
            (prevTrend) =>
              prevTrend.points[0].x === newTrend.points[0].x &&
              prevTrend.points[0].y === newTrend.points[0].y
          )
      );

      // Combine extended trends with new confirmed trends
      return [...extendedTrends, ...newConfirmedTrends];
    });
  }, [data]);

  return (
    <div>
      <h2>Simulated Live Chart</h2>
      <Button onClick={start}>Start</Button>
      <Button onClick={stop}>Stop</Button>
      <Button onClick={restart}>Restart</Button>
      <Slider
        defaultValue={[ticksPerInterval]}
        max={4000}
        step={1}
        value={[ticksPerInterval]}
        onValueChange={([number]) => setTicksPerInterval(number)}
      />
      <p>Ticks per Interval: {ticksPerInterval}</p>
      {isLoading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      <CandlestickChart
        data={data}
        defaultMax={priceMax}
        defaultMin={priceMin}
        trendLines={trendLines}
      />
    </div>
  );
};

export default SimulatedChart;