import { IArtifact, IServerGroupCommand } from '@spinnaker/core';
import { IAutoScalePolicy, IDeployPolicy, IHealthCheckSpec, IInstanceTemplate, ITargetGroupSpec } from 'yandex/domain';

export interface IYandexServerGroupCommand extends IServerGroupCommand {
  imageSource: string;
  applicationArtifact?: IYandexArtifact;
  zones: string[];
  targetSize: number;
  serviceAccountId: string;
  autoScalePolicy: IAutoScalePolicy;
  deployPolicy: IDeployPolicy;
  instanceTemplate: IInstanceTemplate;
  targetGroupSpec: ITargetGroupSpec;
  enableTraffic: boolean;
  balancers?: { [key: string]: IHealthCheckSpec[] };
  healthCheckSpecs: IHealthCheckSpec[];
  labels?: { [key: string]: string };
}

export interface IYandexArtifact {
  artifact?: IArtifact;
  artifactId?: string;
}
