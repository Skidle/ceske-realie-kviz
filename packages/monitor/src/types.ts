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

/** What the server tells us about an image without sending the body. */
export interface ImageFacts {
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
}

/** A recorded image, as stored in the baseline. */
export interface ImageRecord extends ImageFacts {
  sha256: string;
  bytes: number;
  /** Present when we already know this image is wrong and have chosen not to act yet. */
  knownBad?: { reason: string; since: string };
}

export interface SourceRecord {
  pdfUrl: string;
  edition: string;
  updatedAt: string;
  topicCount: number;
}
