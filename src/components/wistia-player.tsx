import { useEffect } from "react";

interface WistiaPlayerProps {
  mediaId: string;
  aspect: number;
  className?: string;
  chromeless?: boolean;
}

declare global {
  interface Window {
    _wq?: Array<Record<string, unknown>>;
  }
}

export function WistiaPlayer({ mediaId, aspect, className = "", chromeless = false }: WistiaPlayerProps) {
  useEffect(() => {
    window._wq = window._wq || [];
    window._wq.push({
      id: mediaId,
      options: {
        playbar: !chromeless,
        fullscreenButton: !chromeless,
        volumeControl: !chromeless,
        settingsControl: !chromeless,
        playbackRateControl: !chromeless,
        qualityControl: !chromeless,
      },
    });

    const existing = document.querySelector(`script[data-wistia-id="${mediaId}"]`);
    if (existing) return;
    const script = document.createElement("script");
    script.src = `https://fast.wistia.com/embed/${mediaId}.js`;
    script.async = true;
    script.type = "module";
    script.dataset.wistiaId = mediaId;
    document.head.appendChild(script);
  }, [mediaId, chromeless]);

  const paddingTop = `${(1 / aspect) * 100}%`;

  return (
    <div className={className} style={{ position: "relative" }}>
      <style>{`
        wistia-player[media-id='${mediaId}']:not(:defined){
          background: center/contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch');
          display: block;
          filter: blur(5px);
          padding-top: ${paddingTop};
        }
        ${chromeless ? `
        wistia-player[media-id='${mediaId}'] .w-bpb-wrapper,
        wistia-player[media-id='${mediaId}'] .wistia_playbar,
        wistia-player[media-id='${mediaId}'] [class*="playbar"],
        wistia-player[media-id='${mediaId}'] [class*="bottom-bar"],
        wistia-player[media-id='${mediaId}'] [class*="control-bar"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }` : ""}
      `}</style>
      <wistia-player media-id={mediaId} aspect={String(aspect)} />
    </div>
  );
}
