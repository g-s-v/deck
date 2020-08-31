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

import { AccountTag, CollapsibleSection } from '@spinnaker/core';
import { IYandexLoadBalancer } from 'yandex/domain/IYandexLoadBalancer';

export interface IYandexLoadBalancerDetailsSectionProps {
  loadBalancer: IYandexLoadBalancer;
}

export class YandexLoadBalancerDetailsSection extends React.Component<IYandexLoadBalancerDetailsSectionProps> {
  constructor(props: IYandexLoadBalancerDetailsSectionProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { loadBalancer } = this.props;
    return (
      <>
        <CollapsibleSection heading={loadBalancer.balancerType + ' Load Balancer Details'} defaultExpanded={true}>
          <dl className="dl-horizontal dl-narrow">
            <dt>In</dt>
            <dd>
              <AccountTag account={loadBalancer.account} />
            </dd>
            <dt>Name</dt>
            <dd>{loadBalancer.name}</dd>
            {loadBalancer.serverGroups && (
              <>
                <dt>Server Groups</dt>
                <dd>
                  <ul>
                    {loadBalancer.serverGroups.map((serverGroup, index) => {
                      return (
                        <li key={index}>
                          <UISref
                            to="^.serverGroup"
                            params={{
                              region: serverGroup.region,
                              accountId: serverGroup.account,
                              serverGroup: serverGroup.name,
                              provider: 'yandex',
                            }}
                          >
                            <a>{serverGroup.name}</a>
                          </UISref>
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        </CollapsibleSection>
        {loadBalancer.listeners && (
          <CollapsibleSection heading="Listeners" defaultExpanded={true}>
            <dl className="dl-horizontal dl-narrow">
              {loadBalancer.listeners.map((listener, index) => {
                return (
                  <div key={index}>
                    <dt>{listener.name + '(' + listener.protocol + '): '}</dt>
                    <dd>
                      <a href={'http://' + listener.address + ':' + listener.port}>
                        {listener.address + ':' + listener.port}
                      </a>{' '}
                      =&gt; {listener.targetPort}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CollapsibleSection>
        )}
      </>
    );
  }
}
