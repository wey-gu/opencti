import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';
import type { StixBundle, StixObject } from '../types/stix-common';

export class BundleBuilder {
  id: string;

  type: 'bundle';

  objects: StixObject[];

  constructor() {
    this.id = `bundle--${uuidv4()}`;
    this.type = 'bundle';
    this.objects = [];
  }

  addObjects(objects: StixObject[]) {
    this.objects.push(...objects);
    return this;
  }

  build(): StixBundle {
    return {
      id: this.id,
      type: this.type,
      objects: R.uniqBy(R.prop('id'), this.objects), // uniq values
    };
  }
}
