import * as React from 'react';

import { CollapsibleSection, NgReact } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexLogsDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  public render(): JSX.Element {
    const { ViewScalingActivitiesLink } = NgReact;
    return (
      <CollapsibleSection heading="Logs">
        <ul>
          <li>
            <ViewScalingActivitiesLink serverGroup={this.props.serverGroup} />
          </li>
        </ul>
      </CollapsibleSection>
    );
  }
}
