interface SpeakerGridProps {
  rows: number;
  cols: number;
}

export default function SpeakerGrid({ rows, cols }: SpeakerGridProps) {
  const dots = Array.from({ length: rows * cols });

  return (
    <div
      className="grid h-24 gap-1 rounded-md bg-gray-600 p-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {dots.map((_, index) => (
        <div
          key={index}
          className="m-auto size-2 rounded-full bg-gray-950 shadow-inner"
        ></div>
      ))}
    </div>
  );
}
