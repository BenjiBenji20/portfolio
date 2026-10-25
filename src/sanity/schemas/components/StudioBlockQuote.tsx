import type { BlockStyleProps } from 'sanity';

export function StudioBlockQuote(props: BlockStyleProps) {
  return (
    <blockquote
      style={{
        borderLeft: '3px solid #38bdf8',
        paddingLeft: '1rem',
        margin: '0.75rem 0',
        fontStyle: 'italic',
      }}
    >
      {props.children}
    </blockquote>
  );
}
