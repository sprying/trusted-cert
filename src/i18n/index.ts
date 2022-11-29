import { I18nDict, I18nDictModifier } from './interface';
import { zhCN } from './zh-cn';

export function mergeI18n(input: I18nDictModifier): I18nDict {
  return {
    ...zhCN,
    ...input,
  };
}
