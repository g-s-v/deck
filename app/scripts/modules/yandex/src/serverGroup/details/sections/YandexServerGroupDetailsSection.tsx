import * as React from 'react';

import { AccountTag, CollapsibleSection, timestamp } from '@spinnaker/core';
import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexServerGroupDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  constructor(props: IYandexServerGroupDetailsSectionProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { serverGroup } = this.props;
    const igUrl =
      'https://console.cloud.yandex.ru/folders/' + serverGroup.folder + '/compute/instance-group/' + serverGroup.id;
    return (
      <CollapsibleSection heading="Server Group Information" defaultExpanded={true}>
        <dl className="dl-horizontal dl-flex">
          <dt>Id</dt>
          <dd>
            <a href={igUrl} target="_blank">
              {serverGroup.id}
            </a>
          </dd>

          <dt>Name</dt>
          <dd>{serverGroup.name}</dd>

          <dt>Description</dt>
          <dd>{serverGroup.description}</dd>

          <dt>Created</dt>
          <dd>{timestamp(serverGroup.createdTime)}</dd>

          <dt>Account</dt>
          <dd>
            <AccountTag account={serverGroup.account} />
          </dd>

          <dt>Zones</dt>
          <dd>
            <ul>
              {serverGroup.zones.map(zone => (
                <li key={zone}>{zone}</li>
              ))}
            </ul>
          </dd>
        </dl>
      </CollapsibleSection>
    );
  }
}
