// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportDump = require('../../../app/service/dump');
import ExportGateway = require('../../../app/service/gateway');
import ExportOpenApp = require('../../../app/service/open/app');
import ExportOpenRouter = require('../../../app/service/open/router');
import ExportOpenRouterExt = require('../../../app/service/open/routerExt');
import ExportOpenRouterResponse = require('../../../app/service/open/router_response');
import ExportOpenRouterRr = require('../../../app/service/open/router_rr');
import ExportOpenRouterStatus = require('../../../app/service/open/router_status');
import ExportOpenService = require('../../../app/service/open/service');
import ExportOpenServiceApi = require('../../../app/service/open/service_api');
import ExportOpenTemplate = require('../../../app/service/open/template');
import ExportOpenTemplateModule = require('../../../app/service/open/template_module');
import ExportOpenTemplateRole = require('../../../app/service/open/template_role');
import ExportVradAd = require('../../../app/service/vrad/ad');
import ExportVradAdDeliveryCity = require('../../../app/service/vrad/ad_delivery_city');
import ExportVradAdDeliveryStrategy = require('../../../app/service/vrad/ad_delivery_strategy');
import ExportVradAdStatus = require('../../../app/service/vrad/ad_status');

declare module 'egg' {
  interface IService {
    dump: AutoInstanceType<typeof ExportDump>;
    gateway: AutoInstanceType<typeof ExportGateway>;
    open: {
      app: AutoInstanceType<typeof ExportOpenApp>;
      router: AutoInstanceType<typeof ExportOpenRouter>;
      routerExt: AutoInstanceType<typeof ExportOpenRouterExt>;
      routerResponse: AutoInstanceType<typeof ExportOpenRouterResponse>;
      routerRr: AutoInstanceType<typeof ExportOpenRouterRr>;
      routerStatus: AutoInstanceType<typeof ExportOpenRouterStatus>;
      service: AutoInstanceType<typeof ExportOpenService>;
      serviceApi: AutoInstanceType<typeof ExportOpenServiceApi>;
      template: AutoInstanceType<typeof ExportOpenTemplate>;
      templateModule: AutoInstanceType<typeof ExportOpenTemplateModule>;
      templateRole: AutoInstanceType<typeof ExportOpenTemplateRole>;
    }
    vrad: {
      ad: AutoInstanceType<typeof ExportVradAd>;
      adDeliveryCity: AutoInstanceType<typeof ExportVradAdDeliveryCity>;
      adDeliveryStrategy: AutoInstanceType<typeof ExportVradAdDeliveryStrategy>;
      adStatus: AutoInstanceType<typeof ExportVradAdStatus>;
    }
  }
}
