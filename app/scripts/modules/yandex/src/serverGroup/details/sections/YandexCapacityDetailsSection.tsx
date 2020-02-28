import * as React from 'react';

import { CapacityDetailsSection, CollapsibleSection } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexCapacityDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  public render(): JSX.Element {
    const { serverGroup } = this.props;

    return (
      <CollapsibleSection heading="Capacity" defaultExpanded={true}>
        <CapacityDetailsSection current={serverGroup.instances.length} capacity={serverGroup.capacity} />
      </CollapsibleSection>
    );
  }
}
