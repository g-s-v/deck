import * as React from 'react';

import { CollapsibleSection } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export class YandexScalingPoliciesDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  constructor(props: IYandexServerGroupDetailsSectionProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { serverGroup } = this.props;
    return (
      <CollapsibleSection heading="Scaling Policies">
        <dl className="dl-horizontal dl-flex">
          <dt>Deploy policy</dt>
          <dd>
            <div>Max unavailable: {serverGroup.deployPolicy.maxUnavailable}</div>
            <div>Max expansion: {serverGroup.deployPolicy.maxExpansion}</div>
            <div>Max deleting: {serverGroup.deployPolicy.maxDeleting}</div>
            <div>Max creating: {serverGroup.deployPolicy.maxCreating}</div>
            <div>Startup duration: {serverGroup.deployPolicy.startupDuration}</div>
          </dd>
          <hr />
          {!serverGroup.autoScalePolicy && (
            <div>
              <dt>Scale type</dt>
              <dd>fixed</dd>
              <dt>Size</dt>
              <dd>{serverGroup.capacity.desired}</dd>
            </div>
          )}
          {serverGroup.autoScalePolicy && (
            <div>
              <dt>Scale type</dt>
              <dd>auto</dd>
              <div>
                <dt>Min zone size</dt>
                <dd>{serverGroup.autoScalePolicy.minZoneSize}</dd>
                <dt>Max group size</dt>
                <dd>{serverGroup.autoScalePolicy.maxSize}</dd>
                <dt>Measurement duration</dt>
                <dd>{serverGroup.autoScalePolicy.measurementDuration}</dd>
                <dt>Warmup duration</dt>
                <dd>{serverGroup.autoScalePolicy.warmupDuration}</dd>
                <dt>Stabilization duration</dt>
                <dd>{serverGroup.autoScalePolicy.stabilizationDuration}</dd>
                {serverGroup.autoScalePolicy.cpuUtilizationRule && <dt>Cpu utilization target</dt>}
                {serverGroup.autoScalePolicy.cpuUtilizationRule && (
                  <dd>{serverGroup.autoScalePolicy.cpuUtilizationRule.utilizationTarget}</dd>
                )}
                {serverGroup.autoScalePolicy.customRules && (
                  <ul>
                    {serverGroup.autoScalePolicy.customRules.map(rule => (
                      <li>
                        {rule.ruleType} {rule.metricType} {rule.metricName} {rule.target}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </dl>
      </CollapsibleSection>
    );
  }
}
