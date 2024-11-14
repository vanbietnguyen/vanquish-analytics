import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tableFromIPC } from 'apache-arrow';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getArrowFileStats(folderPath: string) {
  try {
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.arrow'));

    let totalRows = 0;
    const fileStats = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      console.log(`Processing file: ${filePath}`);

      const fileBuffer = fs.readFileSync(filePath);
      const table = tableFromIPC(fileBuffer);

      const numRows = table.numRows;
      totalRows += numRows;

      // Log the first row, if available
      const firstRow = numRows > 0 ? table.get(0) : null;
      if (firstRow) {
        console.log(`First row of ${file}:`, firstRow);
      } else {
        console.log(`File ${file} is empty.`);
      }

      // Gather basic stats for each file
      fileStats.push({
        fileName: file,
        numRows: numRows,
        numColumns: table.numCols,
        schema: table.schema.fields.map(field => field.name) // Column names
      });
    }

    console.log(`Total files processed: ${files.length}`);
    console.log(`Total rows across all files: ${totalRows}`);
    console.log(`File-specific stats:`, fileStats);
    return { totalRows, totalFiles: files.length, fileStats };

  } catch (error) {
    console.error('An error occurred while retrieving Arrow file stats:', error);
  }
}

// Usage example with folder path
const folderPath = path.join(__dirname, 'data', '2024', '04');  // Update with your actual folder path
getArrowFileStats(folderPath)
  .then(stats => console.log('Arrow file statistics:', stats))
  .catch(error => console.error('Error fetching file stats:', error));
