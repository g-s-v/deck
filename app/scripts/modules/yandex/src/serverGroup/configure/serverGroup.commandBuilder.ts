import { Application, IPipeline, IStage } from '@spinnaker/core';
import { IPromise, IQService } from 'angular';
import { IYandexServerGroup } from 'yandex/domain';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { YandexProviderSettings } from 'yandex';
import _ from 'lodash';
import { YandexDeployConfiguration } from 'yandex/domain/configure/YandexDeployConfiguration';

export class YandexServerGroupCommandBuilder {
  public static $inject = ['$q'];

  constructor(private $q: IQService) {}

  public buildNewServerGroupCommand(app: Application, defaults: any): IPromise<IYandexServerGroupCommand> {
    return this.$q.when(YandexServerGroupCommandBuilder.buildNewServerGroupCommand(app, defaults));
  }

  public buildServerGroupCommandFromExisting(
    app: Application,
    serverGroup: IYandexServerGroup,
    mode = 'clone',
  ): IPromise<IYandexServerGroupCommand> {
    return this.$q.when(YandexServerGroupCommandBuilder.buildServerGroupCommandFromExisting(app, serverGroup, mode));
  }

  public buildNewServerGroupCommandForPipeline(
    stage: IStage,
    pipeline: IPipeline,
  ): IPromise<IYandexServerGroupCommand> {
    const command: IYandexServerGroupCommand = YandexServerGroupCommandBuilder.buildNewServerGroupCommand(
      { name: pipeline.application } as Application,
      { mode: 'editPipeline' },
    );
    command.imageSource = 'priorStage';
    command.viewState = {
      ...command.viewState,
      disableStrategySelection: false,
      pipeline,
      requiresTemplateSelection: true,
      stage,
    };

    return this.$q.when(command);
  }

  public buildServerGroupCommandFromPipeline(
    application: Application,
    conf: YandexDeployConfiguration,
    stage: IStage,
    pipeline: IPipeline,
  ): IPromise<IYandexServerGroupCommand> {
    const command = {
      application: application.name,
      selectedProvider: 'yandex',
      stack: conf.stack,
      freeFormDetails: conf.freeFormDetails,
      region: conf.region,
      groupSize: conf.groupSize,
      strategy: conf.strategy,
      credentials: conf.account,
      imageSource: 'priorStage',
      viewState: {
        pipeline,
        stage,
        mode: 'editPipeline',
        submitButtonLabel: 'Done',
        disableStrategySelection: false,
        disableImageSelection: true,
        showImageSourceSelector: true,
        // imageSourceText: 'priorStage',
      },
      serviceAccountId: conf.serviceAccountId,
      // capacity: _.cloneDeep(conf.capacity),
      deployPolicy: _.cloneDeep(conf.deployPolicy),
      labels: _.cloneDeep(conf.labels),
      instanceTemplate: _.cloneDeep(conf.instanceTemplate),
      healthCheckSpecs: _.cloneDeep(conf.healthCheckSpecs),
      loadBalancerIntegration: _.cloneDeep(conf.loadBalancerIntegration),
      autoScalePolicy: _.cloneDeep(conf.autoScalePolicy),
      zones: _.cloneDeep(conf.zones),
    } as IYandexServerGroupCommand;

    return this.$q.when(command);
  }

  public static buildServerGroupCommandFromExisting(
    app: Application,
    serverGroup: IYandexServerGroup,
    mode = 'clone',
  ): IYandexServerGroupCommand {
    return {
      source: {
        asgName: serverGroup.name,
      },
      application: app.name,
      selectedProvider: 'yandex',
      stack: serverGroup.stack,
      freeFormDetails: serverGroup.detail,
      region: 'ru-central1',
      groupSize: serverGroup.capacity.desired,
      strategy: '',
      credentials: app.defaultCredentials['yandex'] || YandexProviderSettings.defaults.account,
      viewState: {
        mode: mode || 'create',
        submitButtonLabel: this.extractSubmitButtonLabel(mode),
        disableStrategySelection: false,
      },
      serviceAccountId: serverGroup.serviceAccountId,
      capacity: _.cloneDeep(serverGroup.capacity),
      deployPolicy: _.cloneDeep(serverGroup.deployPolicy),
      labels: _.cloneDeep(serverGroup.labels),
      instanceTemplate: _.cloneDeep(serverGroup.instanceTemplate),
      healthCheckSpecs: _.cloneDeep(serverGroup.healthCheckSpecs),
      loadBalancerIntegration: _.cloneDeep(serverGroup.loadBalancerIntegration),
      autoScalePolicy: _.cloneDeep(serverGroup.autoScalePolicy),
      zones: _.cloneDeep(serverGroup.zones),
    } as IYandexServerGroupCommand;
  }

