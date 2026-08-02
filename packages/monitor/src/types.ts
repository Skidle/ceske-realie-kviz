/** What a check concluded about one item. */
export type ItemState =
  | 'unchanged'
  /** The source changed. Actionable. */
  | 'changed'
  /** The source removed it. Actionable. */
  | 'missing'
  /** The check itself failed. NOT the same as unchanged. */
  | 'unverified'
  /** Changed, but already recorded as a known problem. Not counted as new. */
  | 'known';

export interface CheckResult {
  name: string;
  state: ItemState;
  detail?: string;
}

export interface SourceRecord {
  pdfUrl: string;
  edition: string;
  updatedAt: string;
  topicCount: number;
}
