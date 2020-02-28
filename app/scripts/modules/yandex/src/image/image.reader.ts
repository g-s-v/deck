import { IPromise } from 'angular';

import { API, IImage } from '@spinnaker/core';

export interface IYandexImage extends IImage {
  imageId: string;
  imageName: string;
}

export class YandexImageReader {
  public static findImages(params: { account?: string; provider?: string; q?: string }): IPromise<IYandexImage[]> {
    return API.one('images/find')
      .withParams(params)
      .get()
      .catch(() => [] as IYandexImage[]);
  }

  public static getImage(/*amiName: string, region: string, credentials: string*/): IPromise<IYandexImage> {
    // Yandex images are not regional so we don't need to retrieve ids scoped to regions.
    return null;
  }
}
