import { VideoGradeCharacters } from './VideoGradeCharacters';
import { VideoGradeMissionStateLayer } from './VideoGradeMissionStateLayer';

export function VideoFrameAgentLayer() {
  return (
    <group>
      <VideoGradeCharacters />
      <VideoGradeMissionStateLayer />
    </group>
  );
}
