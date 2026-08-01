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
  /** Set for images, so the report can say which question is affected. */
  usedBy?: ImageUse;
}

/** What the server tells us about an image without sending the body. */
export interface ImageFacts {
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
}

/** Which question an image belongs to, so a drift report can name it. */
export interface ImageUse {
  question: string;
  /** "answer 3", or "question image". */
  role: string;
}

/** A recorded image, as stored in the baseline. */
export interface ImageRecord extends ImageFacts {
  sha256: string;
  bytes: number;
  usedBy?: ImageUse;
  /** Present when we already know this image is wrong and have chosen not to act yet. */
  knownBad?: { reason: string; since: string };
}

export interface SourceRecord {
  pdfUrl: string;
  edition: string;
  updatedAt: string;
  topicCount: number;
}
