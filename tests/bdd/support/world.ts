import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { IWorldOptions } from '@cucumber/cucumber';
import supertest from 'supertest';
import { createApp } from '../../../src/api/app.js';

export const CATALOG: Record<string, string> = {
  'Mechanical Keyboard': 'p1',
  'QA Mug': 'p2',
  '4K Monitor': 'p3',
  'Laptop Stand': 'p4',
  'USB-C Hub': 'p5',
  'HD Webcam': 'p6',
};

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export class StoreWorld extends World {
  agent = supertest(createApp());
  token: string | null = null;
  response: supertest.Response | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  auth() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  get body() {
    if (!this.response) throw new Error('no response captured yet');
    return this.response.body;
  }
}

setWorldConstructor(StoreWorld);
