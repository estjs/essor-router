export type ParamParserType = 'int' | 'bool' | string;

export interface DefinePageQueryParamOptions<T = unknown> {
  queryKey?: string;
  parser?: ParamParserType;
  default?: (() => T) | T;
  format?: 'value' | 'array';
  required?: boolean;
}
