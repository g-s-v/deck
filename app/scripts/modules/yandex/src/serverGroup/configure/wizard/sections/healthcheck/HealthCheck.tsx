import { FormikProps } from 'formik';

import { FormikFormField, NumberInput, SelectInput, TextInput } from '@spinnaker/core';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { IHealthCheckSpec } from 'yandex/domain';
import * as React from 'react';

export interface IHealthCheckProps {
  formik: FormikProps<IYandexServerGroupCommand>;
}

export class HealthCheck extends React.Component<IHealthCheckProps> {
  private removeHeathCheck = (index: number) => {
    this.props.formik.values.healthCheckSpecs.splice(index, 1);
    this.forceUpdate();
  };

  private addHealthCheck = () => {
    if (!this.props.formik.values.healthCheckSpecs) {
      this.props.formik.values.healthCheckSpecs = [];
    }
    this.props.formik.values.healthCheckSpecs.push({
      type: 'HTTP',
      port: 80,
      path: '/ping',
      interval: 5,
      timeout: 5,
      unhealthyThreshold: 6,
      healthyThreshold: 2,
    } as IHealthCheckSpec);
    this.forceUpdate();
  };

  public render() {
    const { formik } = this.props;

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
              {formik.values.healthCheckSpecs?.map((_, index) => (
                <tr>
                  <td>
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].type'}
                      required={true}
                      layout={({ input }) => <>{input}</>}
                      input={props => <SelectInput {...props} options={['HTTP', 'TCP']} />}
                    />
                  </td>
                  <td>
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].port'}
                      required={true}
                      layout={({ input }) => <>{input}</>}
                      input={props => <NumberInput {...props} min={1} max={65534} />}
                    />
                  </td>
                  <td>
                    {formik.values.healthCheckSpecs[index].type.indexOf('HTTP') === 0 && (
                      <FormikFormField
                        name={'healthCheckSpecs[' + index + '].path'}
                        layout={({ input }) => <>{input}</>}
                        input={props => <TextInput {...props} />}
                        required={true}
                      />
                    )}
                    {formik.values.healthCheckSpecs[index].type.indexOf('HTTP') !== 0 && <span>n/a</span>}
                  </td>
                  <td>
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].interval'}
                      layout={({ input }) => <>Interval (sec) {input}</>}
                      input={props => <TextInput type="number" {...props} />}
                      required={true}
                    />
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].timeout'}
                      layout={({ input }) => <>Timeout (sec) {input}</>}
                      input={props => <TextInput type="number" {...props} />}
                      required={true}
                    />
                  </td>
                  <td>
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].unhealthyThreshold'}
                      layout={({ input }) => <>Unhealthy {input}</>}
                      input={props => <TextInput {...props} />}
                      required={true}
                    />
                    <FormikFormField
                      name={'healthCheckSpecs[' + index + '].healthyThreshold'}
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
