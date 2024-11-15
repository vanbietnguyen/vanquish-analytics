import { useState, useEffect, useRef } from "react";
import type TickData from "~/types/TickData.type";

const useSimulatedLiveData = (
  data: TickData[],
  interval = 1000,
  ticksPerInterval = 1 // Number of ticks to add per interval
) => {
  const [liveData, setLiveData] = useState<TickData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const currentIndex = useRef(0);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  // Function to start the simulation
  const start = () => {
    if (!isRunning && currentIndex.current < data.length) {
      setIsRunning(true);
      intervalId.current = setInterval(() => {
        if (currentIndex.current >= data.length) {
          stop(); // Stop when all data is streamed
          return;
        }

        // Append the next chunk of ticks to the live data
        const nextTicks = data.slice(
          currentIndex.current,
          currentIndex.current + ticksPerInterval
        );
        setLiveData((prev) => [...prev, ...nextTicks]);
        currentIndex.current += ticksPerInterval;
      }, interval);
    }
  };

  // Function to stop the simulation
  const stop = () => {
    setIsRunning(false);
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  // Function to restart the simulation
  const restart = () => {
    stop();
    currentIndex.current = 0;
    setLiveData([]);
    start();
  };

  useEffect(() => {
    return stop; // Cleanup on unmount
  }, []);

  return { liveData, isRunning, start, stop, restart };
};

export default useSimulatedLiveData;