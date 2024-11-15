'use client'
import React from 'react';
import { DatePickerWithRange } from "~/components/ui/datepicker";
// import LineChart from './LineChart';
import useSelectDateRange from "~/hooks/useSelectDates";
import CandlestickChart from "~/components/CandlestickChart";
// import useMockData from "~/hooks/useMockData";

const ChartWithDatePicker = () => {
  const folderPath = 'src/parsers/data';
  const {
    startDate,
    endDate,
    data,
    isLoading,
    error,
    setStartDate,
    setEndDate,
  } = useSelectDateRange(folderPath);

  // const { data, isLoading, error } = useMockData();

  return (
    <div>
      <h2>Select a Date Range</h2>
      <DatePickerWithRange
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />
      {isLoading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
      {/*{data && data.length > 0 && <LineChart data={data} />}*/}
      {/*{data && data.length > 0 && <CandlestickChart data={data} />}*/}
       <CandlestickChart tickData={data} />
    </div>
  );
};

export default ChartWithDatePicker;
