import snarkdown from 'snarkdown';
import dompurify from 'dompurify';

// Sanitize *after* rendering markdown: snarkdown turns text into HTML, so
// sanitizing first would let markdown re-introduce unsafe markup.
export const rawMarkup = (data: string) => ({ __html: dompurify.sanitize(snarkdown(data)) });
