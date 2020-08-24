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

import { AccountClusterSelector } from './AccountClusterSelector';

export interface IYandexServerGroupStageConfigState {
  accounts: IAccount[];
}

export class YandexServerGroupStageConfig extends React.Component<
  IStageConfigProps,
  IYandexServerGroupStageConfigState
> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    this.props.updateStageField({ cloudProvider: 'yandex' });
    this.state = { accounts: [] };
  }

  public componentDidMount(): void {
    Observable.fromPromise(AccountService.listAccounts('yandex'))
      .takeUntil(this.destroy$)
      .subscribe(accounts => this.setState({ accounts }));
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

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
    const { application, pipeline, stage } = this.props;
    const { target } = stage;
    const { accounts } = this.state;
    const { TargetSelect } = NgReact;
    return (
      <div className="form-horizontal">
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
      </div>
    );
  }
}
