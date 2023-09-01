import fs from 'node:fs';
import { parse, Parser } from 'csv-parse';
import * as readline from 'readline';
import events from 'events';

const initParser = (delimiter: string) => {
  return parse({
    delimiter
  });
};

const closeParser = async (parser: Parser, rl: readline.Interface) => {
  // Close the readable stream
  await events.once(rl, 'close');

  // Close the parser
  parser.end();
};

const parseCsvFile = (parser: Parser, callback: (record: any) => void) => {
  // Use the readable stream api to consume records
  parser.on('readable', () => {
    let record;
    while ((record = parser.read()) !== null) {
      callback(record);
    }
  })
    .on('error', (err) => {
      console.error(err.message);
    })
    .on('end', () => {
      console.info('Parsing - End');
    });
};

const readCsvFile = (parser: Parser, filePath: string) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    parser.write(`${line}\n`);
  });
  return rl;
};

export const parsingProcess = async (filePath: string, delimiter: string, callback: (record: any) => void) => {
  // Initialize the parser
  const parser = initParser(delimiter);
  // Init the CSV stream parsing
  parseCsvFile(parser, callback);
  // Write data to the stream
  const rl = readCsvFile(parser, filePath);
  // Close the readable stream & parser
  await closeParser(parser, rl);
};
