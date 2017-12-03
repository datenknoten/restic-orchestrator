// import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import {
    expect,
    assert,
} from 'chai';

import {
    ConfigModel,
} from '../models';

import {
    JSONSchemaNotFoundError,
    ConfigFileNotFoundError,
    ConfigFileEmptyError,
    ConfigFileInvalidError,
} from '../errors';

import * as fse from 'fs-extra';


describe('ExecutorHelper', function() {
    // const application = new ApplicationModel();

    describe('getConfigSchema', function() {
        // tslint:disable-next-line:no-invalid-this
        this.timeout(10000);
        /**
         * Checks a JSON-Schema object
         */
        // tslint:disable-next-line:no-any
        function checkSchema(_schema: any) {
            expect(_schema).to.be.an('object');
            expect(_schema).to.have.property('type', 'object');
            expect(_schema.properties).to.be.an('object');
            expect(Object.keys(_schema).length).to.be.equal(5);
            expect(_schema.required).to.be.an('array');
            expect(_schema.required).to.have.property('length', 4);
        }

        // tslint:disable-next-line:no-any
        let schema: any;
        it('should generate a schema with access to the interface', async function() {
            schema = await ConfigModel.getConfigSchema();

            checkSchema(schema);
        });

        it('should generate a schema without access to the interface', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async (path: string) => {
                return path.endsWith('config.schema.json');
            });
            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => JSON.stringify(schema));

            const _schema = await ConfigModel.getConfigSchema();

            checkSchema(_schema);
            pathExistsStub.restore();
            readFileStub.restore();
        });

        it('should throw an error if no schema could be found', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return false;
            });

            // TODO This should be converted to https://github.com/domenic/chai-as-promised
            try {
                await ConfigModel.getConfigSchema();
                assert(false, 'This should not be reached');
            } catch (error) {
                expect(error).to.be.instanceOf(JSONSchemaNotFoundError);
            }
            pathExistsStub.restore();
        });
    });

    describe('getConfig', function() {
        it('should convert a config file into ConfigModel instances', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return true;
            });

            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => JSON.stringify([
                {
                    'user': 'datenknoten',
                    'host': 'web.int.datenknoten.me',
                    'needsSudo': true,
                    'backupPassword': '123456',
                    'repository': '/tmp/backup',
                    'files': [
                        '/etc',
                    ],
                },
            ],
            ));

            const items = await ConfigModel.getConfig();

            expect(items).to.be.an('array');
            expect(items).to.have.property('length', 1);

            const item = items.pop();

            expect(item).to.be.an.instanceOf(ConfigModel);

            if (item) {
                expect(item).to.have.property('user', 'datenknoten');
                expect(item).to.have.property('needsSudo', true);
                expect(item).to.have.property('host', 'web.int.datenknoten.me');
                expect(item).to.have.property('repository', '/tmp/backup');
                expect(item.files).to.be.an('array');
                expect(item.files).to.have.property('length', 1);
            }

            readFileStub.restore();
            pathExistsStub.restore();
        });

        it('should fail with an empty config', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return true;
            });

            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => '');

            try {
                await ConfigModel.getConfig();
                assert(false, 'This should not be reached');
            } catch (error) {
                expect(error).to.be.an.instanceOf(ConfigFileEmptyError);
            }

            readFileStub.restore();
            pathExistsStub.restore();
        });

        it('should fail without a config', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return false;
            });

            try {
                await ConfigModel.getConfig();
                assert(false, 'This is invalid');
            } catch (error) {
                expect(error).to.be.an.instanceOf(ConfigFileNotFoundError);
            }

            pathExistsStub.restore();
        });

        it('should fail with config that contains invalid json', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return true;
            });

            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => 'xx}');

            try {
                await ConfigModel.getConfig();
                assert(false, 'This should not be reached');
            } catch (error) {
                expect(error).to.be.an.instanceOf(ConfigFileInvalidError);
            }

            readFileStub.restore();
            pathExistsStub.restore();
        });

        it('should fail with a config that contains invalid data', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return true;
            });

            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => '{}');

            try {
                await ConfigModel.getConfig();
                assert(false, 'This should not be reached');
            } catch (error) {
                expect(error).to.be.an.instanceOf(ConfigFileInvalidError);
            }

            readFileStub.restore();
            pathExistsStub.restore();
        });

        it('should fail with a config that does not conform to the schema', async function() {
            const pathExistsStub = sinon.stub(fse, 'pathExists');
            pathExistsStub.callsFake(async () => {
                return true;
            });

            const readFileStub = sinon.stub(fse, 'readFile');
            readFileStub.callsFake(async () => '[{}]');

            try {
                await ConfigModel.getConfig();
                assert(false, 'This should not be reached');
            } catch (error) {
                expect(error).to.be.an.instanceOf(ConfigFileInvalidError);
            }

            readFileStub.restore();
            pathExistsStub.restore();
        });
    });
});
