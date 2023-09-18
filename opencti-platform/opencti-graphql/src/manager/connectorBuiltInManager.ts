import conf, { logApp } from '../config/conf';
import { lockResource } from '../database/redis';
import { executionContext, SYSTEM_USER } from '../utils/access';
import { TYPE_LOCK_ERROR } from '../config/errors';
import { pingConnector, registerConnector } from '../domain/connector';
import { BUILTIN_IMPORT_CONNECTORS, IMPORT_CONNECTOR_CSV } from '../modules/internal/csvMapper/csvMapper-connector';
import type { AuthContext } from '../types/user';
import { consumeQueue, pushToSync, unregisterConnector } from '../database/rabbitmq';
import type { SetIntervalAsyncTimer } from 'set-interval-async/fixed';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async/fixed';
import type { Manager } from './manager';
import { downloadFile } from '../database/file-storage';
import { Readable } from 'stream';
import type { SdkStream } from '@smithy/types/dist-types/serde';
import { IncomingMessage } from 'http';
import { updateExpectationsNumber, updateProcessedTime, updateReceivedTime } from '../domain/work';
import { bundleProcess } from '../parser/csv-parser';
import { csvMapperMockSimpleEntity } from '../../tests/01-unit/parser/simple-entity-test/csv-mapper-mock-simple-entity';
import { OPENCTI_SYSTEM_UUID } from '../schema/general';
import { resolveUserById } from '../domain/user';

const manager: Manager = {
  id: 'CONNECTOR_BUILTIN_MANAGER',
  name: 'connector built in',
  lockKey: conf.get('connector_builtin_manager:lock_key'),
  running: false,
  config: {
    enable: conf.get('connector_builtin_manager:enabled'),
    scheduleTime: conf.get('connector_builtin_manager:interval'),
  }
}

// TODO: this is not a connector built in manager, BUT a importCsvBuiltInConnector

const initConnectorBuiltInManager = () => {
  const config = manager.config;
  let scheduler: SetIntervalAsyncTimer<unknown[]>;
  let schedulerForPing: SetIntervalAsyncTimer<unknown[]>;
  const connector = BUILTIN_IMPORT_CONNECTORS[IMPORT_CONNECTOR_CSV];

  const callback = async (context: AuthContext, message: string) => {

    // TODO: can improv : MinIo stream, Work management, little bundle to have more than one expectation

    const messageParsed = JSON.parse(message);
    const workId = messageParsed.internal.work_id;
    const applicantId = messageParsed.internal.applicant_id;
    const fileId = messageParsed.event.file_id;
    const stream: SdkStream<IncomingMessage | Readable> | null | undefined = await downloadFile(context, fileId);

    const applicantUser = await resolveUserById(context, applicantId);

    const updateMessage = "Connector ready to process the operation";
    await updateReceivedTime(context, applicantUser, workId, updateMessage);
    // Stream file
    // Package of 100
    // Reporting expectation of bundle elements (100)
    // Push To Sync with type: 'bundle' with base64 bundle

    if (stream) {
      for await (const chunk of stream) { // ça stream pas du tout ça, peut être que si enfaite tout dépend de la taille
        const buffer = chunk.toString();
        const bundleBuilder = await bundleProcess(buffer, csvMapperMockSimpleEntity, ';');
        const bundle = bundleBuilder.build();
        // const bundleSize = bundle.objects.length;
        await updateExpectationsNumber(context, applicantUser, workId, 1);
        // Push To Sync with type: 'bundle' with base64 bundle
        const content = Buffer.from(JSON.stringify(bundle), 'utf-8').toString('base64');
        await pushToSync({ type: 'bundle', update: true, applicant_id: applicantId ?? OPENCTI_SYSTEM_UUID, work_id: workId, content })
      }
    }

    await updateProcessedTime(context, applicantUser, workId, " generated bundle(s) for worker import");
  }

  const handler = async (context: AuthContext) => {
    let lock;
    try {
      // Lock the manager
      lock = await lockResource([manager.lockKey], { retryCount: 0 });
      manager.running = true;

      // TODO: Check RabbitMQ queue exists

      await consumeQueue(context, connector.id, callback);

      // TODO: finish work

      // Execute handler
      console.log('Je suis dans le handler du manager connector built in');

      // Stream file
      // Parse
      // Send bundle chunk to Worker
    } catch (e: any) {
      if (e.name === TYPE_LOCK_ERROR) {
        logApp.debug(`[OPENCTI-MODULE] ${manager.name} manager already started by another API`);
      } else {
        logApp.error(`[OPENCTI-MODULE] ${manager.name} manager failed to start`, { error: e });
      }
    } finally {
      manager.running = false;
      logApp.debug(`[OPENCTI-MODULE] ${manager.name} manager done`);
      if (lock) await lock.unlock();
    }
  }

  return {
    start: async () => {
      logApp.info(`[OPENCTI-MODULE] Starting ${manager.name} manager`);

      // Register connector
      const context = executionContext(manager.id.toLowerCase());
      const connectorData = {
        id: connector.id,
        name: connector.name,
        type: connector.connector_type,
        scope: connector.connector_scope,
        auto: connector.auto,
        built_in: true,
      }
      await registerConnector(context, SYSTEM_USER, connectorData);

      scheduler = setIntervalAsync(async () => {
        await handler(context);
      }, config.scheduleTime);
      schedulerForPing = setIntervalAsync(async () => {
        await pingConnector(context, SYSTEM_USER, connector.id); // TODO: handle state management
      }, 60000);
    },
    status: () => {
      return {
        id: manager.id,
        enable: config.enable ?? false,
        running: manager.running,
      };
    },
    shutdown: async () => {
      logApp.info(`[OPENCTI-MODULE] Stopping ${manager.name} manager`);

      // Unregister connector
      await unregisterConnector(connector.id);

      if (scheduler) {
        return clearIntervalAsync(scheduler);
      }
      if (schedulerForPing) {
        return clearIntervalAsync(schedulerForPing);
      }
      return true;
    },
  };
};

const connectorBuiltInManager = initConnectorBuiltInManager();

export default connectorBuiltInManager;
