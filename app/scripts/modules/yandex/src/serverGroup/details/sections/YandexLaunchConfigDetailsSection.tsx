import * as React from 'react';

import { CollapsibleSection } from '@spinnaker/core';

import { IYandexServerGroupDetailsSectionProps } from './IYandexServerGroupDetailsSectionProps';
import { IAttachedDiskSpec, INetworkInterfaceSpec } from 'yandex/domain';

interface IAttachedDiskSpecProps {
  disk: IAttachedDiskSpec;
  index: number;
}

export function AttachedDiskSection(props: IAttachedDiskSpecProps) {
  const { disk, index } = props;
  return (
    <div key={'disk' + index}>
      {index > 0 && (
        <>
          <dt>Disk #{index}</dt>
          <dd />
        </>
      )}
      {disk.deviceName && (
        <>
          <dt>Device name</dt>
          <dd>{disk.deviceName}</dd>
        </>
      )}
      <dt>Disk</dt>
      <dd>
        {disk.diskSpec.typeId}: {disk.diskSpec.size / 1024 / 1024 / 1024} GBytes
      </dd>
      {disk.diskSpec.imageId && (
        <>
          <dt>Image</dt>
          <dd>{disk.diskSpec.imageId}</dd>
        </>
      )}
      {disk.diskSpec.snapshotId && (
        <>
          <dt>Snapshot</dt>
          <dd>{disk.diskSpec.snapshotId}</dd>
        </>
      )}
    </div>
  );
}

interface INetworkInterfaceProps {
  network: INetworkInterfaceSpec;
  index: number;
}

export function NetworkInterfaceSection(props: INetworkInterfaceProps) {
  const { network, index } = props;
  return (
    <div>
      <dt>eth{index}</dt>
      <dd />
      {network.networkId && (
        <>
          <dt>Network</dt>
          <dd>{network.networkId}</dd>
        </>
      )}
      {network.subnetIds.length > 0 && (
        <>
          <dt>Subnets</dt>
          <dd>
            <ul>
              {network.subnetIds.map(subnet => (
                <li key={subnet}>{subnet}</li>
              ))}
            </ul>
          </dd>
        </>
      )}
      {network.primaryV4AddressSpec && (
        <>
          <dt>IPV4</dt>
          {network.primaryV4AddressSpec.oneToOneNat && <dd>internal + external</dd>}
          {!network.primaryV4AddressSpec.oneToOneNat && <dd>internal</dd>}
        </>
      )}
      {network.primaryV6AddressSpec && (
        <>
          <dt>IPV6</dt>
          {network.primaryV6AddressSpec.oneToOneNat && <dd>internal + external</dd>}
          {!network.primaryV6AddressSpec.oneToOneNat && <dd>internal</dd>}
        </>
      )}
    </div>
  );
}

export class YandexLaunchConfigDetailsSection extends React.Component<IYandexServerGroupDetailsSectionProps> {
  constructor(props: IYandexServerGroupDetailsSectionProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { instanceTemplate } = this.props.serverGroup;
    return (
      <CollapsibleSection heading="Launch Configuration">
        <dl className="dl-horizontal dl-flex">
          <dt>VM description</dt>
          <dd>{instanceTemplate.description}</dd>
          <dt>Platform id</dt>
          <dd>{instanceTemplate.platformId}</dd>
          <dt>Preemptible</dt>
          <dd>{instanceTemplate.schedulingPolicy.preemptible ? 'true' : 'false'}</dd>
          {instanceTemplate.serviceAccountId && (
            <>
              <dt>Service account id</dt>
              <dd>{instanceTemplate.serviceAccountId}</dd>
            </>
          )}
          <dt>CPU</dt>
          <dd>
            {instanceTemplate.resourcesSpec.cores} ({instanceTemplate.resourcesSpec.coreFraction}%)
          </dd>
          {instanceTemplate.resourcesSpec.gpus !== 0 && (
            <div>
              <dt>GPU</dt>
              <dd>{instanceTemplate.resourcesSpec.gpus}</dd>
            </div>
          )}
          <dt>Memory</dt>
          <dd>{instanceTemplate.resourcesSpec.memory / 1024 / 1024} MBytes</dd>

          <h4>Boot disk specification</h4>
          <AttachedDiskSection index={0} disk={instanceTemplate.bootDiskSpec} />
          {instanceTemplate.secondaryDiskSpecs && instanceTemplate.secondaryDiskSpecs.length !== 0 && (
            <>
              <h4>Secondary disk specification</h4>
              {instanceTemplate.secondaryDiskSpecs.map((spec, index) => (
                <AttachedDiskSection key={index} index={index + 1} disk={spec} />
              ))}
            </>
          )}
          <h4>Network interfaces</h4>
          {instanceTemplate.networkInterfaceSpecs.map((network, index) => (
            <NetworkInterfaceSection key={index} index={index} network={network} />
          ))}
        </dl>
        <hr />
        <dl className="dl-vertical">
          {instanceTemplate.metadata && Object.keys(instanceTemplate.metadata).length > 0 && (
            <>
              <h4>Metadata</h4>
              {Object.keys(instanceTemplate.metadata).map(key => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{instanceTemplate.metadata[key]}</dd>
                </div>
              ))}
            </>
          )}

          <hr />
          {instanceTemplate.labels && Object.keys(instanceTemplate.labels).length > 0 && (
            <>
              <h4>Labels</h4>
              {Object.keys(instanceTemplate.labels).map(key => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{instanceTemplate.labels[key]}</dd>
                </div>
              ))}
            </>
          )}
        </dl>
      </CollapsibleSection>
    );
  }
}
