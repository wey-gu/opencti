// eslint-disable-next-line import/no-extraneous-dependencies
import { glob } from 'glob';
import * as fs from 'fs';
import * as R from 'ramda';
import es from './utils/localization/es-es';
import fr from './utils/localization/fr-fr';
import ja from './utils/localization/ja-jp';
import zh from './utils/localization/zh-cn';
import en from './utils/localization/en-us';

let globalMatches = [];

const sortObj = (obj) => {
  return Object.keys(obj)
    .sort().reduce((temp_obj, key) => {
      // eslint-disable-next-line no-param-reassign
      temp_obj[key] = obj[key];
      return temp_obj;
    }, {});
};

const checkMissing = async () => {
  const tsxFiles = await glob('**/*.tsx', { ignore: 'node_modules/**' });
  tsxFiles.forEach((file) => {
    const regex = /t\(['|`]{1}([\w|\s|\d]+)['|`]{1}\)/gm;
    const fileContent = fs.readFileSync(file, { encoding: 'utf8' });
    const matches = fileContent.matchAll(regex);
    for (const match of matches) {
      globalMatches = R.uniq([...globalMatches, match[1]]);
    }
  });
  const missingKeys = [];

  const lang = {
    'en-us': en,
    'es-es': es,
    'fr-fr': fr,
    'ja-jp': ja,
    'zh-cn': zh,
  };

  Object.entries(lang).forEach(([path, local]) => {
    const clone = { ...local };
    globalMatches.forEach((key) => {
      if (!Object.keys(local).map((k) => k.toLowerCase()).includes(key.toLowerCase())) {
        missingKeys.push(`${key} for ${path}`);
        clone[key] = 'UNDEFINED';
      }
    });
    Object.keys(local).map((key) => key.toLowerCase()).forEach((key) => {
      if (!globalMatches.map((k) => k.toLowerCase()).includes(key)) {
        delete clone[key];
      }
    });
    fs.writeFileSync(`src/utils/localization/${path}.ts`, `export default ${JSON.stringify(sortObj(clone), null, 2)}`);
  });

  if (missingKeys.length > 0) {
    console.log(missingKeys);
  }
};
checkMissing();
