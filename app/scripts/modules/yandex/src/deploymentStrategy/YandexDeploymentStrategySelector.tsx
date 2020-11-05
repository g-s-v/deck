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
import Select, { Option } from 'react-select';
import { defaultsDeep, unset } from 'lodash';

import {
  HelpField,
  IDeploymentStrategy,
  IDeploymentStrategyAdditionalFieldsProps,
  IServerGroupCommand,
  Markdown,
} from '@spinnaker/core';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';

export interface IYandexDeploymentStrategySelectorProps {
  command: IServerGroupCommand;
  onFieldChange: (key: string, value: any) => void;
  onStrategyChange: (command: IServerGroupCommand, strategy: IDeploymentStrategy) => void;
}

export interface IYandexDeploymentStrategySelectorState {
  strategies: IDeploymentStrategy[];
  currentStrategy: string;
  AdditionalFieldsComponent: React.ComponentType<IDeploymentStrategyAdditionalFieldsProps>;
}

export class YandexDeploymentStrategySelector extends React.Component<
  IYandexDeploymentStrategySelectorProps,
  IYandexDeploymentStrategySelectorState
> {
  public state: IYandexDeploymentStrategySelectorState = {
    strategies: [
      {
        label: 'None',
        description: 'Creates the next server group with no impact on existing server groups',
        key: '',
      },
      {
        label: 'Rolling update',
        description:
          'Gradually replaces <i>all</i> previous server group instances in the cluster as soon as new server group instances pass health checks',
        key: 'rollingpush',
        initializationMethod: (command: IYandexServerGroupCommand) => {
          defaultsDeep(command, {
            termination: {},
          });
        },
      },
    ],
    currentStrategy: null,
    AdditionalFieldsComponent: undefined,
  };

  public selectStrategy(strategy: string): void {
    const { command, onStrategyChange } = this.props;
    const oldStrategy = this.state.strategies.find(s => s.key === this.state.currentStrategy);
    const newStrategy = this.state.strategies.find(s => s.key === strategy);

    if (oldStrategy && oldStrategy.additionalFields) {
      oldStrategy.additionalFields.forEach(field => {
        if (!newStrategy || !newStrategy.additionalFields || !newStrategy.additionalFields.includes(field)) {
          unset(command, field);
        }
      });
    }

    let AdditionalFieldsComponent;
    if (newStrategy) {
      AdditionalFieldsComponent = newStrategy.AdditionalFieldsComponent;
      if (newStrategy.initializationMethod) {
        newStrategy.initializationMethod(command);
      }
    }
    command.strategy = strategy;
    if (onStrategyChange && newStrategy) {
      onStrategyChange(command, newStrategy);
    }
    this.setState({ currentStrategy: strategy, AdditionalFieldsComponent });
  }

  public strategyChanged = (option: Option<IDeploymentStrategy>) => {
    this.selectStrategy(option.key);
  };

  public componentDidMount() {
    this.selectStrategy(this.props.command.strategy);
  }

  public render() {
    const { command, onFieldChange } = this.props;
    const { AdditionalFieldsComponent, currentStrategy, strategies } = this.state;
    const hasAdditionalFields = Boolean(AdditionalFieldsComponent);
    if (strategies && strategies.length) {
      return (
        <div>
          <div className="StandardFieldLayout flex-container-h baseline margin-between-lg">
            <div className={`sm-label-right`} style={{ paddingLeft: '13px' }}>
              Strategy &nbsp;
              <HelpField id="core.serverGroup.strategy" />
            </div>
            <div className="flex-grow">
              <Select
                clearable={false}
                required={true}
                options={strategies}
                placeholder="None"
                valueKey="key"
                value={currentStrategy}
                optionRenderer={this.strategyOptionRenderer}
                valueRenderer={o => <>{o.label}</>}
                onChange={this.strategyChanged}
              />
            </div>
          </div>
          {hasAdditionalFields && (
            <div className="form-group col-md-9 col-md-offset-3" style={{ marginTop: '5px', float: 'right' }}>
              <AdditionalFieldsComponent command={command} onChange={onFieldChange} />
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  private strategyOptionRenderer = (option: IDeploymentStrategy) => {
    return (
      <div className="body-regular">
        <strong>
          <Markdown tag="span" message={option.label} />
        </strong>
        <div>
          <Markdown tag="span" message={option.description} />
        </div>
      </div>
    );
  };
}
