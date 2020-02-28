import { IPromise } from 'angular';

import { API } from '@spinnaker/core';

export interface IYandexServiceAccount {
  id: string;
  name: string;
}

export class YandexServiceAccountReader {
  public static getServiceAccounts(account: string): IPromise<IYandexServiceAccount[]> {
    return API.one('yandex', 'serviceAccounts', account)
      .get()
      .catch(() => [] as IYandexServiceAccount[]);
  }
}
