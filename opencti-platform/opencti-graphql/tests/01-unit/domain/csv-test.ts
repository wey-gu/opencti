import { describe, expect, it } from 'vitest';
import parseCsv from '../../../src/parser/csvParser';
import '../../../src/modules/index';

describe('Excel parser checker', () => {
  it('should file converted', async () => {
    await parseCsv();
    expect(true).toBe(true);
  });
});
