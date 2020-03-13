import { BakeryReader, IStageConfigProps, StageConfigField } from 'core/pipeline';

import { BakeryReader, FormikStageConfig, IStageConfigProps } from 'core/pipeline';

import { ArtifactIcon, CheckboxInput, ReactSelectInput, TextInput } from '@spinnaker/core';
import * as React from 'react';
import { Observable, Subject } from 'rxjs';
import { IBaseOsOption } from 'core/pipeline/config/stages/bake/bakeStageChooseOs.component';
import { FormikStageConfig } from '../../../../../core/src/pipeline';
import { FormikFormField } from '../../../../../core/src/presentation/forms/fields';
import { HelpField } from '../../../../../core/src/help';
import { TextInput } from '../../../../../core/src/presentation/forms/inputs';
import { SETTINGS } from '../../../../../core/src/config';

export interface IYandexBakeStageState {
  baseOsOptions: IBaseOsOption[];
  optionsLoading: boolean;
}

export class YandexBakeStage extends React.Component<IStageConfigProps, IYandexBakeStageState> {
  private destroy$ = new Subject();

  constructor(props: IStageConfigProps) {
    super(props);
    props.stage.cloudProvider = 'yandex';
    props.stage.region = 'ru-central1';
    this.state = {
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
        // this.props.updateStageField({baseOs: baseOsOptions.baseImages[0].id});
      });
    // scope.viewState.providerSelected = true;

    // expectedArtifacts: ExpectedArtifactService.getExpectedArtifactsAvailableToStage(
    //   $scope.stage,
    //   $scope.pipeline,
    // ),

    // $scope.viewState.roscoMode =
    //   SETTINGS.feature.roscoMode ||
    //   (typeof SETTINGS.feature.roscoSelector === 'function' && SETTINGS.feature.roscoSelector($scope.stage));
    // $scope.showAdvancedOptions = showAdvanced();
    // $scope.viewState.loading = false;
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  // $scope.viewState = {
  //   loading: true,
  // };
  private rebakeChange(checked: boolean) {}

  public render() {
    const { PipelineBakeStageChooseOs } = NgReact;
    const { baseOsOptions, optionsLoading } = this.state;
    const { stage } = this.props;
    const { baseOs, rebake } = stage;

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
                    options={
                      baseOsOptions &&
                      baseOsOptions.map(option => ({
                        value: option.id,
                        label: option.detailedDescription,
                      }))
                    }
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
            </div>
          )}
        />

        {/*<PipelineBakeStageChooseOs*/}
        {/*  model={{ baseOs }}*/}
        {/*  baseOsOptions={baseOsOptions}*/}
        {/*  // onChange={t => this.props.updateStageField(t)}*/}
        {/* />*/}
        {/*<StageConfigField label="Rebake">*/}
        {/*  <CheckboxInput*/}
        {/*    onChange={checked => this.props.updateStageField({ rebake: checked })}*/}
        {/*    checked={rebake} */}
        {/*    text={"Rebake image without regard to the status of any existing bake"}/>*/}
        {/*</StageConfigField>*/}
      </div>
    );
  }
}
