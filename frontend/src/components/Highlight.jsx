// Menandai potongan teks yang cocok dengan kata kunci pencarian
export default function Highlight({ text = '', q = '' }) {
  const term = q.trim();
  if (!term) return text;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}
