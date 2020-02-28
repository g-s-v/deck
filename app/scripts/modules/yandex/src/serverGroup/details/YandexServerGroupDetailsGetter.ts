import { IPromise } from 'angular';

import { isEmpty } from 'lodash';
import { Observable } from 'rxjs';

import { IServerGroupDetailsProps, ServerGroupReader } from '@spinnaker/core';

import { IYandexServerGroup } from 'yandex/domain';

function extractServerGroupSummary(props: IServerGroupDetailsProps): IPromise<IYandexServerGroup> {
  const { app, serverGroup } = props;
  return app.ready().then(() => {
    const summary: IYandexServerGroup = app.serverGroups.data.find((toCheck: IYandexServerGroup) => {
      return (
        toCheck.name === serverGroup.name &&
        toCheck.account === serverGroup.accountId &&
        toCheck.region === serverGroup.region
      );
    });
    if (!summary) {
      // app.loadBalancers.data.some((loadBalancer: ICloudFoundryLoadBalancer) => {
      //   if (loadBalancer.account === serverGroup.accountId && loadBalancer.region === serverGroup.region) {
      //     return loadBalancer.serverGroups.some(possibleServerGroup => {
      //       if (possibleServerGroup.name === serverGroup.name) {
      //         summary = possibleServerGroup;
      //         return true;
      //       }
      //       return false;
      //     });
      //   }
      //   return false;
      // });
    }
    return summary;
  });
}

export function yandexServerGroupDetailsGetter(
  props: IServerGroupDetailsProps,
  autoClose: () => void,
): Observable<IYandexServerGroup> {
  const { app, serverGroup: serverGroupInfo } = props;
  return new Observable<IYandexServerGroup>(observer => {
    extractServerGroupSummary(props).then(summary => {
      ServerGroupReader.getServerGroup(
        app.name,
        serverGroupInfo.accountId,
        serverGroupInfo.region,
        serverGroupInfo.name,
      ).then((serverGroup: IYandexServerGroup) => {
        // it's possible the summary was not found because the clusters are still loading
        Object.assign(serverGroup, summary, { account: serverGroupInfo.accountId });

        if (!isEmpty(serverGroup)) {
          observer.next(serverGroup);
        } else {
          autoClose();
        }
      }, autoClose);
    }, autoClose);
  });
}
