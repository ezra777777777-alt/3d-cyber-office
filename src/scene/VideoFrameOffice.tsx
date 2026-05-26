import { VideoFrameOfficeEnvironment } from './VideoFrameOfficeEnvironment';
import { VideoFrameFurnitureLayer } from './VideoFrameFurnitureLayer';
import { VideoFrameAgentLayer } from './VideoFrameAgentLayer';
import { VideoGradeCommanderZone } from './VideoGradeCommanderZone';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

export function VideoFrameOffice() {
  return (
    <>
      <color attach="background" args={[VIDEO_GRADE_PALETTE.background]} />
      <fog attach="fog" args={[VIDEO_GRADE_PALETTE.background, 15, 39]} />
      <VideoFrameOfficeEnvironment />
      <VideoFrameFurnitureLayer />
      <VideoGradeCommanderZone />
      <VideoFrameAgentLayer />
    </>
  );
}
