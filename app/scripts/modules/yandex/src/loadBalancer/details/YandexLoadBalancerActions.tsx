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

import { Dropdown } from 'react-bootstrap';

import {
  Application,
  ConfirmationModalService,
  ILoadBalancerDeleteCommand,
  LoadBalancerWriter,
  ReactInjector,
} from '@spinnaker/core';
import { IYandexLoadBalancerModalProps, YandexLoadBalancerModal } from '../configure/YandexLoadBalancerModal';
import { IYandexLoadBalancer } from 'yandex/domain/IYandexLoadBalancer';

export interface IYandexLoadBalancerActionsProps {
  application: Application;
  loadBalancer: IYandexLoadBalancer;
}

export class YandexLoadBalancerActions extends React.Component<IYandexLoadBalancerActionsProps> {
  private deleteLoadBalancer = () => {
    const { application, loadBalancer } = this.props;
    const taskMonitor = {
      application: application,
      title: 'Deleting ' + loadBalancer.name,
      onTaskComplete() {
        if (ReactInjector.$state.includes('**.serverGroup', { instanceId: loadBalancer.name })) {
          ReactInjector.$state.go('^');
        }
      },
    };

    const submitMethod = () => {
      const loadBalancerDeleteCommand: ILoadBalancerDeleteCommand = {
        cloudProvider: loadBalancer.cloudProvider,
        credentials: loadBalancer.account,
        regions: [loadBalancer.region],
        loadBalancerName: loadBalancer.name,
      };
      return LoadBalancerWriter.deleteLoadBalancer(loadBalancerDeleteCommand, application);
    };

    ConfirmationModalService.confirm({
      header: 'Really delete ' + loadBalancer.name + '?',
      buttonText: 'Delete ' + loadBalancer.name,
      account: loadBalancer.account,
      taskMonitorConfig: taskMonitor,
      submitMethod,
    });
  };

  private editLoadBalancer = () => {
    const { application, loadBalancer } = this.props;
    YandexLoadBalancerModal.show({
      app: application,
      loadBalancer: loadBalancer,
    } as IYandexLoadBalancerModalProps);
  };

  public render(): JSX.Element {
    return (
      <div className="actions">
        <Dropdown className="dropdown" id="instance-actions-dropdown">
          <Dropdown.Toggle className="btn btn-sm btn-primary dropdown-toggle">Load Balancer Actions</Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu">
            <li>
              <a className="clickable" onClick={this.deleteLoadBalancer}>
                Delete Load Balancer
              </a>
            </li>
            <li>
              <a className="clickable" onClick={this.editLoadBalancer}>
                Edit Load Balancer
              </a>
            </li>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}
