import { useState, useEffect } from "react";

export const useWindowDimensions = (heightFactor = 0.9) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight * heightFactor,
  });

  useEffect(() => {
    const handleResize = () => {
      if (!window) return;

      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight * heightFactor,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [heightFactor]);

  return dimensions;
};
