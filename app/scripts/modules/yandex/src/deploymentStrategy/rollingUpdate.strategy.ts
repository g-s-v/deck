export interface IImageSourceProps {
  command: any;
  imageSources: string[];
  helpFieldKey: string;
  idField: string;
  imageSourceText: string;
  onChange(imageSource: string): void;
}
