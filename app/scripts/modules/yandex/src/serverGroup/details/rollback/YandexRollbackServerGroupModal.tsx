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
import { Modal, ModalFooter } from 'react-bootstrap';
import { Form, Formik } from 'formik';

import {
  Application,
  FormikFormField,
  IModalComponentProps,
  IServerGroupJob,
  ModalClose,
  NgReact,
  noop,
  ReactInjector,
  ReactModal,
  ReactSelectInput,
  SpinFormik,
  TaskMonitor,
  TaskReason,
} from '@spinnaker/core';

import { IYandexServerGroup } from 'yandex/domain';

export interface IYandexRollbackServerGroupModalProps extends IModalComponentProps {
  application: Application;
  serverGroup: IYandexServerGroup;
  previousServerGroup: IYandexServerGroup;
  allServerGroups: IYandexServerGroup[];
  disabledServerGroups: IYandexServerGroup[];
}

export interface IYandexRollbackServerGroupModalState {
  initialValues: ICloudFoundryRollbackServerGroupValues;
  taskMonitor: TaskMonitor;
}

export interface ICloudFoundryRollbackServerGroupValues {
  restoreServerGroupName: string;
  reason?: string;
}

export interface ICloudFoundryRollbackJob extends IServerGroupJob {
  rollbackType: string;
  rollbackContext: {
    rollbackServerGroupName: string;
    restoreServerGroupName: string;
    targetHealthyRollbackPercentage: number;
  };
}

export class YandexRollbackServerGroupModal extends React.Component<
  IYandexRollbackServerGroupModalProps,
  IYandexRollbackServerGroupModalState
> {
  public static defaultProps: Partial<IYandexRollbackServerGroupModalProps> = {
    closeModal: noop,
    dismissModal: noop,
  };

  private formikRef = React.createRef<Formik<ICloudFoundryRollbackServerGroupValues>>();

  public static show(props: IYandexRollbackServerGroupModalProps): Promise<ICloudFoundryRollbackJob> {
    const modalProps = {};
    return ReactModal.show(YandexRollbackServerGroupModal, props, modalProps);
  }

  constructor(props: IYandexRollbackServerGroupModalProps) {
    super(props);

    const { previousServerGroup, serverGroup } = props;
    const { name } = serverGroup;
    this.state = {
      initialValues: {
        restoreServerGroupName: previousServerGroup ? previousServerGroup.name : undefined,
      },
      taskMonitor: new TaskMonitor({
        application: props.application,
        title: 'Rollback ' + name,
        modalInstance: TaskMonitor.modalInstanceEmulation(() => this.props.dismissModal()),
        onTaskComplete: () => this.props.application.serverGroups.refresh(),
      }),
    };
  }

  private close = (args?: any): void => {
    this.props.dismissModal.apply(null, args);
  };

  private submit = (values: ICloudFoundryRollbackServerGroupValues): void => {
    const { reason, restoreServerGroupName } = values;
    const { serverGroup, application } = this.props;

    const command: ICloudFoundryRollbackJob = {
      rollbackType: 'EXPLICIT',
      rollbackContext: {
        rollbackServerGroupName: serverGroup.name,
        restoreServerGroupName,
        targetHealthyRollbackPercentage: 100,
      },
      reason,
    };

    this.state.taskMonitor.submit(() => {
      return ReactInjector.serverGroupWriter.rollbackServerGroup(serverGroup, application, command);
    });
  };

  public render() {
    const { allServerGroups, serverGroup } = this.props;
    const { initialValues } = this.state;
    const { TaskMonitorWrapper } = NgReact;
    return (
      <>
        <TaskMonitorWrapper monitor={this.state.taskMonitor} />
        <SpinFormik<ICloudFoundryRollbackServerGroupValues>
          ref={this.formikRef}
          initialValues={initialValues}
          onSubmit={this.submit}
          render={formik => {
            return (
              <>
                <ModalClose dismiss={this.close} />
                <Modal.Header>
                  <Modal.Title>Rollback {serverGroup.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form className="form-horizontal">
                    <div className="row" style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <div className="col-md-3 sm-label-right">Restore to</div>
                      <div className="col-md-7">
                        <FormikFormField
                          name="restoreServerGroupName"
                          fastField={true}
                          input={props => (
                            <ReactSelectInput
                              inputClassName="cloudfoundry-react-select"
                              {...props}
                              stringOptions={
                                allServerGroups && allServerGroups.map((sg: IYandexServerGroup) => sg.name)
                              }
                              clearable={false}
                            />
                          )}
                          required={true}
                        />
                      </div>
                    </div>
                    <TaskReason reason={formik.values.reason} onChange={val => formik.setFieldValue('reason', val)} />
                  </Form>
                  <div className="row">
                    <div className="col-sm-4 sm-label-right">Rollback Operations</div>
                  </div>
                  <div className="row">
                    <div className="col-sm-11 col-sm-offset-1">
                      <ol>
                        <li>
                          Enable <em>{formik.values.restoreServerGroupName || 'previous server group'}</em>
                        </li>
                        <li>Disable {serverGroup.name}</li>
                      </ol>
                      <p>
                        This rollback will affect server groups in {serverGroup.account} ({serverGroup.region}
                        ).
                      </p>
                    </div>
                  </div>
                </Modal.Body>
                <ModalFooter>
                  <button className="btn btn-default" onClick={this.close}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" onClick={() => this.submit(formik.values)}>
                    Submit
                  </button>
                </ModalFooter>
              </>
            );
          }}
        />
      </>
    );
  }
}
