import { Fragment, type CSSProperties } from 'react';

/** Apparition mot par mot ; chaque ligne est séparée par un <br />. */
export function SplitWords({ lines, delay = 0 }: { lines: string[]; delay?: number }) {
  let index = 0;
  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {line.split(' ').map((word, wordIndex) => {
            const style = { '--word-index': index, '--word-delay': `${delay}ms` } as CSSProperties;
            index += 1;
            return (
              <Fragment key={wordIndex}>
                {wordIndex > 0 && ' '}
                <span className="split-word" style={style}>{word}</span>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
