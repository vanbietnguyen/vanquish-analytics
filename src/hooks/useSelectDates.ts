import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type TickData from "~/types/TickData.type";

interface FetchDateRangeParams {
  startDate: string;
  endDate: string;
  folderPath?: string;
}

const fetchDateRangeData = async ({
  startDate,
  endDate,
  folderPath = 'src/parsers/data'
}: FetchDateRangeParams): Promise<TickData[]> => {
  if (!startDate || !endDate) {
    throw new Error('Please select both start and end dates.');
  }

  const response: Response = await fetch(`/api/date-range-data?startDate=${startDate}&endDate=${endDate}&folderPath=${folderPath}`);

  if (!response.ok) {
    throw new Error('Failed to load data');
  }

  const { data } = await response.json() as { data: TickData[] };
  return data;
};


const useSelectDateRange = (folderPath: string) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data, error, isLoading, isError, isFetching, refetch, status, isSuccess } = useQuery({
    queryKey: ['dateRangeData', startDate, endDate],
    queryFn: () => fetchDateRangeData({ startDate, endDate, folderPath }),
    enabled: !!startDate && !!endDate,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    startDate,
    endDate,
    data,
    error,
    isLoading,
    isError,
    isFetching,
    isSuccess,
    status,
    setStartDate,
    setEndDate,
    refetch,
  };
};

export default useSelectDateRange;
