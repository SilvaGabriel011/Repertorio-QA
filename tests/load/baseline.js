import { sleep } from 'k6';
import { browse, purchase } from './helpers.js';

export const options = {
  scenarios: {
    steady_traffic: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  if (__ITER % 5 === 0) {
    purchase();
  } else {
    browse();
  }
  sleep(0.5);
}
