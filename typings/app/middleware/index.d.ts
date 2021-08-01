// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportLogin = require('../../../app/middleware/login');

declare module 'egg' {
  interface IMiddleware {
    login: typeof ExportLogin;
  }
}
