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
import classNames from 'classnames';
import { isNil } from 'lodash';
import { Field, FormikErrors, FormikProps } from 'formik';
import { Observable, Subject } from 'rxjs';

import {
  AccountSelectInput,
  AccountService,
  Application,
  HelpField,
  IAccount,
  IMoniker,
  IWizardPageComponent,
  NameUtils,
  Spinner,
  ValidationMessage,
} from '@spinnaker/core';
import { IYandexLoadBalancer, IYandexLoadBalancerUpsertCommand } from 'yandex/domain/IYandexLoadBalancer';

export interface ISubnetOption {
  label: string;
  purpose: string;
  vpcIds: string[];
}

export interface ILoadBalancerLocationProps {
  app: Application;
  formik: FormikProps<IYandexLoadBalancerUpsertCommand>;
  forPipelineConfig?: boolean;
  isNew?: boolean;
  loadBalancer?: IYandexLoadBalancer;
}

export interface ILoadBalancerLocationState {
  accounts: IAccount[];
  existingLoadBalancerNames: string[];
  subnets: ISubnetOption[];
}

export class LoadBalancerLocation extends React.Component<ILoadBalancerLocationProps, ILoadBalancerLocationState>
  implements IWizardPageComponent<IYandexLoadBalancerUpsertCommand> {
  public state: ILoadBalancerLocationState = {
    accounts: undefined,
    existingLoadBalancerNames: [],
    subnets: [],
  };

  private props$ = new Subject<ILoadBalancerLocationProps>();
  private destroy$ = new Subject<void>();

  public validate(values: IYandexLoadBalancerUpsertCommand) {
    const errors = {} as FormikErrors<IYandexLoadBalancerUpsertCommand>;

    if (this.state.existingLoadBalancerNames.includes(values.name)) {
      errors.name = `There is already a load balancer in ${values.credentials}:${values.region} with that name.`;
    }

    if (values.name && values.name.length > 32) {
      errors.name = 'Load balancer names cannot exceed 32 characters in length';
    }

    if (values.stack && !values.stack.match(/^[a-zA-Z0-9]*$/)) {
      errors.stack = 'Stack can only contain letters and numbers.';
    }

    if (values.detail && !values.detail.match(/^[a-zA-Z0-9-]*$/)) {
      errors.detail = 'Detail can only contain letters, numbers, and dashes.';
    }

    return errors;
  }

  protected buildName(): void {
    const { values } = this.props.formik;
    if (isNil(values.moniker)) {
      const nameParts = NameUtils.parseLoadBalancerName(values.name);
      values.stack = nameParts.stack;
      values.detail = nameParts.freeFormDetails;
    } else {
      values.stack = values.moniker.stack;
      values.detail = values.moniker.detail;
    }
    delete values.name;
  }

  public componentDidMount(): void {
    this.setState({});
    if (this.props.loadBalancer && this.props.isNew) {
      this.buildName();
    }

    const formValues$ = this.props$.map(props => props.formik.values);
    const appName$ = this.props$.map(props => props.app.name).distinctUntilChanged();

    const form = {
      account$: formValues$.map(x => x.credentials).distinctUntilChanged(),
      subnetPurpose$: formValues$.map(x => x.subnetType).distinctUntilChanged(),
      stack$: formValues$.map(x => x.stack).distinctUntilChanged(),
      detail$: formValues$.map(x => x.detail).distinctUntilChanged(),
    };

    const allAccounts$ = Observable.fromPromise(AccountService.listAccounts('yandex')).shareReplay(1);

    const allLoadBalancers$ = this.props.app.getDataSource('loadBalancers').data$ as Observable<IYandexLoadBalancer[]>;
    const regionLoadBalancers$ = Observable.combineLatest(allLoadBalancers$, form.account$)
      .map(([allLoadBalancers, currentAccount]) => {
        return allLoadBalancers.filter(lb => lb.account === currentAccount).map(lb => lb.name);
      })
      .shareReplay(1);

    const moniker$ = Observable.combineLatest(appName$, form.stack$, form.detail$).map(([app, stack, detail]) => {
      return { app, stack, detail, cluster: NameUtils.getClusterName(app, stack, detail) } as IMoniker;
    });

    moniker$.takeUntil(this.destroy$).subscribe(moniker => {
      this.props.formik.setFieldValue('moniker', moniker);
      this.props.formik.setFieldValue('name', moniker.cluster);
    });

    Observable.combineLatest(allAccounts$, regionLoadBalancers$)
      .takeUntil(this.destroy$)
      .subscribe(([accounts, existingLoadBalancerNames]) => {
        return this.setState({ accounts, existingLoadBalancerNames });
      });
  }

  public componentDidUpdate() {
    this.props$.next(this.props);
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private internalFlagChanged = (event: React.ChangeEvent<any>): void => {
    if (event.target.checked) {
      this.props.formik.setFieldValue('lbType', 'INTERNAL');
    } else {
      this.props.formik.setFieldValue('lbType', 'EXTERNAL');
    }
  };

  private accountUpdated = (account: string): void => {
    this.props.formik.setFieldValue('credentials', account);
  };

  private stackChanged = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.props.formik.setFieldValue('stack', event.target.value);
  };

  private detailChanged = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.props.formik.setFieldValue('detail', event.target.value);
  };

  public render() {
    const { errors, values } = this.props.formik;
    const { accounts } = this.state;

    const className = classNames({
      'col-md-12': true,
      well: true,
      'alert-danger': !!errors.name,
      'alert-info': !errors.name,
    });

    return (
      <div className="container-fluid form-horizontal">
        {!accounts && (
          <div style={{ height: '200px' }}>
            <Spinner size="medium" />
          </div>
        )}
        {accounts && (
          <div className="modal-body">
            <div className="form-group">
              <div className={className}>
                <strong>Your load balancer will be named: </strong>
                <span>{values.name}</span>
                <HelpField id="aws.loadBalancer.name" />
                <Field type="text" style={{ display: 'none' }} className="form-control input-sm no-spel" name="name" />
                {errors.name && <ValidationMessage type="error" message={errors.name} />}
              </div>
            </div>
            <div className="form-group">
              <div className="col-md-3 sm-label-right">Account</div>
              <div className="col-md-7">
                <AccountSelectInput
                  value={values.credentials}
                  onChange={(evt: any) => this.accountUpdated(evt.target.value)}
                  accounts={accounts}
                  provider="yandex"
                />
              </div>
            </div>
            <div className="form-group">
              <div className="col-md-3 sm-label-right">
                Stack <HelpField id="aws.loadBalancer.stack" />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className={`form-control input-sm no-spel ${errors.stack ? 'invalid' : ''}`}
                  value={values.stack}
                  name="stack"
                  onChange={this.stackChanged}
                />
              </div>
              <div className="col-md-6 form-inline">
                <label className="sm-label-right">
                  <span>
                    Detail <HelpField id="aws.loadBalancer.detail" />{' '}
                  </span>
                </label>
                <input
                  type="text"
                  className={`form-control input-sm no-spel ${errors.detail ? 'invalid' : ''}`}
                  value={values.detail}
                  name="detail"
                  onChange={this.detailChanged}
                />
              </div>
              {errors.stack && (
                <div className="col-md-7 col-md-offset-3">
                  <ValidationMessage type="error" message={errors.stack} />
                </div>
              )}
              {errors.detail && (
                <div className="col-md-7 col-md-offset-3">
                  <ValidationMessage type="error" message={errors.detail} />
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="col-md-3 sm-label-right">
                <b>Internal</b> <HelpField id="aws.loadBalancer.internal" />
              </div>
              <div className="col-md-7 checkbox">
                <label>
                  <input type="checkbox" onChange={this.internalFlagChanged} />
                  Create an internal load balancer
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
