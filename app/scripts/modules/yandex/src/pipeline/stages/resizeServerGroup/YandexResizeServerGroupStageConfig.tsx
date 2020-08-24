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

import { Observable, Subject } from 'rxjs';

import {
  AccountService,
  IAccount,
  IStageConfigProps,
  NgReact,
  StageConstants,
  StageConfigField,
} from '@spinnaker/core';

import { AccountClusterSelector } from '../common/AccountClusterSelector';

export interface IYandexResizeAsgStageConfigState {
  accounts: IAccount[];
}

export class YandexResizeServerGroupStageConfig extends React.Component<
  IStageConfigProps,
  IYandexResizeAsgStageConfigState
> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    const { stage } = props;
    let interestingHealthProviderNames;
    if (
      stage.isNew &&
      props.application.attributes.platformHealthOnlyShowOverride &&
      props.application.attributes.platformHealthOnly
    ) {
      interestingHealthProviderNames = ['Yandex'];
    }
    const { capacity } = stage;
    this.props.updateStageField({
      action: 'scale_exact',
      capacity: capacity && capacity.desired ? capacity : { desired: 1, min: 1, max: 1 },
      cloudProvider: 'yandex',
      interestingHealthProviderNames: interestingHealthProviderNames,
    });

    this.state = { accounts: [] };
  }

  public componentDidMount(): void {
    Observable.fromPromise(AccountService.listAccounts('yandex'))
      .takeUntil(this.destroy$)
      .subscribe(accounts => this.setState({ accounts }));
    this.props.stageFieldUpdated();
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private instanceCountUpdated = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const instanceCount = parseInt(event.target.value, 10);
    this.props.updateStageField({
      capacity: {
        desired: instanceCount,
        min: instanceCount,
        max: instanceCount,
      },
    });
  };

  private targetUpdated = (target: string) => {
    this.props.updateStageField({ target });
  };

  private componentUpdated = (stage: any): void => {
    this.props.updateStageField({
      credentials: stage.credentials,
      region: stage.region,
      cluster: stage.cluster,
    });
  };

  public render() {
    const { accounts } = this.state;
    const { application, pipeline, stage } = this.props;
    const { capacity, target } = stage;
    const instanceCount = capacity.desired;
    const { TargetSelect } = NgReact;
    return (
      <div className="cloudfoundry-resize-asg-stage form-horizontal">
        {!pipeline.strategy && (
          <AccountClusterSelector
            accounts={accounts}
            application={application}
            onComponentUpdate={this.componentUpdated}
            component={stage}
          />
        )}
        <StageConfigField label="Target">
          <TargetSelect model={{ target }} options={StageConstants.TARGET_LIST} onChange={this.targetUpdated} />
        </StageConfigField>
        <div className="form-group">
          <span className="col-md-3 sm-label-right" />
          <div className="col-md-9">
            <div className="col-md-3 sm-label-left">Instances</div>
          </div>
          <StageConfigField label="Match capacity">
            <div className="col-md-3">
              <input
                type="number"
                key="instanceCount"
                onChange={this.instanceCountUpdated}
                value={instanceCount}
                className="form-control input-sm"
              />
            </div>
            <div className="col-md-9 col-md-offset-3">
              <em className="subinput-note">Scaled capacity will match the numbers entered</em>
            </div>
          </StageConfigField>
        </div>
      </div>
    );
  }
}
