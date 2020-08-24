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
  FormikFormField,
  FormikStageConfig,
  IAccount,
  IStageConfigProps,
  MapEditorInput,
  ReactSelectInput,
  TextInput,
} from '@spinnaker/core';

export interface IYandexFindImageFromTagsConfigState {
  accounts: IAccount[];
}

export class YandexFindImageFromTagsStageConfig extends React.Component<
  IStageConfigProps,
  IYandexFindImageFromTagsConfigState
> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    this.props.updateStageField({
      cloudProvider: 'yandex',
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

  public render() {
    const { accounts } = this.state;
    return (
      <div>
        <FormikStageConfig
          {...this.props}
          onChange={this.props.updateStage}
          render={() => (
            <div className="form-horizontal">
              <FormikFormField
                name="credentials"
                label="Account"
                fastField={false}
                input={props => (
                  <ReactSelectInput
                    {...props}
                    options={
                      accounts &&
                      accounts.map((acc: IAccount) => ({
                        label: acc.name,
                        value: acc.name,
                      }))
                    }
                  />
                )}
              />
              <FormikFormField
                name="packageName"
                label="Package"
                input={props => <TextInput {...props} inputClassName={'form-control input-sm'} />}
              />
              <div className="sp-margin-m-bottom">
                <div className="sm-label-center">
                  <b>Tags</b>
                </div>
                <FormikFormField
                  name="tags"
                  input={props => <MapEditorInput {...props} allowEmptyValues={true} addButtonLabel="Add Tag" />}
                />
              </div>
            </div>
          )}
        />
      </div>
    );
  }
}