  private static buildNewServerGroupCommand(app: Application, defaults: any): IYandexServerGroupCommand {
    defaults = defaults || {};
    let submitButtonLabel;
    //todo: удалить свитч
    if (defaults.mode === 'createPipeline') {
      submitButtonLabel = 'Add';
    } else if (defaults.mode === 'editPipeline' || defaults.mode === 'editClonePipeline') {
      submitButtonLabel = 'Done';
    } else if (defaults.mode === 'clone') {
      submitButtonLabel = 'Clone';
    } else {
      submitButtonLabel = 'Create';
    }
    let credentials: string;
    if (app.defaultCredentials) {
      credentials = app.defaultCredentials['yandex'];
    } else {
      credentials = YandexProviderSettings.defaults.account;
    }
    return {
      application: app.name,
      selectedProvider: 'yandex',
      stack: '',
      freeFormDetails: '',
      region: 'ru-central1',
      groupSize: 1,
      strategy: '',
      credentials: credentials,
      viewState: {
        mode: defaults.mode || 'create',
        submitButtonLabel: submitButtonLabel,
        disableStrategySelection: true,
      },
      capacity: {
        min: 0,
        max: 0,
        desired: 1,
      },
      deployPolicy: {
        maxUnavailable: 1,
        startupDuration: 0,
      },
      labels: {},
      instanceTemplate: {
        platformId: 'standard-v2',
        labels: {},
        metadata: {},
        resourcesSpec: {
          cores: 1,
          memory: 2,
          coreFraction: 100,
        },
        bootDiskSpec: {
          mode: 'READ_WRITE',
          diskSpec: {
            typeId: 'network-hdd',
            size: 10,
          },
        },
        networkInterfaceSpecs: [
          {
            primaryV4AddressSpec: {},
          },
        ],
      },

      //todo:
      // imageSource: 'priorStage'
      // viewState:
      //   useSimpleCapacity: !serverGroup.autoscalingPolicy
      //   disableStrategySelection: true
      //   pipeline: pipeline
      //   requiresTemplateSelection: true
      //   stage: currentStage
      // stack: moniker.stack
      // freeFormDetails: moniker.detail

      //   const { viewState } = command;
      //     const baseCommand = this.props.command;
      //     viewState.disableImageSelection = true;
      //     viewState.showImageSourceSelector = true;
      //     viewState.disableStrategySelection = baseCommand.viewState.disableStrategySelection || false;
      //     viewState.expectedArtifacts = baseCommand.viewState.expectedArtifacts || [];
      //     viewState.imageId = null;
      //     viewState.readOnlyFields = baseCommand.viewState.readOnlyFields || {};
      //     viewState.submitButtonLabel = 'Add';
      //     viewState.hideClusterNamePreview = baseCommand.viewState.hideClusterNamePreview || false;
      //     viewState.templatingEnabled = true;
      //     viewState.imageSourceText = baseCommand.viewState.imageSourceText;
      //     Object.assign(command, baseCommand.viewState.overrides || {});
      //     Object.assign(baseCommand, command);
    } as IYandexServerGroupCommand;
  }

  private static extractSubmitButtonLabel(mode: string) {
    if (mode === 'createPipeline') {
      return 'Add';
    } else if (mode === 'editPipeline' || mode === 'editClonePipeline') {
      return 'Done';
    } else if (mode === 'clone') {
      return 'Clone';
    } else {
      return 'Create';
    }
  }
}
