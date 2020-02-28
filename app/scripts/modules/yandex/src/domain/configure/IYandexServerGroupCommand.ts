import { IArtifact, IServerGroupCommand } from '@spinnaker/core';
import {
  IAutoScalePolicy,
  IDeployPolicy,
  IHealthCheckSpec,
  IInstanceTemplate,
  ILoadBalancerIntegration,
} from 'yandex/domain';

export interface IYandexServerGroupCommand extends IServerGroupCommand {
  imageSource: string;
  applicationArtifact?: IYandexArtifact;
  zones: string[];
  groupSize: number;
  serviceAccountId: string;
  autoScalePolicy: IAutoScalePolicy; //todo(briginets): support
  deployPolicy: IDeployPolicy;
  instanceTemplate: IInstanceTemplate;
  loadBalancerIntegration: ILoadBalancerIntegration;
  healthCheckSpecs?: IHealthCheckSpec[];
  labels?: { [key: string]: string };
}

export interface IYandexArtifact {
  artifact?: IArtifact;
  artifactId?: string;
}
