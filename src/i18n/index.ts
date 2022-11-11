import { I18nDict } from "./interface";
import { zhCN } from "./zh-cn";

export function mergeI18n(input: Partial<I18nDict>): I18nDict {
  return {
    ...zhCN,
    ...input,
  }
}
