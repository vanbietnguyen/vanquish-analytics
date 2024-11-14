import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { tableFromArrays, tableToIPC } from 'apache-arrow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type BatchData = {
  timestamps: string[];
  lastPrices: number[];
  bidPrices: number[];
  askPrices: number[];
  volumes: number[];
}

async function parseAndSaveToDailyArrow(fileName: string) {
  const filePath = path.join(__dirname, 'data', `${fileName}.txt`);

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const initializeBatchData = (): BatchData => ({
      timestamps: [],
      lastPrices: [],
      bidPrices: [],
      askPrices: [],
      volumes: [],
    });

    let batchData = initializeBatchData();
    let currentDay = '';
    const savePromises = [];

    for await (const line of rl) {
      // Split by ';' to get timestamp and prices/volume separately
      const [timestamp, lastPrice, bidPrice, askPrice, volume] = line
        .split(';')
        .map((item) => item.trim());

      // Extract year, month, and day from date portion of timestamp
      const year = timestamp!.slice(0, 4);
      const month = timestamp!.slice(4, 6);
      const day = timestamp!.slice(6, 8);
      const dayIdentifier = `${year}-${month}-${day}`;

      // Check if the day has changed and save the previous day's data if needed
      if (currentDay !== dayIdentifier && batchData.timestamps.length > 0) {
        const [prevYear, prevMonth] = currentDay.split('-');
        savePromises.push(saveDailyBatchToArrow(prevYear!, prevMonth!, currentDay, batchData));
        batchData = initializeBatchData(); // Reset batch data for the new day
        currentDay = dayIdentifier;
      } else if (currentDay === '') {
        currentDay = dayIdentifier; // Initialize `currentDay` for the first line
      }

      // Add data to the current batch
      batchData.timestamps.push(timestamp!);
      batchData.lastPrices.push(parseFloat(lastPrice!));
      batchData.bidPrices.push(parseFloat(bidPrice!));
      batchData.askPrices.push(parseFloat(askPrice!));
      batchData.volumes.push(parseInt(volume!, 10));
    }

    // Save remaining data for the last day if any
    if (batchData.timestamps.length > 0) {
      const [finalYear, finalMonth, finalDay] = currentDay.split('-');
      savePromises.push(saveDailyBatchToArrow(finalYear!, finalMonth!, currentDay, batchData));
    }

    await Promise.all(savePromises);
    // console.log(`Data from ${fileName}.txt successfully parsed and saved in daily Arrow files within monthly directories.`);
  } catch (error) {
    console.error('An error occurred while parsing and saving data:', error);
  }
}

// Helper function to save data for a specific day within the correct month and year directory
async function saveDailyBatchToArrow(year: string, month: string, day: string, data: BatchData) {
  const dirPath = path.join(__dirname, 'data', year, month);
  fs.mkdirSync(dirPath, { recursive: true });

  const outputFilePath = path.join(dirPath, `tickdata_${day}.arrow`);

  const table = tableFromArrays({
    timestamp: data.timestamps,
    lastPrice: new Float64Array(data.lastPrices),
    bidPrice: new Float64Array(data.bidPrices),
    askPrice: new Float64Array(data.askPrices),
    volume: new Int32Array(data.volumes),
  });

  fs.writeFileSync(outputFilePath, Buffer.from(tableToIPC(table).buffer));
  // console.log(`Saved data for ${day} to ${outputFilePath}`);
}

// Usage example for processing multiple files concurrently
const fileNames = ['ES0624tick', 'ES0924tick'];
Promise.all(fileNames.map((fileName) => parseAndSaveToDailyArrow(fileName)))
  .then(() => console.log('All files processed successfully in daily files within monthly directories.'))
  .catch((error) => console.error('Error in processing files:', error));
