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

import { IWizardPageComponent, ValidationMessage } from '@spinnaker/core';

import { FormikProps } from 'formik';
import { IYandexLBListener, IYandexLoadBalancerUpsertCommand } from 'yandex/domain/IYandexLoadBalancer';

export interface IListenersProps {
  formik: FormikProps<IYandexLoadBalancerUpsertCommand>;
}

export class Listeners extends React.Component<IListenersProps>
  implements IWizardPageComponent<IYandexLoadBalancerUpsertCommand> {
  public protocols = ['TCP', 'UDP'];
  public ipversions = ['IPV4', 'IPV6'];

  public validate(_: IYandexLoadBalancerUpsertCommand) {
    const errors = {} as any;
    return errors;
  }

  private updateListeners(): void {
    this.props.formik.setFieldValue('listeners', this.props.formik.values.listeners);
  }

  private listenerProtocolChanged(listener: IYandexLBListener, newProtocol: string): void {
    listener.protocol = newProtocol;
    this.updateListeners();
  }

  private listenerPortChanged(listener: IYandexLBListener, newPort: string): void {
    listener.port = Number.parseInt(newPort, 10);
    this.updateListeners();
  }

  private listenerTargetPortChanged(listener: IYandexLBListener, newPort: string): void {
    listener.targetPort = Number.parseInt(newPort, 10);
    this.updateListeners();
  }

  private listenerNameChanged(listener: IYandexLBListener, newName: string): void {
    listener.name = newName;
    this.updateListeners();
  }

  private listenerIpVersionChanged(listener: IYandexLBListener, newVersion: string): void {
    listener.ipVersion = newVersion;
    this.updateListeners();
  }

  private subnetIdChanged(listener: IYandexLBListener, newSubnetId: string): void {
    listener.subnetId = newSubnetId;
    this.updateListeners();
  }

  private removeListener(index: number): void {
    this.props.formik.values.listeners.splice(index, 1);
    this.updateListeners();
  }

  private addListener = (): void => {
    this.props.formik.values.listeners.push({
      protocol: 'TCP',
      port: 80,
      targetPort: 80,
      name: 'http',
      ipVersion: 'IPV4',
      address: '',
      subnetId: '',
    });
    this.updateListeners();
  };

  public render() {
    const { errors, values } = this.props.formik;
    return (
      <div className="container-fluid form-horizontal">
        <div className="form-group">
          <div className="col-md-12">
            {values.listeners.map((listener, index) => (
              <div key={index} className="wizard-pod">
                <div className="wizard-pod-row header">
                  <span className="wizard-pod-content">
                    <label>Protocol</label>
                    <select
                      className="form-control input-sm inline-number"
                      style={{ width: '80px' }}
                      value={listener.protocol}
                      onChange={event => this.listenerProtocolChanged(listener, event.target.value)}
                    >
                      {this.protocols.map(p => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </span>
                </div>
                <div className="wizard-pod-row header">
                  <span className="wizard-pod-content">
                    <label>Ip version</label>
                    <select
                      className="form-control input-sm inline-number"
                      style={{ width: '80px' }}
                      value={listener.ipVersion}
                      onChange={event => this.listenerIpVersionChanged(listener, event.target.value)}
                    >
                      {this.ipversions.map(p => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </span>
                </div>
                <div className="wizard-pod-row header">
                  <span className="wizard-pod-content">
                    <label>Name</label>
                    <input
                      className="form-control input-sm inline-number"
                      style={{ width: '80px' }}
                      value={listener.name}
                      onChange={event => this.listenerNameChanged(listener, event.target.value)}
                    />
                  </span>
                </div>
                <div className="wizard-pod-row header">
                  <span className="wizard-pod-content">
                    <label>Port</label>
                    <input
                      className="form-control input-sm inline-number"
                      type="text"
                      min={0}
                      value={listener.port || ''}
                      onChange={event => this.listenerPortChanged(listener, event.target.value)}
                      style={{ width: '80px' }}
                      required={true}
                    />
                  </span>
                </div>
                <div className="wizard-pod-row header">
                  <span className="wizard-pod-content">
                    <label>Target Port</label>
                    <input
                      className="form-control input-sm inline-number"
                      type="text"
                      min={0}
                      value={listener.targetPort || ''}
                      onChange={event => this.listenerTargetPortChanged(listener, event.target.value)}
                      style={{ width: '80px' }}
                      required={true}
                    />
                  </span>
                </div>
                {values.lbType == 'INTERNAL' && (
                  <div className="wizard-pod-row header">
                    <span className="wizard-pod-content">
                      <label>Subnet</label>
                      <input
                        className="form-control input-sm inline-number"
                        type="text"
                        min={0}
                        value={listener.subnetId || ''}
                        onChange={event => this.subnetIdChanged(listener, event.target.value)}
                        style={{ width: '80px' }}
                        required={true}
                      />
                    </span>
                  </div>
                )}
                <div className="wizard-pod-row header">
                  <div>
                    <a className="sm-label clickable" onClick={() => this.removeListener(index)}>
                      <span className="glyphicon glyphicon-trash" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {errors.listeners && (
              <div className="wizard-pod-row-errors">
                <ValidationMessage type="error" message={errors.listeners} />
              </div>
            )}
            <table className="table table-condensed packed">
              <tbody>
                <tr>
                  <td>
                    <button type="button" className="add-new col-md-12" onClick={this.addListener}>
                      <span>
                        <span className="glyphicon glyphicon-plus-sign" /> Add new listener
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
