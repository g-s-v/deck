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

import { FormikProps } from 'formik';

import {
  Application,
  CheckboxInput,
  FormikFormField,
  IFormInputProps,
  ILoadBalancer,
  ReactSelectInput,
} from '@spinnaker/core';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { IHealthCheckSpec } from 'yandex/domain';
import * as React from 'react';
import { IYandexLoadBalancer } from 'yandex/domain/IYandexLoadBalancer';
import { HealthChecks } from '../healthcheck/HealthChecks';

export interface ILoadBalancerSettingsProps {
  application: Application;
  formik: FormikProps<IYandexServerGroupCommand>;
}

export interface ILoadBalancerSettingsState {
  allBalancers: IYandexLoadBalancer[];
}

export class LoadBalancer extends React.Component<ILoadBalancerSettingsProps, ILoadBalancerSettingsState> {
  constructor(props: ILoadBalancerSettingsProps) {
    super(props);

    const allBalancers = props.application
      .getDataSource('loadBalancers')
      .data.filter((lb: ILoadBalancer): lb is IYandexLoadBalancer => {
        return lb && !!(lb as IYandexLoadBalancer).id;
      });

    this.state = { allBalancers };
  }

  private removeLoadBalancer = (lbID: string) => {
    delete this.props.formik.values.balancers[lbID];
    this.forceUpdate();
  };

  private addLoadBalancer = (lbID: string) => {
    if (!this.props.formik.values.balancers) {
      this.props.formik.values.balancers = {};
    }
    this.props.formik.values.balancers[lbID] = [
      {
        type: 'HTTP',
        port: 80,
        path: '/ping',
        interval: 5,
        timeout: 4,
        unhealthyThreshold: 6,
        healthyThreshold: 2,
      } as IHealthCheckSpec,
    ];
    this.forceUpdate();
  };

  public render() {
    const { formik } = this.props;
    const { allBalancers } = this.state;

    return (
      <div className="form-group">
        <div className="col-md-11">
          <div className="sp-margin-m-bottom">
            <FormikFormField
              fastField={false}
              label="Traffic"
              name="enableTraffic"
              input={(inputProps: IFormInputProps) => (
                <CheckboxInput text={'Send client requests to new instances'} {...inputProps} />
              )}
            />
          </div>
          {formik.values.enableTraffic && (
            <table className="table table-condensed packed">
              <tbody>
                {formik.values.balancers &&
                  Object.keys(formik.values.balancers).map(key => (
                    <tr>
                      <td>
                        {allBalancers
                          .filter((b: IYandexLoadBalancer) => b.id == key)
                          .map((b: IYandexLoadBalancer) => b.name + ' (' + b.id + ')')}
                        {key}
                        {formik.values.balancers[key][0].port}
                        <a
                          className="btn btn-link sm-label"
                          style={{ marginTop: 0 }}
                          onClick={() => this.removeLoadBalancer(key)}
                        >
                          <span className="glyphicon glyphicon-trash" />
                        </a>
                        <HealthChecks fieldName={'balancers[' + key + ']'} formik={formik} />
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <span className="glyphicon glyphicon-plus-sign" /> Attach to load balancer
                    <ReactSelectInput
                      options={
                        allBalancers &&
                        allBalancers
                          .filter(
                            (b: IYandexLoadBalancer) => !formik.values.balancers || !formik.values.balancers[b.id],
                          )
                          .map((b: IYandexLoadBalancer) => ({
                            value: b.id,
                            label: b.name + ' (' + b.id + ')',
                          }))
                      }
                      onChange={event => this.addLoadBalancer(event.target.value)}
                    />
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    );
  }
}
