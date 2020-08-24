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

import { Observable, Subject } from 'rxjs';

import { first, isNil, uniq } from 'lodash';

import Select, { Creatable, Option } from 'react-select';

import { Application, AppListExtractor, IAccount, IMoniker, StageConfigField } from '@spinnaker/core';

export interface IAccountClusterSelectorProps {
  accounts: IAccount[];
  application: Application;
  clusterField?: string;
  component: any;
  componentName?: string;
  isSingleRegion?: boolean;
  onComponentUpdate?: (component: any) => void;
}

export interface IAccountClusterSelectorState {
  [k: string]: any;

  clusterField: string;
  clusters: string[];
  componentName: string;
}

export class AccountClusterSelector extends React.Component<
  IAccountClusterSelectorProps,
  IAccountClusterSelectorState
> {
  private destroy$ = new Subject();

  constructor(props: IAccountClusterSelectorProps) {
    super(props);
    const clusterField = props.clusterField || 'cluster';
    this.state = {
      clusterField: clusterField,
      clusters: [],
      componentName: props.componentName || '',
      [clusterField]: props.component[clusterField],
    };
  }

  public componentDidMount(): void {
    this.setClusterList(this.props.component.credentials);
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private setClusterList = (credentials: string): void => {
    const { application } = this.props;
    Observable.fromPromise(application.ready())
      .takeUntil(this.destroy$)
      .subscribe(() => {
        const clusterFilter = AppListExtractor.clusterFilterForCredentialsAndRegion(credentials, 'ru-central1');
        const clusters = AppListExtractor.getClusters([application], clusterFilter);

        const clusterField = this.props.component[this.state.clusterField];
        if (clusterField && !clusters.includes(clusterField)) {
          clusters.push(clusterField);
        }
        this.setState({ clusters });
      });
  };

  public onAccountUpdate = (option: Option<string>): void => {
    const credentials = option.value;
    this.setClusterList(credentials);
    this.props.onComponentUpdate &&
      this.props.onComponentUpdate({
        ...this.props.component,
        credentials,
        regions: ['ru-central1'],
        region: 'ru-central1',
        [this.state.clusterField]: undefined,
      });
  };

  public onClusterUpdate = (option: Option<string>): void => {
    const clusterName = option.value;
    const filterByCluster = AppListExtractor.monikerClusterNameFilter(clusterName);
    const clusterMoniker = first(uniq(AppListExtractor.getMonikers([this.props.application], filterByCluster)));
    let moniker: IMoniker;

    if (isNil(clusterMoniker)) {
      // remove the moniker from the stage if one doesn't exist.
      moniker = undefined;
    } else {
      // clusters don't contain sequences, so null it out.
      clusterMoniker.sequence = null;
      moniker = clusterMoniker;
    }

    if (option.className) {
      const clusters = this.state.clusters;
      clusters.push(clusterName);
      this.setState(clusters);
    }

    this.props.onComponentUpdate &&
      this.props.onComponentUpdate({
        ...this.props.component,
        regions: ['ru-central1'],
        region: 'ru-central1',
        [this.state.clusterField]: clusterName,
        moniker,
      });
  };

  public render() {
    const { accounts, component } = this.props;
    const { clusters, clusterField, componentName } = this.state;
    return (
      <>
        <StageConfigField label="Account">
          <Select
            name={componentName ? `${componentName}.credentials` : 'credentials'}
            options={
              accounts &&
              accounts.map((acc: IAccount) => ({
                label: acc.name,
                value: acc.name,
              }))
            }
            clearable={false}
            value={component.credentials}
            onChange={this.onAccountUpdate}
          />
        </StageConfigField>

        <StageConfigField label="Cluster" helpKey={'pipeline.config.findAmi.cluster'}>
          <Creatable
            name={componentName ? `${componentName}.${clusterField}` : `${clusterField}`}
            options={
              clusters &&
              clusters.map((c: string) => ({
                label: c,
                value: c,
              }))
            }
            clearable={false}
            value={component[clusterField]}
            onChange={this.onClusterUpdate}
          />
        </StageConfigField>
      </>
    );
  }
}
