export const parseQueryParam = (param: string): string | number | boolean => {
  if (param === 'true' || param === 'false') {
    return param === 'true';
  }
  try {
    return JSON.parse(param);
  } catch (e) {}
  return param;
};

type DefaultParseAllParamsResponseType = {
  [key: string]: string | number | boolean | (string | number | boolean)[];
};

export const parseAndConvertAllParams = <
  T = DefaultParseAllParamsResponseType
>(params: {
  [key: string]: string | string[] | undefined | Object;
}): T =>
  Object.keys(params).reduce((aggregateParams, key) => {
    if (Array.isArray(params[key])) {
      aggregateParams[key] = (params[key] as string[]).map((qp) =>
        parseQueryParam(qp)
      );
    } else {
      aggregateParams[key] = parseQueryParam(params[key] as string);
    }
    return aggregateParams;
  }, {} as any);

export const trimQueryParametersOffOfRelativePath = (url: string) =>
  url.replace(/\?.*$/i, '');
