import { type OHLCData, type Point, type Trend, type TrendLine } from "~/types";

// Function to capture turning points with both high and low values, including engulfing bars
const findSequentialTurningPoints = (
  data: OHLCData[],
  windowSize = 2
): Point[] => {
  const turningPoints: Point[] = [];

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;

    // Check if it's a relative high
    const isHigh =
      data.slice(i - windowSize, i).every((p) => p.high < currentHigh) &&
      data.slice(i + 1, i + 1 + windowSize).every((p) => p.high < currentHigh);

    // Check if it's a relative low
    const isLow =
      data.slice(i - windowSize, i).every((p) => p.low > currentLow) &&
      data.slice(i + 1, i + 1 + windowSize).every((p) => p.low > currentLow);

    // Add to turning points if it’s either a high or low
    if (isHigh || isLow) {
      turningPoints.push({
        x: i,
        y: isHigh ? currentHigh : currentLow,
        type: isHigh ? "high" : "low",
      });
    }
  }

  return turningPoints;
};

// Function to find valid trends based on captured turning points
const findValidTrends = (
  turningPoints: Point[],
  minTouches = 3,
  angleTolerance = 0.1// Maximum allowable slope deviation
): Trend[] => {
  if (turningPoints.length < 2) return [];

  const trends: Trend[] = [];
  let currentTrend: Point[] = [];
  let initialSlope: number | null = null;

  for (const currentPoint of turningPoints) {
    const lastPoint = currentTrend[currentTrend.length - 1];
    if (!lastPoint) {
      // Start a new trend with the first point
      currentTrend.push(currentPoint);
      continue;
    }

    // Calculate the slope between the first point in the trend and the current point
    const newSlope =
      (currentPoint.y - currentTrend[0].y) /
      (currentPoint.x - currentTrend[0].x);

    if (initialSlope === null) {
      // Set the initial slope for the trend
      initialSlope = newSlope;
      currentTrend.push(currentPoint);
      continue;
    }

    // Check for slope deviation
    const slopeDeviation = Math.abs(newSlope - initialSlope);
    if (slopeDeviation > angleTolerance) {
      // If deviation exceeds tolerance, finalize the current trend
      if (currentTrend.length >= minTouches) {
        trends.push({
          direction: initialSlope > 0 ? "up" : "down",
          points: [...currentTrend],
        });
      }

      // Start a new trend with the last and current points
      currentTrend = [lastPoint, currentPoint];
      initialSlope = null;
    } else {
      // Add the current point to the trend
      currentTrend.push(currentPoint);
    }
  }

  // Finalize any remaining trend
  if (currentTrend.length >= minTouches) {
    trends.push({
      direction: initialSlope && initialSlope > 0 ? "up" : "down",
      points: currentTrend,
    });
  }

  return trends;
};

// Calculate trend line based on the first and last points of a trend
const calculateTrendLine = (
  point1: Point,
  point2: Point,
  data: OHLCData[],
  nextTrendStartX: number | null = null,
): TrendLine | null => {
  if (!point1 || !point2) return null;

  const { x: x1, y: y1 } = point1;
  const { x: x2, y: y2 } = point2;

  if (x1 === x2) return null;

  const slope = (y2 - y1) / (x2 - x1);
  const intercept = y1 - slope * x1;

  let endX = x2;
  let endY = y2;

  for (let i = x2 + 1; i < data.length; i++) {
    if (nextTrendStartX !== null && i >= nextTrendStartX) {
      // Stop if we reach the next trend's starting x value
      break;
    }
    const trendY = slope * i + intercept;
    endX = i;
    endY = trendY;
  }

  return { slope, intercept, points: [point1, { x: endX, y: endY }] };
};

// Main function to calculate trend lines with three-touch rule
const calculateThreePointTrendLines = (data: OHLCData[], windowSize = 2, angleTolerance = 0.1): TrendLine[] => {
  const turningPoints = findSequentialTurningPoints(data, windowSize);
  const validTrends = findValidTrends(turningPoints, 3, angleTolerance);

  return validTrends
    .filter((trend) => trend.points.length >= 3)
    .map((trend, index) => {
      const nextTrend = validTrends[index + 1];
      const nextTrendStartX = nextTrend ? nextTrend.points[0].x : null;

      return calculateTrendLine(
        trend.points[0],
        trend.points[trend.points.length - 1],
        data,
        nextTrendStartX
      );
    })
    .filter(Boolean) as TrendLine[];
};

export { calculateThreePointTrendLines as calculateTrend };