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

import { IController, IComponentOptions, module } from 'angular';

export interface IBaseOsOption {
  id: string;
  shortDescription?: string;
  detailedDescription: string;
  isImageFamily?: boolean;
  displayName?: string;
}

export class BakeStageChooseOSController implements IController {
  public model: any;
  public baseOsOptions: IBaseOsOption[];
  public onChange: () => any;

  public showRadioButtons = false;

  public $onChanges(): void {
    this.showRadioButtons = this.baseOsOptions && this.baseOsOptions.length <= 2;
  }

  public getBaseOsDescription(baseOsOption: IBaseOsOption): string {
    const baseOsName = baseOsOption?.displayName || baseOsOption?.id || '';
    if (baseOsOption?.shortDescription) {
      return `${baseOsName} (${baseOsOption.shortDescription})`;
    }
    return baseOsName;
  }
  public getBaseOsDetailedDescription(baseOsOption: IBaseOsOption): string {
    return baseOsOption.detailedDescription + (baseOsOption.isImageFamily ? ' (family)' : '');
  }
}

export const bakeStageChooseOsComponent: IComponentOptions = {
  bindings: {
    baseOsOptions: '<',
    model: '=',
    onChange: '=',
  },
  controller: BakeStageChooseOSController,
  templateUrl: require('./bakeStageChooseOs.component.html'),
};

export const PIPELINE_BAKE_STAGE_CHOOSE_OS = 'spinnaker.core.pipeline.bake.chooseOS.component';
module(PIPELINE_BAKE_STAGE_CHOOSE_OS, []).component('bakeStageChooseOs', bakeStageChooseOsComponent);
