import { Observable, Subject } from 'rxjs';

import { FormikErrors, FormikProps } from 'formik';

import {
  AccountService,
  Application,
  CheckboxInput,
  DeploymentStrategySelector,
  FormikFormField,
  HelpField,
  IAccount,
  IDeploymentStrategy,
  IFormInputProps,
  IModalComponentProps,
  IServerGroup,
  ISubnet,
  IWizardPageComponent,
  NameUtils,
  ReactInjector,
  ReactSelectInput,
  SubnetReader,
  TaskReason,
  TextInput,
} from '@spinnaker/core';

import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import * as React from 'react';
import { IYandexImage } from 'yandex/image';
import { chain, get } from 'lodash';
import { IYandexServiceAccount } from 'yandex/serviceAccount';

export interface IYandexServerGroupBasicSettingsProps extends IModalComponentProps {
  app: Application;
  formik: FormikProps<IYandexServerGroupCommand>;
  accountChanged: (account: string) => void;
  serviceAccounts: IYandexServiceAccount[];
  serviceAccountsLoading: boolean;
  imageLoading: boolean;
  allImages: IYandexImage[];
}

export interface IYandexServerGroupLocationSettingsState {
  accounts: IAccount[];
  allZones: string[];
  subnetLoading: boolean;
  allSubnets: ISubnet[];
  namePreview: string;
  createsNewCluster: boolean;
  latestServerGroup: IServerGroup;
  showPreviewAsWarning: boolean;
}

