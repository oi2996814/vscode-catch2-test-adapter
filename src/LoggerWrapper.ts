import * as util from 'vscode-test-adapter-util';
import * as Sentry from '@sentry/node';
import { debugBreak } from './util/DevelopmentHelper';

///

export class LoggerWrapper extends util.Log {
  constructor(configSection: string, outputChannelName: string) {
    super(configSection, undefined, outputChannelName, { depth: 3 }, false);
  }

  //eslint-disable-next-line
  trace(msg: any, ...msgs: any[]): void {
    process.env['TESTMATE_DEBUG'] && super.debug(msg, ...msgs);
  }

  //eslint-disable-next-line
  debugS(msg: any, ...msgs: any[]): void {
    super.debug(msg, ...msgs);
    try {
      Sentry.addBreadcrumb({ message: msg, data: msgs, level: Sentry.Severity.Debug });
    } catch (e) {
      super.error(e);
    }
  }

  //eslint-disable-next-line
  setContext(name: string, context: { [key: string]: any } | null): void {
    super.info('context:' + name, context);
    try {
      Sentry.setContext(name, context);
    } catch (e) {
      this.exceptionS(e);
    }
  }

  setTags(tags: { [key: string]: string }): void {
    try {
      Sentry.setTags(tags);
    } catch (e) {
      this.exceptionS(e);
    }
  }

  //eslint-disable-next-line
  infoS(m: string, ...msg: any[]): void {
    super.info(...msg);
    try {
      Sentry.addBreadcrumb({ message: m, data: msg, level: Sentry.Severity.Info });
      Sentry.captureMessage(m, Sentry.Severity.Info);
    } catch (e) {
      super.error(e);
    }
  }

  infoSWithTags(m: string, tags: { [key: string]: string }): void {
    super.info(m, tags);
    try {
      Sentry.withScope(function (scope) {
        scope.setTags(tags);
        Sentry.captureMessage(m, Sentry.Severity.Info);
      });
    } catch (e) {
      super.error(e);
    }
  }

  //eslint-disable-next-line
  warnS(m: string, ...msg: any[]): void {
    super.warn(m, ...msg);
    try {
      Sentry.captureMessage(m, Sentry.Severity.Warning);
    } catch (e) {
      super.error(e);
    }
  }

  //eslint-disable-next-line
  override error(m: string, ...msg: any[]): void {
    if (!m.startsWith('TODO')) debugBreak();
    super.error(m, ...msg);
  }

  //eslint-disable-next-line
  errorS(m: string, ...msg: any[]): void {
    this.error(m, ...msg);
    try {
      Sentry.captureMessage(m, Sentry.Severity.Error);
    } catch (e) {
      super.error(e);
    }
  }

  //eslint-disable-next-line
  exceptionS(e: unknown, ...msg: unknown[]): void {
    debugBreak();
    super.error(e, ...msg);
    try {
      Sentry.captureException(e);
    } catch (e) {
      super.error(e);
    }
  }
}
