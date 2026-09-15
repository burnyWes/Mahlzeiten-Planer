export function Announcer({ text }: { text: string }) {
  return (
    <p className="announcer" role="status">
      {text}
    </p>
  )
}
