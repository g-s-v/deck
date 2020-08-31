import {
  BakeryReader,
  FormikStageConfig,
  IStageConfigProps,
  ArtifactIcon,
  CheckboxInput,
  ExpectedArtifactService,
  MapEditorInput,
  ReactSelectInput,
  TextInput,
  FormikFormField,
  HelpField,
  IExpectedArtifact,
} from '@spinnaker/core';

import * as React from 'react';
import { Observable, Subject } from 'rxjs';
import Select, { Option } from 'react-select';
import { find, map } from 'lodash';

export interface IBaseOsOption {
  id: string;
  shortDescription?: string;
  detailedDescription: string;
  isImageFamily?: boolean;
  displayName?: string;
}

export interface IYandexBakeStageState {
  expectedArtifacts: IExpectedArtifact[];
  baseOsOptions: IBaseOsOption[];
  optionsLoading: boolean;
}

export class YandexBakeStageConfig extends React.Component<IStageConfigProps, IYandexBakeStageState> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    props.stage.cloudProvider = 'yandex';
    props.stage.region = 'ru-central1';
    this.state = {
      expectedArtifacts: ExpectedArtifactService.getExpectedArtifactsAvailableToStage(props.stage, props.pipeline),
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
                    optionRenderer={this.renderArtifact}
                    placeholder="Select an artifact..."
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
                name="templateFileName"
                label="Template File Name"
                input={props => <TextInput {...props} inputClassName={'form-control input-sm'} />}
              />
              <div className="sp-margin-m-bottom">
                <div className="sm-label-center">
                  <b>Extended Attributes</b>
                </div>
                <FormikFormField
                  name="extendedAttributes"
                  input={props => (
                    <MapEditorInput {...props} allowEmptyValues={true} addButtonLabel="Add Extended Attribute" />
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
    );
  }
}
