import fs from 'node:fs';
import { parse, Parser } from 'csv-parse';
import * as readline from 'readline';
import events from 'events';
import { BundleBuilder } from './bundle-creator';
import { type CsvMapperDefinition, mappingProcess } from './csv-mapper';
import { convertStoreToStix } from '../database/stix-converter';
import { ENTITY_TYPE_EXTERNAL_REFERENCE } from '../schema/stixMetaObject';
import { Readable } from 'stream';

const initParser = (delimiter: string) => {
  return parse({
    delimiter,
    relax_column_count: true, // https://csv.js.org/parse/options/relax_column_count/
  });
};

const parseCsvFile = (parser: Parser, callback: (record: any) => void) => {
  // Use the readable stream api to consume records
  parser.on('readable', () => {
    let record;
    /* eslint-disable no-cond-assign */
    while ((record = parser.read()) !== null) {
      callback(record);
    }
  })
    .on('error', (err) => {
      throw Error(`CSV Parser : ${err}`);
    });
};

const readCsvFile = (parser: Parser, filePath: string) => {
  const readLine = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  readLine.on('line', (line) => {
    parser.write(`${line}\n`);
  });
  return readLine;
};

const readCsvBufferContent = (parser: Parser, buffer: Buffer) => {
  const readable  = Readable.from(buffer);

  readable.on('data', (chunk) => {
    parser.write(`${chunk}\n`);
  });
  return readable;
};

const parsingProcess = async (content: Buffer | string, delimiter: string, callback: (record: any) => void) => {
  // Initialize the parser
  const parser = initParser(delimiter);
  // Init the CSV stream parsing
  parseCsvFile(parser, callback);
  // Write data to the stream
  let readable;
  if (content instanceof Buffer) {
    readable = readCsvBufferContent(parser, content);
  } else {
    readable = readCsvFile(parser, content);
  }

  // Close the readable stream
  await events.once(readable, 'close');

  // Close the parser
  parser.end();
};

// -- BUNDLE PROCESS --
// TODO: move method to other file ?

const inlineEntityTypes = [ENTITY_TYPE_EXTERNAL_REFERENCE];

export const bundleProcess = async (content: Buffer | string, mapper: CsvMapperDefinition, delimiter: string) => {
  // TODO: sanity check validation mapper

  const bundleBuilder = new BundleBuilder();

  let skipLine = mapper.has_header;
  const bundleProcess = (record: string[]) => {
    // Handle header
    if (skipLine) {
      skipLine = false;
    } else {
      // Compute input by representation
      const inputs = mappingProcess(mapper, record);
      // Remove inline elements
      const withoutInlineInputs = inputs.filter((input) => !inlineEntityTypes.includes(input.entity_type as string));
      // Transform entity to stix
      // @ts-ignore
      const stixObjects = withoutInlineInputs.map((input) => convertStoreToStix(input));
      // Add to builder
      bundleBuilder.addObjects(stixObjects);
    }
  }

  await parsingProcess(content, delimiter, (record) => bundleProcess(record));

  return bundleBuilder;
}
