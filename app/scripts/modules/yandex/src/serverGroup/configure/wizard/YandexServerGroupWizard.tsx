import { get } from 'lodash';

import {
  Application,
  IModalComponentProps,
  IPipeline,
  IStage,
  noop,
  ReactInjector,
  ReactModal,
  TaskMonitor,
  WizardModal,
  WizardPage,
} from '@spinnaker/core';

import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { YandexServerGroupBasicSettings } from 'yandex/serverGroup/configure/wizard/sections/basicSettings/BasicSettings.yandex';
import * as React from 'react';
import { ServerGroupTemplateSelection } from 'yandex/serverGroup/configure';
import { YandexServerGroupDeployPolicySettings } from './sections/configurationSettings/DeployPolicySettings.yandex';
import { YandexServerGroupInstanceTemplateSettings } from './sections/instanceTemplateSettings/InstanceTemplateSettings.yandex';
import { YandexServerGroupAdvancedSettings } from './sections/advancedSettings/AdvancedSettings.yandex';
import { Observable, Subject } from 'rxjs';
import { IYandexServiceAccount, YandexServiceAccountReader } from 'yandex/serviceAccount';
import { IYandexImage, YandexImageReader } from 'yandex/image';
import { HealthChecks } from './sections/healthcheck/HealthChecks';
import { LoadBalancer } from './sections/loadBalancer/LoadBalancer';

export interface IYandexCreateServerGroupProps extends IModalComponentProps {
  application: Application;
  command: IYandexServerGroupCommand;
  title: string;
}

export interface IYandexCreateServerGroupState {
  loading: boolean;
  pipeline: IPipeline;
  requiresTemplateSelection: boolean;
  stage?: IStage;
  taskMonitor: TaskMonitor;

  serviceAccountsLoading: boolean;
  serviceAccounts: IYandexServiceAccount[];

  imageLoading: boolean;
  allImages: IYandexImage[];
}

export class YandexServerGroupWizard extends React.Component<
  IYandexCreateServerGroupProps,
  IYandexCreateServerGroupState
> {
  public static defaultProps: Partial<IYandexCreateServerGroupProps> = {
    closeModal: noop,
    dismissModal: noop,
  };
  private destroy$ = new Subject();

  public static show(props: IYandexCreateServerGroupProps): Promise<IYandexServerGroupCommand> {
    const modalProps = { dialogClassName: 'wizard-modal modal-lg' };
    //todo: вернуть
    props.command.imageSource = 'priorStage';
    return ReactModal.show(YandexServerGroupWizard, props, modalProps);
  }

  constructor(props: IYandexCreateServerGroupProps) {
    super(props);
    const pipeline = get(props, 'command.viewState.pipeline', undefined);
    const stage = get(props, 'command.viewState.stage', undefined);

    this.state = {
      pipeline: pipeline,
      loading: false,
      requiresTemplateSelection: get(props, 'command.viewState.requiresTemplateSelection', false),
      stage,
      taskMonitor: null,
      serviceAccounts: null,
      serviceAccountsLoading: false,
      imageLoading: false,
      allImages: null,
    };
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private loadServiceAccounts = (credentials: string): void => {
    if (credentials) {
      this.setState({ serviceAccountsLoading: true });
      Observable.fromPromise(YandexServiceAccountReader.getServiceAccounts(credentials))
        .takeUntil(this.destroy$)
        .subscribe(accounts => {
          this.setState({
            serviceAccountsLoading: false,
            serviceAccounts: accounts,
          });
        });
    }
  };

  private loadImages = (credentials: string): void => {
    if (credentials) {
      this.setState({ imageLoading: true });
      const findImagesParams = {
        account: credentials,
        provider: 'yandex',
        q: '*',
      };
      Observable.fromPromise(YandexImageReader.findImages(findImagesParams))
        .takeUntil(this.destroy$)
        .subscribe(images => {
          this.setState({
            imageLoading: false,
            allImages: images as IYandexImage[],
          });
        });
    }
  };

  private accountChanged = (account: string): void => {
    this.loadServiceAccounts(account);
    this.loadImages(account);
  };

  private templateSelected = () => {
    this.setState({ requiresTemplateSelection: false });
    this.initialize();
  };

  private initialize = () => {
    this.setState({ loading: false });
  };

  private onTaskComplete = () => {
    this.props.application.serverGroups.refresh();
  };

  private submit = (command: IYandexServerGroupCommand): void => {
    command.selectedProvider = 'yandex';
    if (
      command.viewState.mode === 'createPipeline' ||
      command.viewState.mode === 'editPipeline' ||
      command.viewState.mode === 'editClonePipeline'
    ) {
      this.props.closeModal && this.props.closeModal(command);
    } else {
      const taskMonitor = new TaskMonitor({
        application: this.props.application,
        title: 'Creating your server group',
        modalInstance: TaskMonitor.modalInstanceEmulation(() => this.props.dismissModal()),
        onTaskComplete: this.onTaskComplete,
        onTaskRetry: () => {
          this.forceUpdate();
        },
      });
      this.setState({ taskMonitor });
      taskMonitor.submit(() => ReactInjector.serverGroupWriter.cloneServerGroup(command, this.props.application));
    }
  };

  public render(): React.ReactElement<YandexServerGroupWizard> {
    const {
      loading,
      requiresTemplateSelection,
      taskMonitor,
      serviceAccounts,
      serviceAccountsLoading,
      imageLoading,
      allImages,
    } = this.state;
    const { application, command, dismissModal, title } = this.props;

    if (requiresTemplateSelection) {
      return (
        <ServerGroupTemplateSelection
          app={application}
          command={command}
          onDismiss={dismissModal}
          onTemplateSelected={this.templateSelected}
        />
      );
    }

    return (
      <WizardModal<IYandexServerGroupCommand>
        heading={title}
        initialValues={command}
        loading={loading}
        taskMonitor={taskMonitor}
        dismissModal={dismissModal}
        closeModal={this.submit}
        submitButtonLabel={command.viewState.submitButtonLabel}
        render={({ formik, nextIdx, wizard }) => (
          <>
            <WizardPage
              label="Basic Settings"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => (
                <YandexServerGroupBasicSettings
                  ref={innerRef}
                  formik={formik}
                  app={application}
                  serviceAccounts={serviceAccounts}
                  serviceAccountsLoading={serviceAccountsLoading}
                  imageLoading={imageLoading}
                  allImages={allImages}
                  accountChanged={(account: string) => this.accountChanged(account)}
                  dismissModal={dismissModal}
                />
              )}
            />

            <WizardPage
              label="Deploy policy"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => <YandexServerGroupDeployPolicySettings ref={innerRef} formik={formik} />}
            />
            <WizardPage
              label="Instance template"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => <YandexServerGroupInstanceTemplateSettings ref={innerRef} formik={formik} />}
            />
            <WizardPage
              label="Autohealing policy"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => <HealthChecks ref={innerRef} fieldName={'healthCheckSpecs'} formik={formik} />}
            />
            <WizardPage
              label="Load Balancer"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => <LoadBalancer application={application} ref={innerRef} formik={formik} />}
            />
            <WizardPage
              label="Advanced settings"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => (
                <YandexServerGroupAdvancedSettings
                  ref={innerRef}
                  formik={formik}
                  serviceAccounts={serviceAccounts}
                  serviceAccountsLoading={serviceAccountsLoading}
                  showImageSourceSelector={command.viewState.showImageSourceSelector}
                  imageLoading={imageLoading}
                  allImages={allImages}
                />
              )}
            />
          </>
        )}
      />
    );
  }
}
