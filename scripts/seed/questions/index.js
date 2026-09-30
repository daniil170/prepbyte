import { pythonQuestions } from './python.js';
import { databasesSqlQuestions } from './databases_sql.js';
import { networksQuestions } from './networks.js';
import { computerArchitectureQuestions } from './computer_architecture.js';
import { spreadsheetsQuestions } from './spreadsheets.js';
import { informationSecurityQuestions } from './information_security.js';
import { htmlCssQuestions } from './html_css.js';

export const SEED_QUESTIONS = [
  ...pythonQuestions,
  ...databasesSqlQuestions,
  ...networksQuestions,
  ...computerArchitectureQuestions,
  ...spreadsheetsQuestions,
  ...informationSecurityQuestions,
  ...htmlCssQuestions,
];

export const seedQuestions = SEED_QUESTIONS;
