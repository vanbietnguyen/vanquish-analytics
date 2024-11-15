import { useQuery } from '@tanstack/react-query';
import type TickData from "~/types/TickData.type";

const fetchDateRangeData = async (): Promise<TickData[]> => {
  const response: Response = await fetch(`/api/mock-range-data`);

  if (!response.ok) {
    throw new Error('Failed to load data');
  }

  const { data } = await response.json() as { data: TickData[] };
  return data;
};


const useMockData = () => {
  const { data, error, isLoading, isError, isFetching, refetch, status, isSuccess } = useQuery({
    queryKey: ['mockData'],
    queryFn: fetchDateRangeData,
  });

  return {
    data,
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
