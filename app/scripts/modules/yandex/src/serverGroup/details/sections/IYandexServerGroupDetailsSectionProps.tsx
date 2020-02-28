import { IServerGroupDetailsSectionProps } from 'core/serverGroup';
import { IYandexServerGroup } from 'yandex/domain';

export interface IYandexServerGroupDetailsSectionProps extends IServerGroupDetailsSectionProps {
  serverGroup: IYandexServerGroup;
}
