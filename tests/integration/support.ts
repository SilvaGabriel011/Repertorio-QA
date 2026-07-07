import supertest from 'supertest';
import { createApp } from '../../src/api/app.js';

export type Agent = ReturnType<typeof supertest>;

export const ALICE = { email: 'alice.qa@example.com', password: 'S3curePass!' };
export const BOB = { email: 'bob.qa@example.com', password: 'S3curePass!' };

// A fresh in-process app per test — no server socket, no shared state.
export function newAgent(): Agent {
  return supertest(createApp());
}

export async function login(agent: Agent, user = ALICE): Promise<string> {
  const res = await agent.post('/api/auth/login').send(user);
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return res.body.token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
