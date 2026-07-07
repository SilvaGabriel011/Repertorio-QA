import { sleep } from 'k6';
import { browse } from './helpers.js';

export const options = {
  scenarios: {
    flash_sale: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '20s', target: 5 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  browse();
  sleep(0.2);
}
