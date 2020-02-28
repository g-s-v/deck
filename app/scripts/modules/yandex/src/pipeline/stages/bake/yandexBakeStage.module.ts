import { BakeExecutionLabel, ExecutionDetailsTasks, Registry } from '@spinnaker/core';
import { YandexBakeStageConfig } from './YandexBakeStageConfig';
import { YandexBakeDetailsTab } from './YandexBakeDetailsTab';

Registry.pipeline.registerStage({
  provides: 'bake',
  cloudProvider: 'yandex',
  label: 'Bake',
  description: 'Bakes an image',
  key: 'bake',
  component: YandexBakeStageConfig,
  producesArtifacts: true,
  supportsCustomTimeout: true,
  executionDetailsSections: [YandexBakeDetailsTab, ExecutionDetailsTasks],
  executionLabelComponent: BakeExecutionLabel,
  extraLabelLines: stage => {
    return stage.masterStage.context.allPreviouslyBaked || stage.masterStage.context.somePreviouslyBaked ? 1 : 0;
  },
  restartable: true,
});
