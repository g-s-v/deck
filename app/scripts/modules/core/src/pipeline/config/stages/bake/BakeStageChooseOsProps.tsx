import { IBaseOsOption } from 'core/pipeline/config/stages/bake/bakeStageChooseOs.component';

export interface IBakeStageChooseOsProps {
  model: any;
  baseOsOptions: IBaseOsOption[];
  onChange: () => any;
}
