'use client';
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import CandlestickChart from "~/components/CandlestickChart";
import useSimulatedLiveData from "~/hooks/useSimulateLiveData";
import useMockData from "~/hooks/useMockData";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import { calculateTrend } from "~/utils/calculateThreePointTrendLines";
import * as d3 from "d3";
import {Trend, TrendLine} from "~/types";

const SimulatedChart = () => {
  const [ticksPerInterval, setTicksPerInterval] = useState(200);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const primaryTrend = useRef<TrendLine | null>(null);
  const lastProcessedIndex = useRef(0)

  const { data: tickData, isLoading, error } = useMockData();
  const { liveData, start, stop, restart } = useSimulatedLiveData(
      tickData,
      1000,
      ticksPerInterval,
  );

  // Aggregate ticks into OHLC bars
  const ogData = useMemo(() => aggregateTicksToOHLC(tickData, 2000), [tickData]);
  const data = useMemo(() => aggregateTicksToOHLC(liveData, 2000), [liveData]);

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
    if (newTrends.length === 0) return; // Escape if no trends exist

    // Initialize the primary trend if it doesn't exist
    if (!primaryTrend.current) {
      primaryTrend.current = newTrends[0] || null;
      lastProcessedIndex.current = newTrends.length - 1; // Correct index initialization
      setTrendLines(newTrends); // Set initial trend lines
      return;
    }

    const primary = primaryTrend.current;
    const primaryDirection = primary.slope > 0 ? 'up' : 'down';
    // Process trends starting after the last processed index
    const filteredTrends: Trend[] = [];
    for (let i = (lastProcessedIndex.current || 0) + 1; i < newTrends.length; i++) {
      const trend = newTrends[i];
      console.log('newTRend', trend);
      console.log('primaryTrend', primaryTrend.current)
      const currentTrendDirection = trend.slope > 0 ? 'up' : 'down';
      // Skip trends in the same direction as the primary trend
      if (primaryDirection === currentTrendDirection) continue;

      filteredTrends.push(trend);
    }

    // Extend trends that have `shouldExtend` set to true
    const extendedTrends = trendLines.map((trend) => {
      if (!trend.shouldExtend) return trend;

      const newEndX = data.length - 1; // Extend to the current data length
      const newEndY = trend.slope * newEndX + trend.intercept; // Use original slope and intercept

      return {
        ...trend,
        points: [
          ...trend.points,
          { x: newEndX, y: newEndY }, // Extend with the new endpoint
        ],
      };
    });

    // determine direction based on threshold. or some qualifier

    const updatedTrendLines = [...extendedTrends, ...filteredTrends];
    lastProcessedIndex.current = updatedTrendLines.length - 1;
    // Update trend lines by appending only new valid trends and extending existing ones
    setTrendLines(updatedTrendLines);

    // Update the last processed index

    console.log("Primary Trend:", primaryTrend.current);
  }, [data]);

  return (
    <div>
      <h2>Simulated Live Chart</h2>
      <Button onClick={start}>Start</Button>
      <Button onClick={stop}>Stop</Button>
      <Button onClick={restart}>Restart</Button>
      <Slider
        defaultValue={[ticksPerInterval]}
        max={8000}
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
