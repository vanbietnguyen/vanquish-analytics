'use client';
import React, {useEffect, useMemo, useRef, useState} from "react";
import {Button} from "~/components/ui/button";
import {Slider} from "~/components/ui/slider";
import CandlestickChart from "~/components/CandlestickChart";
import useSimulatedLiveData from "~/hooks/useSimulateLiveData";
import useMockData from "~/hooks/useMockData";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import {calculateTrend, findSequentialTurningPoints} from "~/utils/calculateThreePointTrendLines";
import * as d3 from "d3";
import {type Trend, type TrendLine} from "~/types";

const SimulatedChart = () => {
  const [ticksPerInterval, setTicksPerInterval] = useState(200);
  const [turningPoints, setTurningPoints] = useState([])
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

  const filterTrends = (newTrends) => {
    if (!primaryTrend.current) return newTrends;
    const primaryDirection = primaryTrend.current.slope > 0 ? "up" : "down";
    const filteredTrends: Trend[] = [];
    for (let i = (lastProcessedIndex.current || 0) + 1; i < newTrends.length; i++) {
      const trend = newTrends[i];
      const currentTrendDirection = trend.slope > 0 ? "up" : "down";

      // Skip trends in the same direction as the primary trend
      if (primaryDirection === currentTrendDirection) continue;

      filteredTrends.push(trend);
    }

    return filteredTrends;
  }

  useEffect(() => {
    if (data.length === 0) return;

    // Calculate new trends
    const newTurningPoints = findSequentialTurningPoints(data, 2);
    setTurningPoints(newTurningPoints);
    console.log('data', data)

    const newTrends = calculateTrend(newTurningPoints, data);
    console.log('newTrends', newTrends);
    if (newTrends.length === 0) return; // Escape if no trends exist

    // Initialize the primary trend if it doesn't exist
    if (!primaryTrend.current) {
      primaryTrend.current = newTrends.find(({ shouldExtend }) => shouldExtend);
    }

    if (newTrends.length === 1) {
      setTrendLines(newTrends);
      return;
    }

    const filteredTrends = filterTrends(newTrends);
    console.log('filteredTrends', filteredTrends);
    console.log('primary before', primaryTrend.current)

    const primary = primaryTrend.current;
    const threshold = 5; // Threshold for deviation


    // Process trends starting after the last processed index

    // Get the last price of the most recent candle
    const lastCandle = data[data.length - 1];
    const lastPrice = lastCandle.close;

    // Extend trends that have `shouldExtend` set to true
    const extendedTrends = trendLines.map((trend) => {
      if (!trend.shouldExtend) return trend;

      const newEndX = data.length - 1; // Extend to the current data length
      const newEndY = trend.slope * newEndX + trend.intercept; // Use original slope and intercept
      const deviation = Math.abs(lastPrice - newEndY);
      console.log('deviation', deviation)

      // Stop extending if deviation exceeds threshold
      let shouldExtend = deviation < threshold;

      // If the primary trend stops extending, reset it
      if (!shouldExtend && primary.points[0].x === trend.points[0].x) {
        const newPrimaryTrend = newTrends.find(({ shouldExtend }) => shouldExtend);
        primaryTrend.current = newPrimaryTrend || trend;
        shouldExtend = Boolean(newPrimaryTrend) ?? true;
      }

      return {
        ...trend,
        shouldExtend,
        points: [
          ...trend.points,
          { x: newEndX, y: newEndY }, // Extend with the new endpoint
        ],
      };
    });

    console.log('extended', extendedTrends)

    // Combine trends and update last processed index
    const updatedTrendLines = [...extendedTrends, ...filteredTrends];
    console.log('updatedTRendlins', updatedTrendLines);
    lastProcessedIndex.current = updatedTrendLines.length - 1;
    console.log('last porddesced', lastProcessedIndex.current);

    // Update trend lines
    setTrendLines(updatedTrendLines);

    console.log("Primary Trend after:", primaryTrend.current);
    console.log('>>>>>>>>>>>>>>>>>')
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
        turningPoints={turningPoints}
      />
    </div>
  );
};

export default SimulatedChart;
