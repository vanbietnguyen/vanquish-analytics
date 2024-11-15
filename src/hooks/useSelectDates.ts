import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import pLimit from 'p-limit';

import type TickData from "~/types/TickData.type";
import { generateDateArray } from "~/utils/generateDateArray";

const limit = pLimit(3);

interface FetchDateRangeParams {
  startDate: string;
  endDate: string;
  folderPath?: string;
}

const fetchDateRangeData = async ({
  startDate,
  endDate,
  folderPath = "src/parsers/data",
}: FetchDateRangeParams): Promise<TickData[]> => {
  if (!startDate || !endDate) {
    throw new Error("Please select both start and end dates.");
  }

  const response: Response = await fetch(
    `/api/date-range-data?startDate=${startDate}&endDate=${endDate}&folderPath=${folderPath}`
  );

  if (!response.ok) {
    throw new Error("Failed to load data");
  }

  const { data } = (await response.json()) as { data: TickData[] };
  return data;
};

const useSelectDateRange = (folderPath: string) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [cache, setCache] = useState<Map<string, TickData[]>>(new Map());

  const { data, error, isLoading, isError, isFetching, refetch, status } =
    useQuery({
      queryKey: ["dateRangeData", startDate, endDate],
      queryFn: async () => {
        const dateArray = generateDateArray(startDate, endDate)
          .map((date) => format(date, "yyyy-MM-dd"));
        const missingDates = dateArray.filter((date) => !cache.has(date));

        if (missingDates.length === 0) {
          // Return cached data if all dates are available
          return dateArray.flatMap((date) => cache.get(date)!);
        }

        // Map missing dates into limited concurrent fetches
        const fetchPromises = missingDates.map((date) =>
          limit(() =>
            fetchDateRangeData({
              startDate: date,
              endDate: date,
              folderPath,
            })
          )
        );

        // Await all limited fetches
        const fetchedDataChunks = await Promise.all(fetchPromises);

        // Update cache with the newly fetched data
        setCache((prevCache) => {
          missingDates.forEach((date, index) => {
            prevCache.set(date, fetchedDataChunks[index]);
          });
          return prevCache;
        });

        // Combine cached and fetched data
        return dateArray.flatMap((date) =>
          cache.get(date) ??
          fetchedDataChunks[missingDates.indexOf(date)]
        );
      },
      enabled: !!startDate && !!endDate,
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  const clearCache = (datesToRemove: string[]) => {
    setCache((prevCache) => {
      const newCache = new Map(prevCache);
      datesToRemove.forEach((date) => newCache.delete(date));
      return newCache;
    });
  };

  return {
    startDate,
    endDate,
    data,
    error,
    isLoading,
    isError,
    isFetching,
    status,
    setStartDate,
    setEndDate,
    refetch,
    clearCache,
  };
};

export default useSelectDateRange;