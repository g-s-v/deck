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

import { YandexCloneServerGroupStageConfig } from './YandexCloneServerGroupStageConfig';
import { IStage, Registry } from '@spinnaker/core';

Registry.pipeline.registerStage({
  accountExtractor: (stage: IStage) => [stage.context.credentials],
  cloudProvider: 'yandex',
  component: YandexCloneServerGroupStageConfig,
  configAccountExtractor: (stage: IStage) => [stage.credentials],
  key: 'cloneServerGroup',
  provides: 'cloneServerGroup',
  validators: [
    { type: 'requiredField', fieldName: 'targetCluster', fieldLabel: 'cluster' },
    { type: 'requiredField', fieldName: 'target' },
    { type: 'requiredField', fieldName: 'credentials', fieldLabel: 'account' },
  ],
});
