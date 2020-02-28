import * as React from 'react';

import { CollapsibleSection, HealthCounts } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexHealthDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  public render(): JSX.Element {
    const { serverGroup } = this.props;

    if (serverGroup.instanceCounts.total === 0) {
      return null;
    }
    return (
      <CollapsibleSection heading="Health" defaultExpanded={true}>
        <dl className="dl-horizontal dl-flex">
          <dt>Instances</dt>
          <dd>
            <HealthCounts container={serverGroup.instanceCounts} className="pull-left" />
          </dd>
          {serverGroup.healthCheckSpecs && (
            <>
              <h4>Healthchecks Specification</h4>
              {serverGroup.healthCheckSpecs.map((spec, index) => (
                <div key={index}>
                  {index > 0 && <hr />}
                  <dt>Type</dt>
                  <dd>{spec.type}</dd>
                  <dt>Port</dt>
                  <dd>{spec.port}</dd>
                  {spec.path && (
                    <>
                      <dt>Path</dt>
                      <dd>{spec.path}</dd>
                    </>
                  )}
                  <dt>Interval</dt>
                  <dd>{spec.interval}</dd>
                  <dt>Timeout</dt>
                  <dd>{spec.timeout}</dd>
                  <dt>Healthy threshold</dt>
                  <dd>{spec.healthyThreshold}</dd>
                  <dt>Unhealthy threshold</dt>
                  <dd>{spec.unhealthyThreshold}</dd>
                </div>
              ))}
            </>
          )}
        </dl>
      </CollapsibleSection>
    );
  }
}
