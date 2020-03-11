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

import { FormikProps } from 'formik';

import {
  IArtifact,
  IExpectedArtifact,
  IWizardPageComponent,
  IPipeline,
  IStage,
  StageArtifactSelector,
  ArtifactTypePatterns,
} from '@spinnaker/core';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import * as React from 'react';

export interface IYandexCreateServerGroupArtifactSettingsProps {
  formik: FormikProps<IYandexServerGroupCommand>;
  stage: IStage;
  pipeline: IPipeline;
}

//todo: delete
export class YandexServerGroupArtifactSettings extends React.Component<IYandexCreateServerGroupArtifactSettingsProps>
  implements IWizardPageComponent<IYandexServerGroupCommand> {
  public static get LABEL() {
    return 'Artifact';
  }

  private excludedArtifactTypePatterns = [
    ArtifactTypePatterns.KUBERNETES,
    ArtifactTypePatterns.DOCKER_IMAGE,
    ArtifactTypePatterns.FRONT50_PIPELINE_TEMPLATE,
  ];

  private onExpectedArtifactSelected = (expectedArtifact: IExpectedArtifact): void => {
    this.props.formik.setFieldValue('applicationArtifact', { artifactId: expectedArtifact.id });
  };

  private onArtifactChanged = (artifact: IArtifact): void => {
    this.props.formik.setFieldValue('applicationArtifact', { artifact: artifact });
  };

  public validate(_values: IYandexServerGroupCommand) {
    const { applicationArtifact } = this.props.formik.values;
    const errors = {} as any;
    if (
      !applicationArtifact ||
      !(
        (applicationArtifact.artifact && applicationArtifact.artifact.type && applicationArtifact.artifact.reference) ||
        applicationArtifact.artifactId
      )
    ) {
      errors.applicationArtifact = 'Application artifact information is required';
    }

    return errors;
  }

  public render() {
    const { formik, stage, pipeline } = this.props;
    const applicationArtifact = formik.values.applicationArtifact;
    return (
      <div className="form-group">
        <div className="col-md-11">
          <div className="StandardFieldLayout flex-container-h margin-between-lg">
            <div className="flex-grow">
              <StageArtifactSelector
                pipeline={pipeline}
                stage={stage}
                expectedArtifactId={applicationArtifact && applicationArtifact.artifactId}
                artifact={applicationArtifact && applicationArtifact.artifact}
                onExpectedArtifactSelected={this.onExpectedArtifactSelected}
                onArtifactEdited={this.onArtifactChanged}
                excludedArtifactTypePatterns={this.excludedArtifactTypePatterns}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
