import * as React from 'react';

import { Dropdown } from 'react-bootstrap';
import { filter, find, orderBy } from 'lodash';

import {
  ConfirmationModalService,
  IConfirmationModalParams,
  IServerGroupActionsProps,
  IServerGroupJob,
  ReactInjector,
  ServerGroupWarningMessageService,
} from '@spinnaker/core';

import { IYandexServerGroup } from 'yandex/domain';
import { YandexServerGroupCommandBuilder } from '../configure/serverGroup.commandBuilder';
import { YandexServerGroupWizard } from '../configure';
import { YandexResizeServerGroupModal } from './resize/YandexResizeServerGroupModal';
import { YandexRollbackServerGroupModal } from './rollback/YandexRollbackServerGroupModal';

export interface IYandexServerGroupActionsProps extends IServerGroupActionsProps {
  serverGroup: IYandexServerGroup;
}

export interface ICloudFoundryServerGroupJob extends IServerGroupJob {
  serverGroupId: string;
}

export class YandexServerGroupActions extends React.Component<IYandexServerGroupActionsProps> {
  private isRollbackEnabled(): boolean {
    const { app, serverGroup } = this.props;

    if (!serverGroup.isDisabled) {
      // enabled server groups are always a candidate for rollback
      return true;
    }

    // if the server group selected for rollback is disabled, ensure that at least one enabled server group exists
    return app
      .getDataSource('serverGroups')
      .data.some(
        (g: IYandexServerGroup) =>
          g.cluster === serverGroup.cluster &&
          g.region === serverGroup.region &&
          g.account === serverGroup.account &&
          !g.isDisabled,
      );
  }

  private isTrafficEnabled(): boolean {
    const { serverGroup } = this.props;
    return (
      !serverGroup.isDisabled &&
      serverGroup.loadBalancerIntegration != undefined &&
      serverGroup.loadBalancerIntegration.targetGroupId != ''
    );
  }

  private destroyServerGroup = (): void => {
    const { app, serverGroup } = this.props;

    const taskMonitor = {
      application: app,
      title: 'Destroying ' + serverGroup.name,
    };

    const submitMethod = (params: ICloudFoundryServerGroupJob) => {
      params.serverGroupName = serverGroup.name;
      return ReactInjector.serverGroupWriter.destroyServerGroup(serverGroup, app, params);
    };

    const stateParams = {
      name: serverGroup.name,
      accountId: serverGroup.account,
      region: serverGroup.region,
    };

    const confirmationModalParams = {
      header: 'Really destroy ' + serverGroup.name + '?',
      buttonText: 'Destroy ' + serverGroup.name,
      account: serverGroup.account,
      provider: 'yandex',
      taskMonitorConfig: taskMonitor,
      interestingHealthProviderNames: undefined as string[],
      submitMethod,
      askForReason: true,
      platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
      platformHealthType: 'Yandex',
      onTaskComplete: () => {
        if (ReactInjector.$state.includes('**.serverGroup', stateParams)) {
          ReactInjector.$state.go('^');
        }
      },
    } as IConfirmationModalParams;

    ServerGroupWarningMessageService.addDestroyWarningMessage(app, serverGroup, confirmationModalParams);

    if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
      confirmationModalParams.interestingHealthProviderNames = ['Yandex'];
    }

