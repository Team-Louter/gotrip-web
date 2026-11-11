import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidSignupPassword } from '../src/data/signupValidation.js';

test('signup accepts the four combinations of three character types in the Swagger contract', () => {
  for (const value of ['Abcde123', 'Abcdefg!', 'abcde12!', 'ABCDE12!', 'Abcd123!']) assert.equal(isValidSignupPassword(value), true, value);
  for (const value of ['abcd1234', 'abcdefgh', 'Abc1!', 'AAAabc1!', 'Abcd123!'.repeat(3)]) assert.equal(isValidSignupPassword(value), false, value);
});
