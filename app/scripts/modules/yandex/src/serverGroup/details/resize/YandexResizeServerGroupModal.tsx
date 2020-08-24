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
import { Form, Formik, FormikProps } from 'formik';

import {
  Application,
  FormikFormField,
  IModalComponentProps,
  IServerGroupJob,
  ModalClose,
  NgReact,
  noop,
  NumberInput,
  ReactInjector,
  ReactModal,
  SpinFormik,
  TaskMonitor,
  TaskReason,
} from '@spinnaker/core';
import { IYandexServerGroup } from 'yandex/domain';

export interface IYandexResizeServerGroupModalProps extends IModalComponentProps {
  application: Application;
  serverGroup: IYandexServerGroup;
}

export interface IYandexResizeServerGroupModalState {
  desired: number | string;
  reason?: string;
  taskMonitor: TaskMonitor;
}

export interface IYandexResizeServerGroupJob extends IServerGroupJob {
  reason?: string;
}

export class YandexResizeServerGroupModal extends React.Component<
  IYandexResizeServerGroupModalProps,
  IYandexResizeServerGroupModalState
> {
  public static defaultProps: Partial<IYandexResizeServerGroupModalProps> = {
    closeModal: noop,
    dismissModal: noop,
  };

  private formikRef = React.createRef<Formik<IYandexResizeServerGroupModalState>>();

  public static show(props: IYandexResizeServerGroupModalProps): Promise<IYandexResizeServerGroupJob> {
    const modalProps = {};
    return ReactModal.show(YandexResizeServerGroupModal, props, modalProps);
  }

  constructor(props: IYandexResizeServerGroupModalProps) {
    super(props);

    const { capacity } = props.serverGroup;
    const { desired } = capacity;
    this.state = {
      desired,
      taskMonitor: new TaskMonitor({
        application: props.application,
        title: 'Resizing your server group',
        modalInstance: TaskMonitor.modalInstanceEmulation(() => this.props.dismissModal()),
        onTaskComplete: () => this.props.application.serverGroups.refresh(),
      }),
    };
  }

  private close = (args?: any): void => {
    this.props.dismissModal.apply(null, args);
  };

  private submit = (resizeState: IYandexResizeServerGroupModalState): void => {
    const { serverGroup, application } = this.props;
    const { desired, reason } = resizeState;
    const capacity = {
      min: desired,
      max: desired,
      desired,
    };

    const command: IYandexResizeServerGroupJob = {
      capacity,
      reason,
      serverGroupName: serverGroup.name,
    };

    this.state.taskMonitor.submit(() => {
      return ReactInjector.serverGroupWriter.resizeServerGroup(serverGroup, application, command);
    });
  };

  private renderDesired(formik: FormikProps<IYandexResizeServerGroupModalState>): JSX.Element {
    const { serverGroup } = this.props;
    const { capacity } = serverGroup;
    return (
      <div>
        <div className="form-group">
          <div className="col-md-3 sm-label-right">Current size</div>
          <div className="col-md-4">
            <div className="horizontal middle">
              <input type="number" className="NumberInput form-control" value={capacity.desired} disabled={true} />
              <div className="sp-padding-xs-xaxis">instances</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="col-md-3 sm-label-right">Resize to</div>
          <div className="col-md-4">
            <div className="horizontal middle">
              <FormikFormField
                name="desired"
                input={props => <NumberInput {...props} min={0} />}
                touched={true}
                required={true}
                onChange={value => {
                  formik.setFieldValue('min', value);
                  formik.setFieldValue('max', value);
                }}
              />
              <div className="sp-padding-xs-xaxis">instances</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  public render() {
    const { serverGroup } = this.props;
    const { TaskMonitorWrapper } = NgReact;
    return (
      <>
        <TaskMonitorWrapper monitor={this.state.taskMonitor} />
        <SpinFormik<IYandexResizeServerGroupModalState>
          ref={this.formikRef}
          initialValues={this.state}
          onSubmit={this.submit}
          render={formik => {
            return (
              <>
                <ModalClose dismiss={this.close} />
                <Modal.Header>
                  <Modal.Title>Resize {serverGroup.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form className="form-horizontal">
                    {this.renderDesired(formik)}
                    <TaskReason reason={formik.values.reason} onChange={val => formik.setFieldValue('reason', val)} />
                  </Form>
                </Modal.Body>
                <ModalFooter>
                  <button className="btn btn-default" onClick={this.close}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={() => this.submit(formik.values)}
                    disabled={!formik.isValid}
                  >
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
