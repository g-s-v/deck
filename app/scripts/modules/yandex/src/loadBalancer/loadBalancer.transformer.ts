/*
 * Copyright 2020 Netflix, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { camelCase, chain, has } from 'lodash';

import { Application, IInstance, IInstanceCounts, ILoadBalancer, IServerGroup } from '@spinnaker/core';
import { IYandexLoadBalancer, IYandexLoadBalancerUpsertCommand } from 'yandex/domain/IYandexLoadBalancer';

export class YandexLoadBalancerTransformer {
  public static $inject = ['$q'];
  constructor(private $q: ng.IQService) {}

  public normalizeLoadBalancer(loadBalancer: ILoadBalancer): ng.IPromise<ILoadBalancer> {
    loadBalancer.provider = loadBalancer.type;
    loadBalancer.instanceCounts = this.buildInstanceCounts(loadBalancer.serverGroups);
    loadBalancer.instances = [];
    loadBalancer.serverGroups.forEach(serverGroup => {
      serverGroup.account = loadBalancer.account;
      serverGroup.region = loadBalancer.region;
      serverGroup.cloudProvider = loadBalancer.provider;

      if (serverGroup.detachedInstances) {
        //todo: у нас нет их?
        serverGroup.detachedInstances = (serverGroup.detachedInstances as any).map((id: string) => ({ id }));
      }
      serverGroup.instances = serverGroup.instances
        .concat(serverGroup.detachedInstances || [])
        .map((instance: any) => this.transformInstance(instance, loadBalancer));
    });

    const activeServerGroups = loadBalancer.serverGroups.filter(sg => !sg.isDisabled);
    loadBalancer.instances = chain(activeServerGroups)
      .map('instances')
      .flatten()
      .value() as IInstance[];
    return this.$q.resolve(loadBalancer);
  }

  public static constructNewLoadBalancerTemplate(application: Application): IYandexLoadBalancerUpsertCommand {
    return {
      name: application.name,
      region: 'ru-central1',
      cloudProvider: 'yandex',
      credentials: undefined,
      lbType: 'EXTERNAL',
      listeners: [],
      serverGroups: [],
    } as IYandexLoadBalancerUpsertCommand;
  }

  public static convertLoadBalancerToUpsertDescription(
    loadBalancer: IYandexLoadBalancer,
  ): IYandexLoadBalancerUpsertCommand {
    return {
      id: loadBalancer.id,
      name: loadBalancer.name,
      region: loadBalancer.region,
      cloudProvider: loadBalancer.cloudProvider,
      credentials: loadBalancer.account,
      lbType: loadBalancer.balancerType,
      detail: loadBalancer.detail,
      listeners: loadBalancer.listeners,
      serverGroups: loadBalancer.serverGroups,
    } as IYandexLoadBalancerUpsertCommand;
  }

  private buildInstanceCounts(serverGroups: IServerGroup[]): IInstanceCounts {
    const instanceCounts: IInstanceCounts = chain(serverGroups)
      .map('instances')
      .flatten()
      .reduce(
        (acc: IInstanceCounts, instance: any) => {
          if (has(instance, 'health.state')) {
            acc[camelCase(instance.health.state)]++;
          }
          return acc;
        },
        { up: 0, down: 0, outOfService: 0, succeeded: 0, failed: 0, starting: 0, unknown: 0 },
      )
      .value();

    instanceCounts.outOfService += chain(serverGroups)
      .map('detachedInstances')
      .flatten()
      .value().length;
    return instanceCounts;
  }

  private transformInstance(instance: any, loadBalancer: ILoadBalancer) {
    instance.provider = loadBalancer.type;
    instance.account = loadBalancer.account;
    instance.region = loadBalancer.region;
    instance.loadBalancers = [loadBalancer.name];
    const health = instance.health || {};
    instance.healthState = health.state ?? 'OutOfService';
    instance.health = [health];

    return instance as IInstance;
  }
}
