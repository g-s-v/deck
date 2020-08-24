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

import React from 'react';
import { cloneDeep } from 'lodash';
import { FormikErrors } from 'formik';

import {
  ILoadBalancerModalProps,
  LoadBalancerWriter,
  noop,
  ReactInjector,
  ReactModal,
  TaskMonitor,
  WizardModal,
  WizardPage,
} from '@spinnaker/core';

import { Listeners } from './Listeners';
import { LoadBalancerLocation } from './LoadBalancerLocation';

import './configure.less';
import { IYandexLoadBalancer, IYandexLoadBalancerUpsertCommand } from 'yandex/domain/IYandexLoadBalancer';
import { YandexLoadBalancerTransformer } from 'yandex/loadBalancer';

export interface IYandexLoadBalancerModalProps extends ILoadBalancerModalProps {
  loadBalancer: IYandexLoadBalancer;
}

export interface IYandexLoadBalancerModalState {
  isNew: boolean;
  loadBalancerCommand: IYandexLoadBalancerUpsertCommand;
  taskMonitor: TaskMonitor;
}

export class YandexLoadBalancerModal extends React.Component<
  IYandexLoadBalancerModalProps,
  IYandexLoadBalancerModalState
> {
  public static defaultProps: Partial<IYandexLoadBalancerModalProps> = {
    closeModal: noop,
    dismissModal: noop,
  };

  private _isUnmounted = false;
  private refreshUnsubscribe: () => void;

  public static show(props: IYandexLoadBalancerModalProps): Promise<IYandexLoadBalancerUpsertCommand> {
    const modalProps = { dialogClassName: 'wizard-modal modal-lg' };
    return ReactModal.show(YandexLoadBalancerModal, props, modalProps);
  }

  constructor(props: IYandexLoadBalancerModalProps) {
    super(props);

    const loadBalancerCommand = props.loadBalancer
      ? YandexLoadBalancerTransformer.convertLoadBalancerToUpsertDescription(props.loadBalancer)
      : YandexLoadBalancerTransformer.constructNewLoadBalancerTemplate(props.app);

    this.state = {
      isNew: !props.loadBalancer,
      loadBalancerCommand,
      taskMonitor: null,
    };
  }

  protected onApplicationRefresh(values: IYandexLoadBalancerUpsertCommand): void {
    if (this._isUnmounted) {
      return;
    }

    this.refreshUnsubscribe = undefined;
    this.props.dismissModal();
    this.setState({ taskMonitor: undefined });
    const newStateParams = {
      name: values.name,
      accountId: values.credentials,
      provider: 'yandex',
    };

    if (!ReactInjector.$state.includes('**.loadBalancerDetails')) {
      ReactInjector.$state.go('.loadBalancerDetails', newStateParams);
    } else {
      ReactInjector.$state.go('^.loadBalancerDetails', newStateParams);
    }
  }

  public componentWillUnmount(): void {
    this._isUnmounted = true;
    if (this.refreshUnsubscribe) {
      this.refreshUnsubscribe();
    }
  }

  private onTaskComplete(values: IYandexLoadBalancerUpsertCommand): void {
    this.props.app.loadBalancers.refresh();
    this.refreshUnsubscribe = this.props.app.loadBalancers.onNextRefresh(null, () => this.onApplicationRefresh(values));
  }

  private submit = (values: IYandexLoadBalancerUpsertCommand): void => {
    const { app, forPipelineConfig, closeModal } = this.props;
    const { isNew } = this.state;

    const descriptor = isNew ? 'Create' : 'Update';
    const loadBalancerCommandFormatted = cloneDeep(values);
    if (forPipelineConfig) {
      // don't submit to backend for creation. Just return the loadBalancerCommand object
      closeModal && closeModal(loadBalancerCommandFormatted);
    } else {
      const taskMonitor = new TaskMonitor({
        application: app,
        title: `${isNew ? 'Creating' : 'Updating'} your load balancer`,
        modalInstance: TaskMonitor.modalInstanceEmulation(() => this.props.dismissModal()),
        onTaskComplete: () => this.onTaskComplete(loadBalancerCommandFormatted),
      });

      taskMonitor.submit(() => {
        return LoadBalancerWriter.upsertLoadBalancer(loadBalancerCommandFormatted, app, descriptor);
      });

      this.setState({ taskMonitor });
    }
  };

  private validate = (): FormikErrors<IYandexLoadBalancer> => {
    const errors = {} as FormikErrors<IYandexLoadBalancer>;
    return errors;
  };

  public render(): React.ReactElement<IYandexLoadBalancerModalProps> {
    const { app, dismissModal, forPipelineConfig, loadBalancer } = this.props;
    const { isNew, loadBalancerCommand, taskMonitor } = this.state;

    let heading = forPipelineConfig ? 'Configure Network Load Balancer' : 'Create New Network Load Balancer';
    if (!isNew) {
      heading = `Edit ${loadBalancerCommand.name}: ${loadBalancerCommand.credentials}`;
    }

    const showLocationSection = isNew || forPipelineConfig;

    return (
      <WizardModal<IYandexLoadBalancerUpsertCommand>
        heading={heading}
        initialValues={loadBalancerCommand}
        taskMonitor={taskMonitor}
        dismissModal={dismissModal}
        closeModal={this.submit}
        submitButtonLabel={forPipelineConfig ? (isNew ? 'Add' : 'Done') : isNew ? 'Create' : 'Update'}
        validate={this.validate}
        render={({ formik, nextIdx, wizard }) => (
          <>
            {showLocationSection && (
              <WizardPage
                label="Location"
                wizard={wizard}
                order={nextIdx()}
                render={({ innerRef }) => (
                  <LoadBalancerLocation
                    app={app}
                    forPipelineConfig={forPipelineConfig}
                    formik={formik}
                    isNew={isNew}
                    loadBalancer={loadBalancer}
                    ref={innerRef}
                  />
                )}
              />
            )}

            <WizardPage
              label="Listeners"
              wizard={wizard}
              order={nextIdx()}
              render={({ innerRef }) => <Listeners ref={innerRef} formik={formik} />}
            />
          </>
        )}
      />
    );
  }
}
