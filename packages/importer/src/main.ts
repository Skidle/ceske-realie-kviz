// Entry point. Nothing but the exit, so cli.ts stays importable from a test.
import { fetchPictures, importQuestions } from './cli.ts';

process.exit(await (process.argv.includes('--pictures') ? fetchPictures() : importQuestions()));
