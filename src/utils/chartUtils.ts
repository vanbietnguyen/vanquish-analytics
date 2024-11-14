export const dollarAt = (pixel: number, chartDims: any) => {
  const dollar =
    ((chartDims.pixelHeight - pixel) / chartDims.pixelHeight) *
    chartDims.dollarDelta +
    chartDims.dollarLow;

  return pixel > 0 ? dollar.toFixed(2) : "-";
};


export const pixelFor = (price: number, chartDims: any) => {
  return (
    ((price - chartDims.dollarLow) / chartDims.dollarDelta) *
    chartDims.pixelHeight
  );
};
