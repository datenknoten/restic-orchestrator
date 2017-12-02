// import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import { expect } from 'chai';

import * as child_process from 'child_process';

import {ExecutorHelper} from '../helpers';
import {ApplicationModel} from '../models';


describe('ExecutorHelper', function() {
    const application = new ApplicationModel();
    ExecutorHelper.application = application;

    it('should execute without an error', async function() {
        const exec = sinon.stub(child_process, 'exec').callsFake((_arg, callback) => {
            callback(undefined, {
                stdout: 'foo',
                stderr: 'bar',
            });
        });

        const returnValue = await ExecutorHelper.run('ssh-host', 'foobar', 'user');
        expect(returnValue).to.be.an('object');
        expect(returnValue).to.have.property('returnCode', 0);
        expect(returnValue).to.have.property('stdout', 'foo');
        expect(returnValue).to.have.property('stderr', 'bar');
        expect(exec.callCount).to.be.equal(1);

        exec.restore();
    });

    it('should execute with an specific error', async function() {
        const exec = sinon.stub(child_process, 'exec').callsFake((_arg, callback) => {
            callback({ code: 2}, {
                stdout: 'foo',
                stderr: 'bar',
            });
        });

        const returnValue = await ExecutorHelper.run('ssh-host', 'foobar');
        expect(returnValue).to.be.an('object');
        expect(returnValue).to.have.property('returnCode', 2);
        expect(exec.callCount).to.be.equal(1);

        exec.restore();
    });

    it('should execute with an unspecific error', async function() {
        const exec = sinon.stub(child_process, 'exec').callsFake((_arg, callback) => {
            callback({}, {
                stdout: 'foo',
                stderr: 'bar',
            });
        });

        const returnValue = await ExecutorHelper.run('ssh-host', 'foobar');
        expect(returnValue).to.be.an('object');
        expect(returnValue).to.have.property('returnCode', 1);
        expect(exec.callCount).to.be.equal(1);

        exec.restore();
    });
});
