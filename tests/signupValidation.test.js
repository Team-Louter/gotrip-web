import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidSignupBirthDate, isValidSignupEmail, isValidSignupPassword } from '../src/data/signupValidation.js';

test('signup accepts the four combinations of three character types in the Swagger contract', () => {
  for (const value of ['Abcde123', 'Abcdefg!', 'abcde12!', 'ABCDE12!', 'Abcd123!']) assert.equal(isValidSignupPassword(value), true, value);
  for (const value of ['abcd1234', 'abcdefgh', 'Abc1!', 'AAAabc1!', 'Abcd123!'.repeat(3)]) assert.equal(isValidSignupPassword(value), false, value);
});

test('signup birth dates must be real calendar dates, including leap years', () => {
  for (const value of ['20000101', '2000-02-29', '2000/02/29', ' 20000101 ']) assert.equal(isValidSignupBirthDate(value), true, value);
  for (const value of ['', '200001', '20010229', '19000229', '20001301', '20000431', '20000001', '20000100', null, undefined]) assert.equal(isValidSignupBirthDate(value), false, String(value));
});

test('signup email validation rejects missing fields, whitespace and extra at signs', () => {
  for (const value of ['user@example.test', ' user+trip@example.test ']) assert.equal(isValidSignupEmail(value), true, value);
  for (const value of ['', 'user', 'user@example', '@example.test', 'user name@example.test', 'user@@example.test', null, undefined]) assert.equal(isValidSignupEmail(value), false, String(value));
});