    ConfirmationModalService.confirm(confirmationModalParams);
  };

  private disableServerGroup = (): void => {
    const { app, serverGroup } = this.props;
    const taskMonitor = {
      application: app,
      title: 'Disabling ' + serverGroup.name,
    };

    const submitMethod = (params: ICloudFoundryServerGroupJob) => {
      params.serverGroupName = serverGroup.name;
      return ReactInjector.serverGroupWriter.disableServerGroup(serverGroup, app.name, params);
    };

    const confirmationModalParams = {
      header: 'Really disable ' + serverGroup.name + '?',
      buttonText: 'Disable ' + serverGroup.name,
      account: serverGroup.account,
      provider: 'yandex',
      interestingHealthProviderNames: undefined as string[],
      taskMonitorConfig: taskMonitor,
      platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
      platformHealthType: 'Yandex',
      submitMethod,
      askForReason: true,
    };

    ServerGroupWarningMessageService.addDisableWarningMessage(app, serverGroup, confirmationModalParams);

    if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
      confirmationModalParams.interestingHealthProviderNames = ['Yandex'];
    }

    ConfirmationModalService.confirm(confirmationModalParams);
  };

  private enableServerGroup = (): void => {
    const { app, serverGroup } = this.props;

    const taskMonitor = {
      application: app,
      title: 'Enabling ' + serverGroup.name,
    };

    const submitMethod = (params: ICloudFoundryServerGroupJob) => {
      params.serverGroupName = serverGroup.name;
      return ReactInjector.serverGroupWriter.enableServerGroup(serverGroup, app, params);
    };

    const confirmationModalParams = {
      header: 'Really enable ' + serverGroup.name + '?',
      buttonText: 'Enable ' + serverGroup.name,
      account: serverGroup.account,
      interestingHealthProviderNames: undefined as string[],
      taskMonitorConfig: taskMonitor,
      platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
      platformHealthType: 'Yandex',
      submitMethod,
      askForReason: true,
    };

    if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
      confirmationModalParams.interestingHealthProviderNames = ['Yandex'];
    }

    ConfirmationModalService.confirm(confirmationModalParams);
  };

  private rollbackServerGroup = (): void => {
    const { app } = this.props;

    let serverGroup: IYandexServerGroup = this.props.serverGroup;
    let previousServerGroup: IYandexServerGroup;
    let allServerGroups = (app.serverGroups.data as IYandexServerGroup[]).filter(
      g => g.cluster === serverGroup.cluster && g.region === serverGroup.region && g.account === serverGroup.account,
    );

    if (serverGroup.isDisabled) {
      // if the selected server group is disabled, it represents the server group that should be _rolled back to_
      previousServerGroup = serverGroup;

      /*
       * Find an existing server group to rollback, prefer the largest enabled server group.
       *
       * isRollbackEnabled() ensures that at least one enabled server group exists.
       */
      serverGroup = orderBy(
        allServerGroups.filter((g: IYandexServerGroup) => g.name !== previousServerGroup.name && !g.isDisabled),
        ['instanceCounts.total', 'createdTime'],
        ['desc', 'desc'],
      )[0] as IYandexServerGroup;
    }

    // the set of all server groups should not include the server group selected for rollback
    allServerGroups = allServerGroups.filter(g => g.name !== serverGroup.name);

    if (allServerGroups.length === 1 && !previousServerGroup) {
      // if there is only one other server group, default to it being the rollback target
      previousServerGroup = allServerGroups[0];
    }
    const cluster = find(app.clusters, {
      name: serverGroup.cluster,
      account: serverGroup.account,
      serverGroups: [],
    });
    const disabledServerGroups: IYandexServerGroup[] = filter(cluster.serverGroups, {
      isDisabled: true,
      region: serverGroup.region,
    }) as IYandexServerGroup[];

    YandexRollbackServerGroupModal.show({
      serverGroup,
      previousServerGroup,
      disabledServerGroups: disabledServerGroups.sort((a, b) => b.name.localeCompare(a.name)),
      allServerGroups: allServerGroups.sort((a, b) => b.name.localeCompare(a.name)),
      application: app,
    });
  };

  private resizeServerGroup = (): void => {
    const { app, serverGroup } = this.props;
    YandexResizeServerGroupModal.show({ application: app, serverGroup });
  };

  private cloneServerGroup = (): void => {
    const { app, serverGroup } = this.props;
    YandexServerGroupWizard.show({
      application: app,
      command: YandexServerGroupCommandBuilder.buildServerGroupCommandFromExisting(app, serverGroup),
      title: `Clone ${serverGroup.name}`,
    });
  };

  public render(): JSX.Element {
    const { serverGroup } = this.props;
    return (
      <Dropdown className="dropdown" id="server-group-actions-dropdown">
        <Dropdown.Toggle className="btn btn-sm btn-primary dropdown-toggle">Server Group Actions</Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu">
          {this.isRollbackEnabled() && (
            <li>
              <a className="clickable" onClick={this.rollbackServerGroup}>
                Rollback
              </a>
            </li>
          )}
          <li>
            <a className="clickable" onClick={this.resizeServerGroup}>
              Resize
            </a>
          </li>
          {this.isTrafficEnabled() && (
            <li>
              <a className="clickable" onClick={this.disableServerGroup}>
                Disable
              </a>
            </li>
          )}
          {serverGroup.isDisabled && (
            <li>
              <a className="clickable" onClick={this.enableServerGroup}>
                Enable
              </a>
            </li>
          )}
          <li>
            <a className="clickable" onClick={this.destroyServerGroup}>
              Destroy
            </a>
          </li>
          <li>
            <a className="clickable" onClick={this.cloneServerGroup}>
              Clone
            </a>
          </li>
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}
