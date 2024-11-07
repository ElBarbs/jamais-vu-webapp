import { AudioPlayer } from "react-audio-play";

interface AudioPlayerProps {
  src: string;
}

export default function CustomAudioPlayer({ src }: AudioPlayerProps) {
  return (
    <AudioPlayer
      loop
      src={src}
      color="#02111B"
      sliderColor="#797A9E"
      className="min-w-72 bg-slate-200 p-8 md:min-w-80"
    />
  );
}
