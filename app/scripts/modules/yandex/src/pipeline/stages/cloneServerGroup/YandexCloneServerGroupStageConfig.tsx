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

import {
  AccountService,
  CheckboxInput,
  DeploymentStrategySelector,
  FormikFormField,
  FormikStageConfig,
  HelpField,
  IAccount,
  IDeploymentStrategy,
  IFormInputProps,
  IStageConfigProps,
  NameUtils,
  NgReact,
  StageConfigField,
  StageConstants,
  TextInput,
} from '@spinnaker/core';
import { AccountClusterSelector } from 'yandex/pipeline/stages/common/AccountClusterSelector';
import { Observable, Subject } from 'rxjs';
import { IServerGroupCommand } from '@spinnaker/core';

export interface IYandexCloneServerGroupStageConfigState {
  accounts: IAccount[];
}

export class YandexCloneServerGroupStageConfig extends React.Component<
  IStageConfigProps,
  IYandexCloneServerGroupStageConfigState
> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    const cloneTargets = StageConstants.TARGET_LIST;
    this.props.updateStageField({
      cloudProvider: 'yandex',
      application: props.application.name,
      target: props.stage.target || cloneTargets[0].val,
    });
    this.state = { accounts: [] };

    if (this.props.stage.isNew) {
      this.props.updateStageField({
        useSourceCapacity: true,
        enableTraffic: true,
      });
    }

    if (
      this.props.stage.isNew &&
      props.application.attributes.platformHealthOnlyShowOverride &&
      props.application.attributes.platformHealthOnly
    ) {
      this.props.updateStageField({
        interestingHealthProviderNames: 'Yandex',
      });
    }
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
    let stack = '';
    let freeFormDetails = '';
    if (stage.cluster) {
      const clusterName = NameUtils.parseServerGroupName(stage.cluster);
      stack = clusterName.stack;
      freeFormDetails = clusterName.freeFormDetails;
    }
    this.props.updateStageField({
      credentials: stage.credentials,
      region: stage.region,
      targetCluster: stage.targetCluster,
      stack: stack,
      freeFormDetails: freeFormDetails,
    });
  };

  private strategyChanged = (_: IServerGroupCommand, strategy: IDeploymentStrategy) => {
    this.props.updateStageField({
      strategy: strategy.key,
    });
  };

  private onStrategyFieldChange = (key: string, value: any) => {
    this.props.updateStageField({
      [key]: value,
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
            clusterField={'targetCluster'}
            onComponentUpdate={this.componentUpdated}
            component={stage}
          />
        )}
        <StageConfigField label="Target">
          <TargetSelect model={{ target }} options={StageConstants.TARGET_LIST} onChange={this.targetUpdated} />
        </StageConfigField>

        <FormikStageConfig
          {...this.props}
          onChange={this.props.updateStage}
          render={() => (
            <div className="form-horizontal">
              <FormikFormField
                fastField={false}
                label="Traffic"
                name="enableTraffic"
                input={(inputProps: IFormInputProps) => (
                  <CheckboxInput text={'Send client requests to new instances'} {...inputProps} />
                )}
              />
              <FormikFormField
                fastField={false}
                label="Capacity"
                name="useSourceCapacity"
                help={<HelpField id="serverGroupCapacity.useSourceCapacityTrue" />}
                onChange={value => {
                  if (value == true) {
                    this.props.updateStageField({ targetSize: '' });
                  }
                  this.forceUpdate();
                }}
                input={(inputProps: IFormInputProps) => (
                  <CheckboxInput text={'Copy the capacity from the current server group'} {...inputProps} />
                )}
              />
              {stage.useSourceCapacity == false && (
                <FormikFormField
                  name={'targetSize'}
                  fastField={false}
                  required={true}
                  input={props => <TextInput type="number" min={0} max={100} {...props} />}
                  label="Number of Instances"
                />
              )}
            </div>
          )}
        />

        {/*todo: поменять на YandexDeploymentStrategySelector.tsx*/}
        <DeploymentStrategySelector
          command={(this.props.stage as unknown) as IServerGroupCommand}
          fieldColumns={'6'}
          onFieldChange={this.onStrategyFieldChange}
          onStrategyChange={this.strategyChanged}
        />
      </div>
    );
  }
}
