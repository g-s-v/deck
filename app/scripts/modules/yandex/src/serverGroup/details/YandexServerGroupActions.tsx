import * as React from 'react';

import { Dropdown } from 'react-bootstrap';
import { filter, find, get, orderBy } from 'lodash';

import {
  ConfirmationModalService,
  IConfirmationModalParams,
  IServerGroupActionsProps,
  IServerGroupJob,
  ReactInjector,
  ServerGroupWarningMessageService,
} from '@spinnaker/core';

import { IYandexServerGroup } from 'yandex/domain';
import { YandexServerGroupCommandBuilder } from 'yandex/serverGroup/configure/serverGroup.commandBuilder';
import { YandexServerGroupWizard } from 'yandex/serverGroup/configure';

export interface IYandexServerGroupActionsProps extends IServerGroupActionsProps {
  serverGroup: IYandexServerGroup;
}

export interface ICloudFoundryServerGroupJob extends IServerGroupJob {
  serverGroupId: string;
}

export class YandexServerGroupActions extends React.Component<IYandexServerGroupActionsProps> {
  private isEnableLocked(): boolean {
    if (this.props.serverGroup.isDisabled) {
      const resizeTasks = (this.props.serverGroup.runningTasks || []).filter(task =>
        get(task, 'execution.stages', []).some(stage => stage.type === 'resizeServerGroup'),
      );
      if (resizeTasks.length) {
        return true;
      }
    }
    return false;
  }

  private isRollbackEnabled(): boolean {
    return !this.props.serverGroup.isDisabled;
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

    // CloudFoundryRollbackServerGroupModal.show({
    //   serverGroup,
    //   previousServerGroup,
    //   disabledServerGroups: disabledServerGroups.sort((a, b) => b.name.localeCompare(a.name)),
    //   allServerGroups: allServerGroups.sort((a, b) => b.name.localeCompare(a.name)),
    //   application: app,
    // });
  };

  private resizeServerGroup = (): void => {
    //   const { app, serverGroup } = this.props;
    //   CloudFoundryResizeServerGroupModal.show({ application: app, serverGroup });
  };

  // private mapServerGroupToLoadBalancers = (): void => {
  //   const { app, serverGroup } = this.props;
  //   CloudFoundryMapLoadBalancersModal.show({ application: app, serverGroup });
  // };
  //
  // private unmapServerGroupFromLoadBalancers = (): void => {
  //   const { app, serverGroup } = this.props;
  //   CloudFoundryUnmapLoadBalancersModal.show({ application: app, serverGroup });
  // };
  //
  private cloneServerGroup = (): void => {
    const { app, serverGroup } = this.props;
    YandexServerGroupWizard.show({
      application: app,
      command: YandexServerGroupCommandBuilder.buildServerGroupCommandFromExisting(app, serverGroup),
      title: `Clone ${serverGroup.name}`,
    });
  };

  public render(): JSX.Element {
    // const { app, serverGroup } = this.props;
    const { serverGroup } = this.props;
    // const { loadBalancers } = serverGroup;

    return (
      <Dropdown className="dropdown" id="server-group-actions-dropdown">
        <Dropdown.Toggle className="btn btn-sm btn-primary dropdown-toggle">Server Group Actions</Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu">
          {!serverGroup.isDisabled && (
            <li>
              <a className="clickable" onClick={this.rollbackServerGroup}>
                Rollback
              </a>
            </li>
          )}
          {!serverGroup.isDisabled && (
            <li>
              <a className="clickable" onClick={this.resizeServerGroup}>
                Resize
              </a>
            </li>
          )}
          {!serverGroup.isDisabled && (
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
          {/*{!serverGroup.isDisabled && <li>*/}
          {/*  <a className="clickable" onClick={this.mapServerGroupToLoadBalancers}>Map Load Balancer</a>*/}
          {/*</li>}*/}
          {/*{!serverGroup.isDisabled && loadBalancers && !!loadBalancers.length && (*/}
          {/*  <li>*/}
          {/*    <a className="clickable" onClick={this.unmapServerGroupFromLoadBalancers}>*/}
          {/*      Unmap Load Balancer*/}
          {/*    </a>*/}
          {/*  </li>*/}
          {/*)}*/}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}
