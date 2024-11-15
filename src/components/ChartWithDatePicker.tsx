'use client'
import React, { useMemo } from "react";
import { DatePickerWithRange } from "~/components/ui/datepicker";
// import LineChart from './LineChart';
import useSelectDateRange from "~/hooks/useSelectDates";
import CandlestickChart from "~/components/CandlestickChart";
import useSimulatedLiveData from "~/hooks/useSimulateLiveData";
import useMockData from "~/hooks/useMockData";
import { Button } from "~/components/ui/button";
import aggregateTicksToOHLC from "~/utils/aggregateTicksToOHLC";
import * as d3 from "d3";
// import useMockData from "~/hooks/useMockData";

const ChartWithDatePicker = () => {
  const folderPath = 'src/parsers/data';
  // const {
  //   startDate,
  //   endDate,
  //   data,
  //   isLoading,
  //   error,
  //   setStartDate,
  //   setEndDate,
  // } = useSelectDateRange(folderPath);
  const { data: tickData, isLoading, error } = useMockData();
  const { liveData, start, stop, restart, isRunning } = useSimulatedLiveData(tickData, 1, 200);
  const ogData = useMemo(() => aggregateTicksToOHLC(tickData, 2000), [liveData]);
  const data = useMemo(() => aggregateTicksToOHLC(liveData, 2000), [liveData]);

  const priceMax = useMemo(() =>  Math.ceil(d3.max(ogData.map((bar) => bar.high))! + 10), [data]);
  const priceMin = useMemo(() => Math.floor(d3.min(ogData.map((bar) => bar.low))! - 10), [data]);

  return (
    <div>
      <h2>Select a Date Range</h2>
      {/*<DatePickerWithRange*/}
      {/*  startDate={startDate}*/}
      {/*  endDate={endDate}*/}
      {/*  setStartDate={setStartDate}*/}
      {/*  setEndDate={setEndDate}*/}
      {/*/>*/}
      <Button onClick={start}>
        start
      </Button>
      <Button onClick={stop}>
        stop
      </Button>
      <Button onClick={restart}>
        replay
      </Button>

      {isLoading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
      {/*{data && data.length > 0 && <LineChart data={data} />}*/}
      {/*{data && data.length > 0 && <CandlestickChart data={data} />}*/}
       <CandlestickChart data={data} defaultMax={priceMax} defaultMin={priceMin}/>
    </div>
  );
};

export default ChartWithDatePicker;
