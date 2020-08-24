import { FormikProps } from 'formik';

import { FormikFormField, NumberInput, SelectInput, TextInput } from '@spinnaker/core';
import { IHealthCheckSpec } from 'yandex/domain';
import * as React from 'react';
import { FormikProps } from 'formik';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import _ from 'lodash';

export interface IHealthCheckProps {
  fieldName: string;
  formik: FormikProps<IYandexServerGroupCommand>;
}

export interface IHealthCheckState {
  healthCheckSpecs: IHealthCheckSpec[];
}

export class HealthChecks extends React.Component<IHealthCheckProps, IHealthCheckState> {
  constructor(props: IHealthCheckProps) {
    super(props);
    this.state = { healthCheckSpecs: _.get(props.formik.values, props.fieldName) as IHealthCheckSpec[] };
  }

  private removeHeathCheck = (index: number) => {
    this.state.healthCheckSpecs.splice(index, 1);
    this.updateField();
  };

  private addHealthCheck = () => {
    this.state.healthCheckSpecs.push({
      type: 'HTTP',
      port: 80,
      path: '/ping',
      interval: 5,
      timeout: 4,
      unhealthyThreshold: 6,
      healthyThreshold: 2,
    } as IHealthCheckSpec);
    this.forceUpdate();
  };

  private updateField = () => {
    this.props.formik.setFieldValue(this.props.fieldName, this.state.healthCheckSpecs);
    this.forceUpdate();
  };

  public render() {
    const { fieldName } = this.props;
    const { healthCheckSpecs } = this.state;

    return (
      <div className="form-group">
        <div className="col-md-11">
          <table className="table table-condensed packed">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Port</th>
                <th>Path</th>
                <th>Periods</th>
                <th>Thresholds</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {healthCheckSpecs.map((spec, index) => (
                <tr>
                  <td>
                    <FormikFormField
                      name={fieldName + '[' + index + '].type'}
                      required={true}
                      layout={({ input }) => <>{input}</>}
                      onChange={() => {
                        this.forceUpdate();
                      }}
                      input={props => <SelectInput {...props} options={['HTTP', 'TCP']} />}
                    />
                  </td>
                  <td>
                    <FormikFormField
                      name={fieldName + '[' + index + '].port'}
                      required={true}
                      layout={({ input }) => <>{input}</>}
                      input={props => <NumberInput {...props} min={1} max={65534} />}
                    />
                  </td>
                  <td>
                    {spec.type.indexOf('HTTP') === 0 && (
                      <FormikFormField
                        name={fieldName + '[' + index + '].path'}
                        layout={({ input }) => <>{input}</>}
                        input={props => <TextInput {...props} />}
                        required={true}
                      />
                    )}
                    {spec.type.indexOf('HTTP') !== 0 && <span>n/a</span>}
                  </td>
                  <td>
                    <FormikFormField
                      name={fieldName + '[' + index + '].interval'}
                      layout={({ input }) => <>Interval (sec) {input}</>}
                      input={props => <TextInput type="number" {...props} />}
                      required={true}
                    />
                    <FormikFormField
                      name={fieldName + '[' + index + '].timeout'}
                      layout={({ input }) => <>Timeout (sec) {input}</>}
                      input={props => <TextInput type="number" {...props} />}
                      required={true}
                    />
                  </td>
                  <td>
                    <FormikFormField
                      name={fieldName + '[' + index + '].unhealthyThreshold'}
                      layout={({ input }) => <>Unhealthy {input}</>}
                      input={props => <TextInput {...props} />}
                      required={true}
                    />
                    <FormikFormField
                      name={fieldName + '[' + index + '].healthyThreshold'}
                      layout={({ input }) => <>Healthy {input}</>}
                      input={props => <TextInput {...props} />}
                      required={true}
                    />
                  </td>
                  <td>
                    <a
                      className="btn btn-link sm-label"
                      style={{ marginTop: 0 }}
                      onClick={() => this.removeHeathCheck(index)}
                    >
                      <span className="glyphicon glyphicon-trash" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <a className="btn btn-block btn-sm add-new" onClick={this.addHealthCheck}>
                    <span className="glyphicon glyphicon-plus-sign" /> Add new health check
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }
}
