import * as React from 'react';

import { CollapsibleSection } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';

export interface IPackageDetailsSectionState {
  commitHash: string;
  jenkinsLink: string;
}

export class YandexPackageDetailsSection extends React.Component<
  IYandexServerGroupDetailsSectionProps,
  IPackageDetailsSectionState
> {
  constructor(props: IYandexServerGroupDetailsSectionProps) {
    super(props);

    this.state = YandexPackageDetailsSection.getState(props);
  }

  private static getState(props: IYandexServerGroupDetailsSectionProps): IPackageDetailsSectionState {
    const { serverGroup } = props;

    const buildInfo = serverGroup.buildInfo || {};

    let commitHash: string = null;
    if (buildInfo.commit) {
      commitHash = serverGroup.buildInfo.commit.substring(0, 8);
    }

    let jenkinsLink: string = null;
    if (buildInfo.buildInfoUrl) {
      jenkinsLink = serverGroup.buildInfo.buildInfoUrl;
    } else if (buildInfo.jenkins) {
      const jenkins = serverGroup.buildInfo.jenkins;
      jenkinsLink = `${jenkins.host}job/${jenkins.name}/${jenkins.number}`;
    }

    return { commitHash, jenkinsLink };
  }

  public componentWillReceiveProps(nextProps: IYandexServerGroupDetailsSectionProps): void {
    this.setState(YandexPackageDetailsSection.getState(nextProps));
  }

  public render(): JSX.Element {
    const { serverGroup } = this.props;
    const { commitHash, jenkinsLink } = this.state;

    if (serverGroup.buildInfo && serverGroup.buildInfo.jenkins) {
      return (
        <CollapsibleSection heading="Package">
          <dl className="horizontal-when-filters-collapsed">
            <dt>Job</dt>
            <dd>{serverGroup.buildInfo.jenkins.name}</dd>
            <dt>Package</dt>
            <dd>{serverGroup.buildInfo.package_name}</dd>
            <dt>Build</dt>
            <dd>{serverGroup.buildInfo.jenkins.number}</dd>
            <dt>Commit</dt>
            <dd>{commitHash}</dd>
            <dt>Version</dt>
            <dd>{serverGroup.buildInfo.version}</dd>
            <dt>Build Link</dt>
            <dd>
              <a target="_blank" href={jenkinsLink}>
                {jenkinsLink}
              </a>
            </dd>
          </dl>
        </CollapsibleSection>
      );
    }

    return null;
  }
}
