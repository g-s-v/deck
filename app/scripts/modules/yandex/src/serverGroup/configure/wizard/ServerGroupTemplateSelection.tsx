import { Application, DeployInitializer, ITemplateSelectionText } from '@spinnaker/core';

import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import * as React from 'react';

export interface IServerGroupTemplateSelectionProps {
  app: Application;
  command: IYandexServerGroupCommand;
  onDismiss: () => void;
  onTemplateSelected: () => void;
}

export interface IServerGroupTemplateSelectionState {
  templateSelectionText: ITemplateSelectionText;
}

export class ServerGroupTemplateSelection extends React.Component<
  IServerGroupTemplateSelectionProps,
  IServerGroupTemplateSelectionState
> {
  constructor(props: IServerGroupTemplateSelectionProps) {
    super(props);
    this.state = {
      templateSelectionText: {
        copied: [
          'network, subnets, cluster name (stack, details)',
          'load balancers',
          'instance template',
          'all fields on the Advanced Settings page',
        ],
        notCopied: [],
        additionalCopyText: '',
      },
    };
  }

  public render() {
    const { app, command, onDismiss, onTemplateSelected } = this.props;
    const { templateSelectionText } = this.state;

    return (
      <DeployInitializer
        cloudProvider="yandex"
        application={app}
        command={command}
        onDismiss={onDismiss}
        onTemplateSelected={onTemplateSelected}
        templateSelectionText={templateSelectionText}
      />
    );
  }
}
