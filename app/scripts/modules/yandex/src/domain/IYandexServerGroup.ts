import { IInstance, IServerGroup } from '@spinnaker/core';
import { IYandexLoadBalancer } from './IYandexLoadBalancer';

export interface ICpuUtilizationRule {
  utilizationTarget: number;
}

export interface ICustomRule {
  metricName: string;
  target: number;
  metricType: any;
  ruleType: any;
}

export interface IAutoScalePolicy {
  minZoneSize: number;
  maxSize: number;
  measurementDuration: number;
  warmupDuration: number;
  stabilizationDuration: number;
  initialSize: number;
  cpuUtilizationRule: ICpuUtilizationRule;
  customRules: ICustomRule[];
}

export interface IDeployPolicy {
  maxUnavailable: number;
  maxExpansion: number;
  maxDeleting: number;
  maxCreating: number;
  startupDuration: number;
}

export interface ISchedulingPolicy {
  preemptible: boolean;
}

export interface IResourcesSpec {
  memory: number;
  cores: number;
  coreFraction: number;
  gpus: number;
}

export interface IDiskSpec {
  description: string;
  typeId: string;
  size: number;
  imageId: string;
  snapshotId: string;
}

export interface IAttachedDiskSpec {
  mode: any;
  deviceName: string;
  diskSpec: IDiskSpec;
}

export interface IPrimaryAddressSpec {
  oneToOneNat: boolean;
}

export interface INetworkInterfaceSpec {
  networkId: string;
  subnetIds: string[];
  primaryV4AddressSpec?: IPrimaryAddressSpec;
  primaryV6AddressSpec?: IPrimaryAddressSpec;
}

export interface IInstanceTemplate {
  description: string;
  labels?: { [key: string]: string };
  platformId: string;
  resourcesSpec: IResourcesSpec;
  metadata?: { [key: string]: string };
  bootDiskSpec: IAttachedDiskSpec;
  secondaryDiskSpecs: IAttachedDiskSpec[];
  networkInterfaceSpecs: INetworkInterfaceSpec[];
  schedulingPolicy: ISchedulingPolicy;
  serviceAccountId: string;
}

export interface ILoadBalancerIntegration {
  targetGroupId: string;
  statusMessage: string;
  targetGroupSpec: ITargetGroupSpec;
  balancers: IYandexLoadBalancer[];
}

export interface ITargetGroupSpec {
  name: string;
  description: string;
  labels?: { [key: string]: string };
}

export interface IHealthCheckSpec {
  type: any;
  port: number;
  path: string;
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export interface IYandexInstance extends IInstance {
  labels?: { [key: string]: string };
  // loadBalancers?: string[];
  // serverGroup?: string;
}

export interface IYandexServerGroup extends IServerGroup {
  id: string;
  folder: string;
  zones: string[];
  description: string;
  serviceAccountId: string;
  autoScalePolicy: IAutoScalePolicy;
  deployPolicy: IDeployPolicy;
  status: any;
  instanceTemplate: IInstanceTemplate;

  instances: IYandexInstance[];
  loadBalancerIntegration: ILoadBalancerIntegration;
  loadBalancersWithHealthChecks?: { [key: string]: IHealthCheckSpec[] };
  healthCheckSpecs?: IHealthCheckSpec[];
}
