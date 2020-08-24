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

import { AccountTag, CollapsibleSection, timestamp } from '@spinnaker/core';
import { IYandexInstance } from 'yandex/domain';

export interface IYandexInstanceDetailsSectionProps {
  instance: IYandexInstance;
}

export class YandexInstanceDetailsSection extends React.Component<IYandexInstanceDetailsSectionProps> {
  constructor(props: IYandexInstanceDetailsSectionProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { instance } = this.props;
    return (
      <div>
        <CollapsibleSection heading="Instance Information" defaultExpanded={true}>
          <dl className="dl-horizontal dl-narrow">
            <dt>Launched</dt>
            <dd>{timestamp(instance.launchTime)}</dd>
            <dt>In</dt>
            <dd>
              <AccountTag account={instance.account} />
            </dd>
            <dt>Availability zone</dt>
            <dd>{instance.zone}</dd>
          </dl>
        </CollapsibleSection>
        <CollapsibleSection heading="Status" defaultExpanded={true}>
          <dl className="dl-horizontal dl-narrow">
            <dt>
              <span className={'glyphicon glyphicon-' + instance.healthState + '-triangle'} />
            </dt>
            <dd>{instance.healthState}</dd>
          </dl>
        </CollapsibleSection>
      </div>
    );
  }
}
