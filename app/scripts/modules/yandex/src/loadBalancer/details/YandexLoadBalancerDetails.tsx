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

import { Application, LoadBalancerWriter, Spinner } from '@spinnaker/core';
import { IYandexLoadBalancer } from 'yandex/domain/IYandexLoadBalancer';
import { YandexLoadBalancerDetailsSection, YandexLoadBalancerStatusSection } from './sections';
import { YandexLoadBalancerActions } from './YandexLoadBalancerActions';

interface ILoadBalancer {
  name: string;
  accountId: string;
}

interface IYandexLoadBalancerDetailsState {
  loadBalancer: IYandexLoadBalancer;
  loadBalancerNotFound?: string;
  loading: boolean;
  refreshListenerUnsubscribe: () => void;
}

export interface IYandexLoadBalancerDetailsProps {
  app: Application;
  loadBalancer: ILoadBalancer;
  loadBalancerWriter: LoadBalancerWriter;
}

@UIRouterContext
export class YandexLoadBalancerDetails extends React.Component<
  IYandexLoadBalancerDetailsProps,
  IYandexLoadBalancerDetailsState
> {
  constructor(props: IYandexLoadBalancerDetailsProps) {
    super(props);
    this.state = {
      loading: true,
      loadBalancer: undefined,
      refreshListenerUnsubscribe: () => {},
    };

    props.app
      .getDataSource('loadBalancers')
      .ready()
      .then(() => this.extractLoadBalancer());
  }

  public componentWillUnmount(): void {
    this.state.refreshListenerUnsubscribe();
  }

  private extractLoadBalancer(): void {
    const { name } = this.props.loadBalancer;
    const loadBalancer: IYandexLoadBalancer = this.props.app
      .getDataSource('loadBalancers')
      .data.find((test: IYandexLoadBalancer) => {
        return test.name === name && test.account === this.props.loadBalancer.accountId;
      });

    this.setState({
      loading: false,
      loadBalancer,
    });

    this.state.refreshListenerUnsubscribe();

    if (loadBalancer) {
      this.setState({
        refreshListenerUnsubscribe: this.props.app
          .getDataSource('loadBalancers')
          .onRefresh(null, () => this.extractLoadBalancer()),
      });
    } else {
      this.setState({
        refreshListenerUnsubscribe: () => {},
      });
    }
  }

  public render(): JSX.Element {
    const { app } = this.props;
    const { loadBalancer, loadBalancerNotFound, loading } = this.state;

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
          <h3 className="horizontal middle space-between flex-1">{loadBalancerNotFound}</h3>
        </div>
      </div>
    );
    const loadBalancerHeader = () => (
      <div className="header">
        {CloseButton}
        <div className="header-text horizontal middle">
          <i className="fa icon-sitemap" />
          <h3 className="horizontal middle space-between flex-1">{loadBalancer.name}</h3>
        </div>
        <YandexLoadBalancerActions application={app} loadBalancer={loadBalancer} />
      </div>
    );
    const notFoundContent = () => (
      <div className="content">
        <div className="content-section">
          <div className="content-body text-center">
            <h3>Load balancer not found.</h3>
          </div>
        </div>
      </div>
    );
    const loadBalancerContent = () => (
      <div className="content">
        <YandexLoadBalancerDetailsSection loadBalancer={loadBalancer} />
        <YandexLoadBalancerStatusSection loadBalancer={loadBalancer} />
      </div>
    );
    return (
      <div className="details-panel">
        {loading && loadingHeader()}
        {!loading && !!loadBalancer && loadBalancerHeader()}
        {!loading && !!loadBalancer && loadBalancerContent()}
        {!loading && !loadBalancer && notFoundHeader()}
        {!loading && !loadBalancer && notFoundContent()}
      </div>
    );
  }
}
