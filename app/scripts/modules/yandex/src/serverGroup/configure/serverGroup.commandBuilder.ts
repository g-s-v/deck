import { Application, IPipeline, IStage } from '@spinnaker/core';
import { IPromise, IQService } from 'angular';
import { IYandexServerGroup } from 'yandex/domain';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { YandexProviderSettings } from 'yandex/yandex.settings';
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

  public static buildCloneServerGroupCommandFromPipeline(
    stage: IStage,
    pipeline: IPipeline,
  ): IYandexServerGroupCommand {
    const command = this.buildNewServerGroupCommand({ name: pipeline.application } as Application, {
      mode: 'editClonePipeline',
    });
    command.credentials = stage.credentials;
    command.capacity = stage.capacity;
    command.freeFormDetails = stage.freeFormDetails || command.freeFormDetails;
    command.region = stage.region;
    command.stack = stage.stack || command.stack;
    command.strategy = stage.strategy;
    command.source = stage.source;

    command.viewState = {
      ...command.viewState,
      pipeline,
      stage,
    };

    return command;
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
      targetSize: conf.targetSize,
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
      },
      serviceAccountId: conf.serviceAccountId,
      deployPolicy: _.cloneDeep(conf.deployPolicy),
      labels: _.cloneDeep(conf.labels),
      instanceTemplate: _.cloneDeep(conf.instanceTemplate),
      healthCheckSpecs: _.cloneDeep(conf.healthCheckSpecs),
      targetGroupSpec: _.cloneDeep(conf.targetGroupSpec),
      enableTraffic: _.cloneDeep(conf.enableTraffic),
      balancers: _.cloneDeep(conf.balancers),
      autoScalePolicy: _.cloneDeep(conf.autoScalePolicy),
      zones: _.cloneDeep(conf.zones),
      reason: conf.reason,
    } as IYandexServerGroupCommand;

    return this.$q.when(command);
  }

  public static buildServerGroupCommandFromExisting(
    app: Application,
    serverGroup: IYandexServerGroup,
    mode = 'clone',
  ): IYandexServerGroupCommand {
    let enableTraffic = false;
    if (
      serverGroup.loadBalancerIntegration != undefined &&
      serverGroup.loadBalancerIntegration.targetGroupId != undefined &&
      serverGroup.loadBalancerIntegration.targetGroupId != ''
    ) {
      enableTraffic = true;
    }
    return {
      source: {
        asgName: serverGroup.name,
      },
      application: app.name,
      selectedProvider: 'yandex',
      stack: serverGroup.stack,
      freeFormDetails: serverGroup.detail,
      region: 'ru-central1',
      targetSize: serverGroup.capacity.desired,
      strategy: '',
      credentials: app.defaultCredentials['yandex'] || YandexProviderSettings.defaults.account,
      viewState: {
        mode: mode || 'create',
        submitButtonLabel: this.extractSubmitButtonLabel(mode),
        disableStrategySelection: true,
      },
      serviceAccountId: serverGroup.serviceAccountId,
      capacity: _.cloneDeep(serverGroup.capacity),
      deployPolicy: _.cloneDeep(serverGroup.deployPolicy),
      labels: _.cloneDeep(serverGroup.labels),
      instanceTemplate: _.cloneDeep(serverGroup.instanceTemplate),
      healthCheckSpecs: _.cloneDeep(serverGroup.healthCheckSpecs),
      targetGroupSpec:
        serverGroup.loadBalancerIntegration != undefined
          ? _.cloneDeep(serverGroup.loadBalancerIntegration.targetGroupSpec)
          : undefined,
      balancers: _.cloneDeep(serverGroup.loadBalancersWithHealthChecks),
      enableTraffic: enableTraffic,
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
      targetSize: 1,
      enableTraffic: true,
      strategy: '',
      credentials: credentials,
      viewState: {
        mode: defaults.mode || 'create',
        submitButtonLabel: submitButtonLabel,
        disableStrategySelection: true,
      },
      deployPolicy: {
        maxUnavailable: 1,
        startupDuration: 0,
      },
      labels: {},
      healthCheckSpecs: [],
      instanceTemplate: {
        platformId: 'standard-v1',
        labels: {},
        metadata: {},
        resourcesSpec: {
          cores: 2,
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
