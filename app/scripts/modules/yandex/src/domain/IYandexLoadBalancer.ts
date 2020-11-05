import { ILoadBalancer, ILoadBalancerUpsertCommand } from '@spinnaker/core';
import { IYandexServerGroup } from '.';

export interface IYandexLoadBalancer extends ILoadBalancer {
  id: string;
  credentials?: string;
  balancerType: string;
  regionZones?: string[];
  serverGroups: IYandexServerGroup[];
  listeners: IYandexLBListener[];
}

export interface IYandexLBListener {
  name: string;
  port: number;
  targetPort: number;
  protocol: string;
  ipVersion: string;
  address: string;
  subnetId: string;
}

export interface IYandexLoadBalancerUpsertCommand extends ILoadBalancerUpsertCommand {
  lbType: string;
  regionZones?: string[];
  serverGroups: IYandexServerGroup[];
  listeners: IYandexLBListener[];
}
