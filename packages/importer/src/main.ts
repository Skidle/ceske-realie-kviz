// Entry point. Nothing but the exit, so cli.ts stays importable from a test.
import { fetchPictures } from './cli.ts';

process.exit(await fetchPictures());
