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

import { Option } from 'react-select';

import { Observable, Subject } from 'rxjs';

import {
  AccountService,
  IAccount,
  IExpectedArtifact,
  IRegion,
  IStageConfigProps,
  ReactSelectInput,
  StageConfigField,
  StageArtifactSelector,
  IArtifact,
  ArtifactTypePatterns,
} from '@spinnaker/core';

import { CreateServiceInstanceDirectInput } from './CreateServiceInstanceDirectInput';
import { CreateUserProvidedInput } from './CreateUserProvidedInput';
import { ICloudFoundryServiceManifestSource } from './ICloudFoundryServiceManifestSource';

import './cloudfoundryDeployServiceStage.less';

interface ICloudfoundryDeployServiceStageConfigState {
  regions: IRegion[];
  accounts: IAccount[];
}
//todo: посмотреть зачем это тут и надо ли мне
export class CloudfoundryDeployServiceStageConfig extends React.Component<
  IStageConfigProps,
  ICloudfoundryDeployServiceStageConfigState
> {
  private defaultDirectManifest = {
    direct: {
      parameters: '',
      service: '',
      serviceInstanceName: '',
      servicePlan: '',
      updatable: true,
    },
  };
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    this.props.updateStageField({ cloudProvider: 'cloudfoundry' });
    this.state = {
      accounts: [],
      regions: [],
    };
  }

  private accountUpdated = (option: Option<string>): void => {
    const credentials = option.target.value;
    const updates: any = { credentials: credentials, region: '' };
    if (!this.props.stage.manifest || this.props.stage.manifest.direct) {
      updates.manifest = this.defaultDirectManifest;
    }
    this.props.updateStageField(updates);
    this.reloadRegions();
  };

  public componentDidMount(): void {
    Observable.fromPromise(AccountService.listAccounts('cloudfoundry'))
      .takeUntil(this.destroy$)
      .subscribe(accounts => this.setState({ accounts }));
    this.reloadRegions();
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private reloadRegions = () => {
    const { credentials } = this.props.stage;
    if (credentials) {
      Observable.fromPromise(AccountService.getRegionsForAccount(credentials))
        .takeUntil(this.destroy$)
        .subscribe(regions => this.setState({ regions }));
    }
  };

  private manifestSourceUpdated = (source: string): void => {
    switch (source) {
      case 'direct':
        this.props.updateStageField({ manifest: this.defaultDirectManifest });
        break;
      case 'artifact':
        this.props.updateStageField({ manifest: {} });
        break;
    }
  };

  private onExpectedArtifactSelected = (expectedArtifact: IExpectedArtifact): void => {
    this.props.updateStageField({ manifest: { artifactId: expectedArtifact.id } });
  };

  private onArtifactChanged = (artifact: IArtifact): void => {
    this.props.updateStageField({ manifest: { artifact } });
  };

  private regionUpdated = (option: Option<string>): void => {
    const updates: any = { region: option.target.value };
    const direct = this.props.stage.manifest.direct;
    if (direct) {
      updates.manifest = this.defaultDirectManifest;
    }
    this.props.updateStageField(updates);
  };

  private serviceManifestSourceUpdated = (manifest: ICloudFoundryServiceManifestSource) => {
    this.props.updateStageField({ manifest });
  };

  private userProvidedUpdated = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.props.updateStageField({ userProvided: event.target.checked });
  };

  public render() {
    const { pipeline, stage } = this.props;
    const { credentials, region, userProvided, manifest } = this.props.stage;
    const { accounts, regions } = this.state;
    const directInput = !manifest || !!manifest.direct;
    let manifestInput;

    if (directInput) {
      const directManifest = (manifest && manifest.direct) || this.defaultDirectManifest;
      manifestInput = userProvided ? (
        <CreateUserProvidedInput
          onChange={this.serviceManifestSourceUpdated}
          service={directManifest}
          onServiceChanged={direct => this.serviceManifestSourceUpdated({ direct })}
        />
      ) : (
        <CreateServiceInstanceDirectInput
          credentials={credentials}
          region={region}
          service={directManifest}
          onServiceChanged={direct => this.serviceManifestSourceUpdated({ direct })}
        />
      );
    } else {
      manifestInput = (
        <StageConfigField label="Artifact">
          <StageArtifactSelector
            pipeline={pipeline}
            stage={stage}
            expectedArtifactId={manifest.artifactId}
            excludedArtifactTypePatterns={[
              ArtifactTypePatterns.KUBERNETES,
              ArtifactTypePatterns.FRONT50_PIPELINE_TEMPLATE,
              ArtifactTypePatterns.DOCKER_IMAGE,
            ]}
            artifact={manifest.artifact}
            onExpectedArtifactSelected={this.onExpectedArtifactSelected}
            onArtifactEdited={this.onArtifactChanged}
          />
        </StageConfigField>
      );
    }

    return (
      <div className="form-horizontal cloudfoundry-deploy-service-stage">
        <StageConfigField label="Account">
          <ReactSelectInput
            clearable={false}
            onChange={this.accountUpdated}
            value={credentials}
            stringOptions={accounts.map(it => it.name)}
          />
        </StageConfigField>
        <StageConfigField label="Region">
          <ReactSelectInput
            clearable={false}
            onChange={this.regionUpdated}
            value={region}
            stringOptions={regions.map(it => it.name)}
          />
        </StageConfigField>
        <StageConfigField label="User-provided">
          <input type="checkbox" checked={!!userProvided} onChange={this.userProvidedUpdated} />
        </StageConfigField>
        <StageConfigField label="Configuration Source">
          <div className="radio radio-inline">
            <label>
              <input type="radio" checked={!directInput} onChange={() => this.manifestSourceUpdated('artifact')} />{' '}
              Manifest
            </label>
          </div>
          <div className="radio radio-inline">
            <label>
              <input type="radio" checked={directInput} onChange={() => this.manifestSourceUpdated('direct')} /> Form
            </label>
          </div>
        </StageConfigField>
        {manifestInput}
      </div>
    );
  }
}
