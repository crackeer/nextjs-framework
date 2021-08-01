// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportApollo = require('../../../app/controller/apollo');
import ExportGateway = require('../../../app/controller/gateway');
import ExportHome = require('../../../app/controller/home');
import ExportUser = require('../../../app/controller/user');
import ExportUtil = require('../../../app/controller/util');

declare module 'egg' {
  interface IController {
    apollo: ExportApollo;
    gateway: ExportGateway;
    home: ExportHome;
    user: ExportUser;
    util: ExportUtil;
  }
}
