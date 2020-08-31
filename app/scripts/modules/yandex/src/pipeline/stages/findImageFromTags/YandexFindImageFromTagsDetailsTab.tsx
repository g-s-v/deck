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

import { IExecutionDetailsSectionProps, StageFailureMessage, ExecutionDetailsSection } from '@spinnaker/core';

import { IYandexImage } from 'yandex/image';

export class YandexFindImageFromTagsDetailsTab extends React.Component<IExecutionDetailsSectionProps> {
  public static title = 'findImageConfig';

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
              <dt>Package</dt>
              <dd>{stage.context.packageName}</dd>
              <dt>Tags</dt>
              <dd>
                {Object.keys(stage.context.tags).map(key => (
                  <span>
                    {key}:{stage.context.tags[key]};
                  </span>
                ))}
              </dd>
            </dl>
          </div>
        </div>
        <StageFailureMessage stage={stage} message={stage.failureMessage} />

        {stage.context.amiDetails && (
          <div className="row">
            <div className="col-md-12">
              <div className="well alert alert-info">
                <h4>Results</h4>
                {stage.context.amiDetails.map((image: IYandexImage) => (
                  <dl className="dl-narrow dl-horizontal">
                    <dt>Image Id</dt>
                    <dd>{image.imageName}</dd>
                    <dt>Image Name</dt>
                    <dd>{image.imageName}</dd>
                  </dl>
                ))}
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
