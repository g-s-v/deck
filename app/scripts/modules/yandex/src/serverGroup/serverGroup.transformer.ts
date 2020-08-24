import { IPromise } from 'angular';

import { IServerGroup } from 'core/domain';
import { YandexDeployConfiguration } from 'yandex/domain/configure/YandexDeployConfiguration';
import _ from 'lodash';

export class YandexServerGroupTransformer {
  public static $inject = ['$q'];

  public constructor(private $q: ng.IQService) {}

  public normalizeServerGroup(serverGroup: IServerGroup): IPromise<IServerGroup> {
    return this.$q.resolve(serverGroup);
  }

  public convertServerGroupCommandToDeployConfiguration(base: any): YandexDeployConfiguration {
    // return new YandexDeployConfiguration(base);
    const command = _.defaults({ viewState: [] }, base);
    if (base.viewState.mode !== 'clone') {
      delete command.source;
    }
    command.cloudProvider = 'yandex';
    command.provider = 'yandex';
    command.account = command.credentials;
    command.availabilityZones = {};

    // We took this approach to avoid a breaking change to existing pipelines.
    delete command.viewState;
    delete command.backingData;
    delete command.selectedProvider;
    delete command.providerType;

    return command;
  }
}
