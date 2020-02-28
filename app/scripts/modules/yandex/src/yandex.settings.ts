import { IProviderSettings, SETTINGS } from '@spinnaker/core';

export interface IYandexProviderSettings extends IProviderSettings {
  defaults: {
    account?: string;
  };
}

export const YandexProviderSettings: IYandexProviderSettings = (SETTINGS.providers
  .yandex as IYandexProviderSettings) || { defaults: {} };
if (YandexProviderSettings) {
  YandexProviderSettings.resetToOriginal = SETTINGS.resetProvider('yandex');
}
