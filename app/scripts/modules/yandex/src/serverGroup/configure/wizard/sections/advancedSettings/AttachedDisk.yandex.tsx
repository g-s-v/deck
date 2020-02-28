import { FormikProps } from 'formik';
import { IYandexServerGroupCommand } from 'yandex/domain/configure/IYandexServerGroupCommand';
import { FormikFormField, ReactSelectInput, TextInput } from 'core/presentation';
import * as React from 'react';
import { IAttachedDiskSpec } from 'yandex/domain';
import { IYandexImage } from 'yandex/image';

export interface IYandexServerGroupConfigurationDisksProps {
  formik: FormikProps<IYandexServerGroupCommand>;
  showImageSourceSelector: boolean;
  imageLoading: boolean;
  allImages: IYandexImage[];
}

export class YandexServerGroupConfigurationDisks extends React.Component<IYandexServerGroupConfigurationDisksProps> {
  private removeSecondaryDisk = (index: number) => {
    this.props.formik.values.instanceTemplate.secondaryDiskSpecs.splice(index, 1);
    this.forceUpdate();
  };

  private addSecondaryDisk = () => {
    if (!this.props.formik.values.instanceTemplate.secondaryDiskSpecs) {
      this.props.formik.values.instanceTemplate.secondaryDiskSpecs = [];
    }
    this.props.formik.values.instanceTemplate.secondaryDiskSpecs.push({
      mode: 'READ_WRITE',
      diskSpec: {
        description: '',
        size: 10,
        typeId: 'network-hdd',
      },
    } as IAttachedDiskSpec);
    this.forceUpdate();
  };

  public render(): JSX.Element {
    const { showImageSourceSelector, formik, imageLoading, allImages } = this.props;
    return (
      <table className="table table-condensed packed">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Device name</th>
            <th style={{ width: '20%' }}>Type</th>
            <th>Size (GB)</th>
            <th style={{ width: '40%' }}>Image</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <FormikFormField
                name={'instanceTemplate.bootDiskSpec.deviceName'}
                layout={({ input }) => <>{input}</>}
                input={props => <TextInput {...props} />}
              />
            </td>
            <td>
              <FormikFormField
                name={'instanceTemplate.bootDiskSpec.diskSpec.typeId'}
                required={true}
                layout={({ input }) => <>{input}</>}
                input={props => <ReactSelectInput {...props} stringOptions={['network-ssd', 'network-hdd']} />}
              />
            </td>
            <td>
              <FormikFormField
                name={'instanceTemplate.bootDiskSpec.diskSpec.size'}
                required={true}
                layout={({ input }) => <>{input}</>}
                input={props => <TextInput type="number" min={1} {...props} />}
              />
            </td>
            <td>
              <p className="small" style={{ margin: 0 }}>
                This boot-disk will use the image{' '}
                {showImageSourceSelector
                  ? "inferred from this pipeline's execution context."
                  : 'selected at the top of this dialogue.'}
              </p>
            </td>
          </tr>
          {formik.values.instanceTemplate.secondaryDiskSpecs?.map((_, index) => (
            <tr>
              <td>
                <FormikFormField
                  name={'instanceTemplate.secondaryDiskSpecs[' + index + '].deviceName'}
                  layout={({ input }) => <>{input}</>}
                  input={props => <TextInput {...props} />}
                />
              </td>
              <td>
                <FormikFormField
                  name={'instanceTemplate.secondaryDiskSpecs[' + index + '].diskSpec.typeId'}
                  required={true}
                  layout={({ input }) => <>{input}</>}
                  input={props => <ReactSelectInput {...props} stringOptions={['network-ssd', 'network-hdd']} />}
                />
              </td>
              <td>
                <FormikFormField
                  name={'instanceTemplate.secondaryDiskSpecs[' + index + '].diskSpec.size'}
                  layout={({ input }) => <>{input}</>}
                  required={true}
                  input={props => <TextInput type="number" min={1} {...props} />}
                />
              </td>
              <td>
                <FormikFormField
                  name={'instanceTemplate.secondaryDiskSpecs[' + index + '].diskSpec.imageId'}
                  layout={({ input }) => <>{input}</>}
                  input={props => (
                    <ReactSelectInput
                      {...props}
                      isLoading={imageLoading}
                      options={
                        allImages &&
                        allImages.map((img: IYandexImage) => ({
                          value: img.imageId,
                          label: img.imageName + ' (' + img.imageId + ')',
                        }))
                      }
                    />
                  )}
                />
              </td>
              <td>
                <a
                  className="btn btn-link sm-label"
                  style={{ marginTop: 0 }}
                  onClick={() => this.removeSecondaryDisk(index)}
                >
                  <span className="glyphicon glyphicon-trash" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>
              <a className="btn btn-block btn-sm add-new" onClick={this.addSecondaryDisk}>
                <span className="glyphicon glyphicon-plus-sign" /> Add New Secondary Disk
              </a>
            </td>
          </tr>
        </tfoot>
      </table>
    );
  }
}
