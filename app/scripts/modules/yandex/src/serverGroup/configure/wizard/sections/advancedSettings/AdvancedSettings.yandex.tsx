import { FormikProps } from 'formik';

import {
  CheckboxInput,
  FormikFormField,
  IWizardPageComponent,
  MapEditorInput,
  ReactSelectInput,
  TextInput,
} from '@spinnaker/core';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import * as React from 'react';
import { IYandexServiceAccount } from 'yandex/serviceAccount';
import { YandexServerGroupConfigurationDisks } from './AttachedDisk.yandex';
import { IYandexImage } from 'yandex/image';

export interface IYandexServerGroupAdvancedSettingsProps {
  formik: FormikProps<IYandexServerGroupCommand>;
  serviceAccounts: IYandexServiceAccount[];
  serviceAccountsLoading: boolean;
  showImageSourceSelector: boolean;
  imageLoading: boolean;
  allImages: IYandexImage[];
}

export class YandexServerGroupAdvancedSettings extends React.Component<IYandexServerGroupAdvancedSettingsProps>
  implements IWizardPageComponent<IYandexServerGroupAdvancedSettingsProps> {
  private usingPublicIpChanged = (use: boolean): void => {
    this.props.formik.values.instanceTemplate.networkInterfaceSpecs[0].primaryV4AddressSpec.oneToOneNat = use;
  };

  public render(): JSX.Element {
    const {
      formik,
      serviceAccounts,
      serviceAccountsLoading,
      showImageSourceSelector,
      imageLoading,
      allImages,
    } = this.props;
    return (
      <div className="form-group">
        <div className="col-md-11">
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name={'instanceTemplate.description'}
              input={props => <TextInput {...props} />}
              label="Instance's description"
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name={'instanceTemplate.schedulingPolicy.preemptible'}
              input={props => <CheckboxInput {...props} />}
              label="Preemptible"
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name={'instanceTemplate.publicIP'}
              input={props => <CheckboxInput {...props} />}
              label="Associate Public IP Address"
              onChange={this.usingPublicIpChanged}
            />
          </div>

          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="instanceTemplate.serviceAccountId"
              label="Service Account"
              fastField={false}
              input={props => (
                <ReactSelectInput
                  {...props}
                  options={
                    serviceAccounts &&
                    serviceAccounts.map((account: IYandexServiceAccount) => ({
                      value: account.id,
                      label: account.name + ' (' + account.id + ')',
                    }))
                  }
                  isLoading={serviceAccountsLoading}
                />
              )}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <YandexServerGroupConfigurationDisks
              formik={formik}
              showImageSourceSelector={showImageSourceSelector}
              imageLoading={imageLoading}
              allImages={allImages}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <div className="sm-label-left">
              <b>Instance Group Labels</b>
            </div>
            <FormikFormField
              name="labels"
              input={props => <MapEditorInput {...props} allowEmptyValues={true} addButtonLabel="Add label" />}
            />
          </div>

          <div className="sp-margin-m-bottom">
            <div className="sm-label-left">
              <b>Instance's Labels</b>
            </div>
            <FormikFormField
              name="instanceTemplate.labels"
              input={props => <MapEditorInput {...props} allowEmptyValues={true} addButtonLabel="Add label" />}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <div className="sm-label-left">
              <b>Instance's Metadata</b>
            </div>
            <FormikFormField
              name="instanceTemplate.metadata"
              input={props => <MapEditorInput {...props} allowEmptyValues={true} addButtonLabel="Add metadata" />}
            />
          </div>
        </div>
      </div>
    );
  }

  public validate(_props: IYandexServerGroupAdvancedSettingsProps) {
    return {} as any;
  }
}
