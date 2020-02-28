import * as React from 'react';

import { CollapsibleSection } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexLabelsDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  public render(): JSX.Element {
    const { serverGroup } = this.props;
    return (
      <CollapsibleSection heading="Labels" defaultExpanded={true}>
        {!serverGroup.labels ||
          (Object.keys(serverGroup.labels).length === 0 && <div>No labels associated with this server group</div>)}
        {serverGroup.labels && (
          <dl>
            {Object.keys(serverGroup.labels).map(key => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{serverGroup.labels[key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </CollapsibleSection>
    );
  }
}
