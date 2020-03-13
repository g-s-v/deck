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

import * as React from 'react';

import { IExecutionDetailsSectionProps, StageExecutionLogs, StageFailureMessage } from 'core/pipeline';
import { ExecutionDetailsSection, SETTINGS } from '@spinnaker/core';
import { $interpolate } from 'ngimport';

export class YandexBakeDetailsTab extends React.Component<IExecutionDetailsSectionProps> {
  public static title = 'bakeConfig';

  constructor(props: IExecutionDetailsSectionProps) {
    super(props);
  }

  public render() {
    const { stage, current, name } = this.props;

    return (
      <ExecutionDetailsSection name={name} current={current}>
        <div className="row">
          <div className="col-md-12">
            <dl className="dl-narrow dl-horizontal">
              <dt if-multiple-providers>Provider</dt>
              <dd if-multiple-providers>Yandex</dd>
              <dt>Image</dt>
              <dd>{stage.context.ami}</dd>
              <dt>Region</dt>
              <dd>{stage.context.region}</dd>
              <dt>Package</dt>
              <dd>{stage.context.package}</dd>
              <dt>Base OS</dt>
              <dd>{stage.context.baseOs}</dd>
              <dt>Rebake</dt>
              <dd>{stage.context.rebake}</dd>
              {stage.context.templateFileName && <dt>Template</dt>}
              {stage.context.templateFileName && <dd>{stage.context.templateFileName}</dd>}
            </dl>
          </div>
        </div>
        <StageFailureMessage stage={stage} message={stage.failureMessage} />
        <StageExecutionLogs stage={stage} />
        {stage.context.region && stage.context.status.resourceId && (
          <div className="row">
            <div className="col-md-12">
              <div className={`alert ${stage.isFailed ? 'alert-danger' : 'alert-info'}`}>
                {stage.context.previouslyBaked && <div>No changes detected; reused existing bake</div>}
                {!stage.context.previouslyBaked && (
                  <a target="_blank" href={$interpolate(SETTINGS.bakeryDetailUrl)(stage)}>
                    View Bakery Details
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </ExecutionDetailsSection>
    );
  }

  //     <div class="row" ng-if="stage.context.region && stage.context.status.resourceId">

  //     </div>
  //   </div>
  // </div>
}
