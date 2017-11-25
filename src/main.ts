import { ApplicationModel } from './models';


// tslint:disable-next-line:no-floating-promises
(async () => {
    const application = new ApplicationModel();
    await application.run();
})();