export class YandexServerGroupBasicSettings
  extends React.Component<IYandexServerGroupBasicSettingsProps, IYandexServerGroupLocationSettingsState>
  implements IWizardPageComponent<IYandexServerGroupCommand> {
  private destroy$ = new Subject();

  constructor(props: IYandexServerGroupBasicSettingsProps) {
    super(props);
    const { app } = props;
    const { values } = props.formik;
    const { mode } = values.viewState;

    const namePreview = NameUtils.getClusterName(app.name, values.stack, values.freeFormDetails);
    const createsNewCluster = !app.clusters.find(c => c.name === namePreview);
    const showPreviewAsWarning = (mode === 'create' && !createsNewCluster) || (mode !== 'create' && createsNewCluster);
    const inCluster = (app.serverGroups.data as IServerGroup[])
      .filter(serverGroup => serverGroup.cluster === namePreview && serverGroup.account === values.credentials)
      .sort((a, b) => a.createdTime - b.createdTime);
    const latestServerGroup = inCluster.length ? inCluster.pop() : null;

    this.state = {
      accounts: [],
      namePreview: namePreview,
      createsNewCluster: createsNewCluster,
      showPreviewAsWarning: showPreviewAsWarning,
      latestServerGroup: latestServerGroup,
      allZones: ['ru-central1-a', 'ru-central1-b', 'ru-central1-c'],
      subnetLoading: true,
      allSubnets: null,
    };
  }

  public componentDidMount(): void {
    Observable.fromPromise(AccountService.listAccounts('yandex'))
      .takeUntil(this.destroy$)
      .subscribe(accounts => {
        this.setState({ accounts });
        this.accountChanged();
      });
  }

  public componentWillUnmount(): void {
    this.destroy$.next();
  }

  private accountChanged = (): void => {
    this.updateSubnetsList();
    const credentials = get(this.props.formik.values, 'credentials', undefined);
    this.props.accountChanged(credentials);
  };

  private updateSubnetsList = (): void => {
    const credentials = get(this.props.formik.values, 'credentials', undefined);
    if (credentials) {
      this.setState({ subnetLoading: true });
      Observable.fromPromise(SubnetReader.listSubnetsByProvider('yandex'))
        .takeUntil(this.destroy$)
        .subscribe(subnets => {
          const thisAccountSubnets = chain(subnets)
            .filter({ account: credentials })
            .value();
          this.setState({
            subnetLoading: false,
            allSubnets: thisAccountSubnets,
          });
        });
    } else {
      this.setState({
        allSubnets: [],
      });
    }
  };

  private navigateToLatestServerGroup = () => {
    const { values } = this.props.formik;
    const { latestServerGroup } = this.state;

    const params = {
      provider: values.selectedProvider,
      accountId: latestServerGroup.account,
      region: latestServerGroup.region,
      serverGroup: latestServerGroup.name,
    };

    this.props.dismissModal();
    const { $state } = ReactInjector;
    if ($state.is('home.applications.application.insight.clusters')) {
      $state.go('.serverGroup', params);
    } else {
      $state.go('^.serverGroup', params);
    }
  };

  private handleReasonChanged = (reason: string) => {
    this.props.formik.setFieldValue('reason', reason);
  };

  private strategyChanged = (_: IYandexServerGroupCommand, strategy: IDeploymentStrategy) => {
    this.props.formik.setFieldValue('strategy', strategy.key);
  };

  private onStrategyFieldChange = (key: string, value: any) => {
    this.props.formik.setFieldValue(key, value);
  };

  public render(): JSX.Element {
    const { serviceAccounts, serviceAccountsLoading, allImages, imageLoading } = this.props;
    const { values } = this.props.formik;
    const { createsNewCluster, latestServerGroup, namePreview, showPreviewAsWarning } = this.state;
    const { accounts, allZones, subnetLoading, allSubnets } = this.state;
    return (
      <div className="form-group">
        <div className="col-md-11">
          {!values.viewState.hideClusterNamePreview && (
            <div className="form-group">
              <div className="col-md-12">
                <div className={`well-compact ${showPreviewAsWarning ? 'alert alert-warning' : 'well'}`}>
                  <h5 className="text-center">
                    <p>Your server group will be in the cluster:</p>
                    <p>
                      <strong>
                        {namePreview}
                        {createsNewCluster && <span> (new cluster)</span>}
                      </strong>
                    </p>
                    {!createsNewCluster && values.viewState.mode === 'create' && latestServerGroup && (
                      <div className="text-left">
                        <p>There is already a server group in this cluster. Do you want to clone it?</p>
                        <p>
                          Cloning copies the entire configuration from the selected server group, allowing you to modify
                          whichever fields (e.g. image) you need to change in the new server group.
                        </p>
                        <p>
                          To clone a server group, select "Clone" from the "Server Group Actions" menu in the details
                          view of the server group.
                        </p>
                        <p>
                          <a className="clickable" onClick={this.navigateToLatestServerGroup}>
                            Go to details for {latestServerGroup.name}
                          </a>
                        </p>
                      </div>
                    )}
                  </h5>
                </div>
              </div>
            </div>
          )}

          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="credentials"
              label="Account"
              fastField={false}
              input={props => (
                <ReactSelectInput
                  {...props}
                  stringOptions={accounts && accounts.map((acc: IAccount) => acc.name)}
                  clearable={false}
                />
              )}
              onChange={this.accountChanged}
              required={true}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="serviceAccountId"
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
                  clearable={false}
                />
              )}
              required={true}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="zones"
              label="Availability zones"
              fastField={false}
              input={props => <ReactSelectInput {...props} stringOptions={allZones} multi />}
              required={true}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="instanceTemplate.networkInterfaceSpecs[0].subnetIds"
              label="Subnets"
              fastField={false}
              required={true}
              input={props => (
                <ReactSelectInput
                  {...props}
                  isLoading={subnetLoading}
                  options={
                    allSubnets &&
                    allSubnets
                      .filter((subnet: ISubnet) => values.zones && values.zones.includes(subnet.availabilityZone))
                      .map((subnet: ISubnet) => ({
                        value: subnet.id,
                        label: subnet.name + ' (' + subnet.id + ')',
                      }))
                  }
                  multi
                />
              )}
            />
          </div>
          {!values.viewState.disableImageSelection && (
            <div className="sp-margin-m-bottom">
              <FormikFormField
                name="instanceTemplate.bootDiskSpec.diskSpec.imageId"
                label="Image"
                fastField={false}
                required={true}
                input={props => (
                  <ReactSelectInput
                    {...props}
                    isLoading={imageLoading}
                    options={
                      allImages &&
                      allImages.map((img: IYandexImage) => ({
                        value: img.imageId,
                        label: img.imageName + ' (' + img.imageId + ')',
                      }))
                    }
                  />
                )}
              />
            </div>
          )}
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name={'targetSize'}
              fastField={false}
              required={true}
              input={props => <TextInput type="number" min={0} max={100} {...props} />}
              label="Number of Instances"
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              fastField={false}
              label="Traffic"
              name="enableTraffic"
              input={(inputProps: IFormInputProps) => (
                <CheckboxInput text={'Send client requests to new instances'} {...inputProps} />
              )}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="stack"
              label="Stack"
              input={props => <TextInput {...props} />}
              help={<HelpField id="aws.serverGroup.stack" />}
            />
          </div>
          <div className="sp-margin-m-bottom">
            <FormikFormField
              name="freeFormDetails"
              label="Detail"
              input={props => <TextInput {...props} />}
              help={<HelpField id="aws.serverGroup.detail" />}
            />
          </div>

          {!values.viewState.disableStrategySelection && values.selectedProvider && (
            // todo: поменять на YandexDeploymentStrategySelector.tsx
            <DeploymentStrategySelector
              command={values}
              onFieldChange={this.onStrategyFieldChange}
              onStrategyChange={this.strategyChanged}
            />
          )}
          <TaskReason reason={values.reason} onChange={this.handleReasonChanged} />
        </div>
      </div>
    );
  }

  public validate(values: IYandexServerGroupCommand) {
    const errors = {} as FormikErrors<IYandexServerGroupCommand>;

    if (values.stack && !values.stack.match(/^[a-zA-Z0-9]*$/)) {
      errors.stack = 'Stack can only contain letters and numbers.';
    }
    if (values.freeFormDetails && !values.freeFormDetails.match(/^[a-zA-Z0-9-]*$/)) {
      errors.freeFormDetails = 'Detail can only contain letters, numbers, and dashes.';
    }
    return errors;
  }
}
