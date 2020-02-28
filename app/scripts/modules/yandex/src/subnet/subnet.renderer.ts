import { module } from 'angular';

import { IYandexServerGroup } from 'yandex/domain';

export class YandexSubnetRenderer {
  public render(serverGroup: IYandexServerGroup): string {
    try {
      return serverGroup.instanceTemplate.networkInterfaceSpecs.map(value => value.subnetIds.join(', ')).join('; ');
    } catch (e) {
      return '';
    }
  }
}

export const SUBNET_RENDERER = 'spinnaker.yandex.subnet.renderer';
module(SUBNET_RENDERER, []).service('yandexSubnetRenderer', YandexSubnetRenderer);
