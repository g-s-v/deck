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
import { UISref } from '@uirouter/react';
import { UIRouterContext } from '@uirouter/react-hybrid';

import {
  Application,
  InstanceReader,
  InstanceWriter,
  RecentHistoryService,
  Spinner,
  ILoadBalancer,
} from '@spinnaker/core';

import { flattenDeep } from 'lodash';
import { IYandexInstance } from 'yandex/domain';
import { YandexInstanceDetailsSection } from './sections';

interface InstanceFromStateParams {
  instanceId: string;
}

interface InstanceManager {
  account: string;
  region: string;
  category: string; // e.g., serverGroup, loadBalancer.
  name: string; // Parent resource name, not instance name.
  instances: IYandexInstance[];
}

interface IYandexInstanceDetailsState {
  instance?: IYandexInstance;
  instanceIdNotFound: string;
  loading: boolean;
}

interface IYandexInstanceDetailsProps {
  app: Application;
  instance: InstanceFromStateParams;
  instanceWriter: InstanceWriter;
  loading: boolean;
}

@UIRouterContext
export class YandexInstanceDetails extends React.Component<IYandexInstanceDetailsProps, IYandexInstanceDetailsState> {
  constructor(props: IYandexInstanceDetailsProps) {
    super(props);

    this.state = {
      loading: true,
      instanceIdNotFound: props.instance.instanceId,
    };
  }

  public componentDidMount(): void {
    this.props.app.ready().then(() => this.retrieveInstance(this.props.instance));
  }

  private retrieveInstance(instanceFromParams: InstanceFromStateParams): void {
    const instanceLocatorPredicate = (dataSource: InstanceManager) => {
      return dataSource.instances.some(possibleMatch => possibleMatch.id === instanceFromParams.instanceId);
    };

    const dataSources: InstanceManager[] = flattenDeep([
      this.props.app.getDataSource('serverGroups').data,
      this.props.app.getDataSource('loadBalancers').data,
      this.props.app
        .getDataSource('loadBalancers')
        .data.map((loadBalancer: ILoadBalancer) => loadBalancer.serverGroups),
    ]);

    const instanceManager = dataSources.find(instanceLocatorPredicate);

    if (instanceManager) {
      const recentHistoryExtraData: { [key: string]: string } = {
        region: instanceManager.region,
        account: instanceManager.account,
      };
      if (instanceManager.category === 'serverGroup') {
        recentHistoryExtraData.serverGroup = instanceManager.name;
      }
      RecentHistoryService.addExtraDataToLatest('instances', recentHistoryExtraData);
      InstanceReader.getInstanceDetails(instanceManager.account, instanceManager.region, instanceFromParams.instanceId)
        .then((instanceDetails: IYandexInstance) => {
          instanceDetails.account = instanceManager.account;
          instanceDetails.region = instanceManager.region;
          return instanceDetails;
        })
        .then(instance => {
          this.setState({
            instance,
            loading: false,
          });
        });
    }
  }

  public render(): JSX.Element {
    const { instance, instanceIdNotFound, loading } = this.state;
    const CloseButton = (
      <div className="close-button">
        <UISref to="^">
          <span className="glyphicon glyphicon-remove" />
        </UISref>
      </div>
    );
    const loadingHeader = () => (
      <div className="header">
        {CloseButton}
        <div className="horizontal center middle">
          <Spinner size="small" />
        </div>
      </div>
    );
    const notFoundHeader = () => (
      <div className="header">
        {CloseButton}
        <div className="header-text horizontal middle">
          <h3 className="horizontal middle space-between flex-1">{instanceIdNotFound}</h3>
        </div>
      </div>
    );
    const instanceHeader = () => (
      <div className="header">
        {CloseButton}
        <div className="header-text horizontal middle">
          <span className={'glyphicon glyphicon-hdd ' + instance.healthState} />
          <h3 className="horizontal middle space-between flex-1">{instance.name}</h3>
        </div>
      </div>
    );
    const notFoundContent = () => (
      <div className="content">
        <div className="content-section">
          <div className="content-body text-center">
            <h3>Instance not found.</h3>
          </div>
        </div>
      </div>
    );
    const instanceContent = () => (
      <div className="content">
        <YandexInstanceDetailsSection instance={instance} />
      </div>
    );
    return (
      <div className="details-panel">
        {loading && loadingHeader()}
        {!loading && instance && instanceHeader()}
        {!loading && instance && instanceContent()}
        {!loading && !instance && notFoundHeader()}
        {!loading && !instance && notFoundContent()}
      </div>
    );
  }
}
