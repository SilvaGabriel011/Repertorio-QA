import { sleep } from 'k6';
import { browse, purchase } from './helpers.js';

export const options = {
  scenarios: {
    ramping_pressure: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },
        { duration: '60s', target: 75 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  if (__ITER % 4 === 0) {
    purchase();
  } else {
    browse();
  }
  sleep(0.3);
}
