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

import { ExecutionDetailsTasks, IStage, Registry } from '@spinnaker/core';
import { YandexFindImageFromTagsStageConfig } from './YandexFindImageFromTagsStageConfig';
import { YandexFindImageFromTagsDetailsTab } from './YandexFindImageFromTagsDetailsTab';

Registry.pipeline.registerStage({
  key: 'findImageFromTags',
  provides: 'findImageFromTags',
  cloudProvider: 'yandex',
  component: YandexFindImageFromTagsStageConfig,
  executionDetailsSections: [YandexFindImageFromTagsDetailsTab, ExecutionDetailsTasks],
  accountExtractor: (stage: IStage) => [stage.context.credentials],
  configAccountExtractor: (stage: IStage) => [stage.credentials],
  validators: [
    {
      type: 'targetImpedance',
      message:
        'This pipeline will attempt to destroy a server group without deploying a new version into the same cluster.',
    },
    { type: 'requiredField', fieldName: 'packageName' },
    { type: 'requiredField', fieldName: 'tags' },
    { type: 'requiredField', fieldName: 'credentials', fieldLabel: 'account' },
  ],
});
