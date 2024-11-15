import { useQuery } from '@tanstack/react-query';
import type TickData from "~/types/TickData.type";
import { useEffect, useMemo, useState } from "react";

const fetchDateRangeData = async (): Promise<TickData[]> => {
  const response: Response = await fetch(`/api/mock-range-data`);

  if (!response.ok) {
    throw new Error('Failed to load data');
  }

  const { data } = await response.json() as { data: TickData[] };
  return data;
};


const useMockData = () => {
  const [cachedData, setCachedData] = useState([]);
  const { data, error, isLoading, isError, isFetching, refetch, status, isSuccess } = useQuery({
    queryKey: ['mockData'],
    queryFn: fetchDateRangeData,
    enabled: cachedData.length === 0,
  });

  useEffect(() => {
    if (data && isSuccess) {
      setCachedData(data);
    }
  }, [data, isSuccess])

  return {
    data: data ?? cachedData,
    error,
    isLoading,
    isError,
    isFetching,
    isSuccess,
    status,
    refetch,
  };
};

export default useMockData;
