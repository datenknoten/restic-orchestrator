import {ConfigModel} from './models';
import * as path from 'path';
import * as fse from 'fs-extra';

// tslint:disable-next-line:no-floating-promises
(async () => {
    try {
        const schema = await ConfigModel.getConfigSchema();
        const schemaFileName = path.resolve(
            __dirname,
            '..',
            'dist',
            'schema',
            'config.schema.json',
        );
        await fse.writeFile(schemaFileName, JSON.stringify(schema), {
            encoding: 'utf-8',
        });
    } catch (error) {
        // tslint:disable-next-line:no-console
        console.dir(error.stack);
    }
})();
