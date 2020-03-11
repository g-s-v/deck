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

import { BakeryReader, IStageConfigProps } from 'core/pipeline';

import { ArtifactIcon, CheckboxInput, ReactSelectInput, TextInput } from '@spinnaker/core';
import * as React from 'react';
import { Observable, Subject } from 'rxjs';
import { IBaseOsOption } from 'core/pipeline/config/stages/bake/bakeStageChooseOs.component';
import { FormikStageConfig } from '../../../../../core/src/pipeline';
import { FormikFormField } from '../../../../../core/src/presentation/forms/fields';
import { IExpectedArtifact } from '../../../../../core/src/domain';
import Select, { Option } from 'react-select';
import { find, isEmpty, map } from 'lodash';
import { HelpField } from '../../../../../core/src/help';

export interface IYandexBakeStageState {
  expectedArtifacts: IExpectedArtifact[];
  baseOsOptions: IBaseOsOption[];
  optionsLoading: boolean;
}

//todo: improve
export class YandexBakeStage extends React.Component<IStageConfigProps, IYandexBakeStageState> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    props.stage.cloudProvider = 'yandex';
    props.stage.region = 'ru-central1';
    // this.state = {
    //   expectedArtifacts: ExpectedArtifactService.getExpectedArtifactsAvailableToStage(props.stage, props.pipeline),
    //   baseOsOptions: [],
    //   optionsLoading: true,
    // };
    this.state = {
      expectedArtifacts: [
        {
          id: 'id1',
          displayName: 'art1',
          usePriorArtifact: true,
          useDefaultArtifact: true,
          matchArtifact: { id: 'art1', type: 's3/object' },
        } as IExpectedArtifact,
        {
          id: 'id2',
          displayName: 'art2',
          matchArtifact: { id: 'art3', type: 'docker/image' },
        } as IExpectedArtifact,
      ],
      baseOsOptions: [],
      optionsLoading: true,
    };
  }

  public componentDidMount(): void {
    Observable.fromPromise(BakeryReader.getBaseOsOptions('yandex'))
      .takeUntil(this.destroy$)
      .subscribe(baseOsOptions => {
        this.setState({
          baseOsOptions: baseOsOptions.baseImages.map(o => {
            return {
              id: o.id,
              shortDescription: o.shortDescription,
              detailedDescription: o.detailedDescription,
              isImageFamily: true,
              displayName: o.displayName,
            } as IBaseOsOption;
          }),
          optionsLoading: false,
        });
      });
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private renderArtifact = (option: Option<string>) => {
    const artifact = find(this.state.expectedArtifacts, a => a.id === option.value);
    if (!artifact) {
      return null;
    }
    return (
      <span>
        <ArtifactIcon
          type={
            (artifact.matchArtifact && artifact.matchArtifact.type) ||
            (artifact.defaultArtifact && artifact.defaultArtifact.type)
          }
          width="16"
          height="16"
        />
        {artifact.displayName}
      </span>
    );
  };

  public render() {
    const { baseOsOptions, optionsLoading, expectedArtifacts } = this.state;

    return (
      <div>
        <FormikStageConfig
          {...this.props}
          onChange={this.props.updateStage}
          render={() => (
            <div className="form-horizontal">
              <FormikFormField
                name="baseOs"
                label="Base OS"
                fastField={false}
                input={props => (
                  <ReactSelectInput
                    {...props}
                    isLoading={optionsLoading}
                    options={map(baseOsOptions, o => ({
                      value: o.id,
                      label: o.detailedDescription,
                    }))}
                  />
                )}
              />
              <FormikFormField
                name="package"
                label="Package"
                help={<HelpField id="pipeline.config.bake.package" />}
                input={props => <TextInput {...props} inputClassName={'form-control input-sm'} />}
              />
              <FormikFormField
                name="packageArtifactIds"
                label="Package Artifacts"
                help={<HelpField id="pipeline.config.bake.packageArtifacts" />}
                input={props => (
                  <Select
                    {...props}
                    clearable={true}
                    multi={true}
                    options={map(expectedArtifacts, a => ({
                      label: a.displayName,
                      value: a.id,
                    }))}
                    // disabled={isEmpty(fetchStages.result)}

                    // onChange={options => this.props.updateStageField(
                    //   map(options, o => ({
                    //     artifactId: o.value,
                    //   })),
                    // )}
                    optionRenderer={this.renderArtifact}
                    placeholder="Select an artifact..."
                    // value={this.props.packageArtifactIds.filter(b => b.artifactId).map(b => b.artifactId)}
                    valueRenderer={this.renderArtifact}
                  />
                )}
              />
              <FormikFormField
                name="rebake"
                label="Rebake"
                input={props => (
                  <CheckboxInput {...props} text={'Rebake image without regard to the status of any existing bake'} />
                )}
              />
              <FormikFormField
                name="stage.templateFileName"
                label="Template File Name"
                input={props => <TextInput {...props} inputClassName={'form-control input-sm'} />}
              />
            </div>
            // <stage-config-field
            //   label="Template File Name"
            //   help-key="pipeline.config.bake.templateFileName"
            //   ng-if="bakeStageCtrl.showTemplateFileName()"
            // >
            //   <input type="text" class="form-control input-sm" ng-model="stage.templateFileName" />
            // </stage-config-field>
            //     <stage-config-field
            //       label="Account Name"
            //       help-key="pipeline.config.gce.bake.accountName"
            //       ng-if="bakeStageCtrl.showAccountName()"
            //     >
            //       <input type="text" class="form-control input-sm" ng-model="stage.accountName" />
            //     </stage-config-field>
            //     <stage-config-field
            //       label="Extended Attributes"
            //       help-key="pipeline.config.bake.extendedAttributes"
            //       ng-if="bakeStageCtrl.showExtendedAttributes()"
            //     >
            //       <table class="table table-condensed packed">
            //         <thead>
            //           <tr>
            //             <th style="width:40%">Key</th>
            //             <th style="width:60%">Value</th>
            //             <th class="text-right">Actions</th>
            //           </tr>
            //         </thead>
            //         <tbody>
            //           <tr ng-repeat="(key,value) in stage.extendedAttributes">
            //             <ªtd>
            //               <strong class="small">{{key}}</strong>
            //             </td>
            //             <td>
            //               <input
            //                 type="text"
            //                 ng-model="stage.extendedAttributes[key]"
            //                 value="{{value}}"
            //                 class="form-control input-sm"
            //               />
            //             </td>
            //             <td class="text-right">
            //               <a class="small" href ng-click="bakeStageCtrl.removeExtendedAttribute(key)">Remove</a>
            //             </td>
            //           </tr>
            //         </tbody>
            //         <tfoot>
            //           <tr>
            //             <td colspan="7">
            //               <button class="btn btn-block btn-sm add-new" ng-click="bakeStageCtrl.addExtendedAttribute()">
            //                 <span class="glyphicon glyphicon-plus-sign"></span> Add Extended Attribute
            //               </button>
            //             </td>
            //           </tr>
            //         </tfoot>
            //       </table>
            //     </stage-config-field>
            //     <stage-config-field
            //       label="Var File Name"
            //       help-key="pipeline.config.bake.varFileName"
            //       ng-if="bakeStageCtrl.showVarFileName()"
            //     >
            //       <input type="text" class="form-control input-sm" ng-model="stage.varFileName" />
            //     </stage-config-field>
            //     <stage-config-field label="Base Image" help-key="pipeline.config.gce.bake.baseImage">
            //       <input type="text" class="form-control input-sm" ng-model="stage.baseAmi" />
            //     </stage-config-field>
          )}
        />
      </div>
    );
  }
}
