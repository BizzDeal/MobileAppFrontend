import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeVideo',
  standalone: true,
})
export class SafeVideoPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(
    url: string | null | undefined,
    play: boolean = false,
    controls: boolean = true,
    mute: boolean = false
  ): SafeResourceUrl | null {
    if (!url) return null;

    let embedUrl = url;

    // 1. YouTube (Watch, youtu.be, Shorts, /embed/)
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      const videoId = ytMatch[2];
      const autoplayParam = play ? '&autoplay=1' : '&autoplay=0';
      const muteParam = mute ? '&mute=1' : '&mute=0';
      const controlsParam = controls ? '&controls=1' : '&controls=0';
      embedUrl = `https://www.youtube.com/embed/${videoId}?loop=1&playlist=${videoId}${autoplayParam}${muteParam}${controlsParam}&modestbranding=1&showinfo=0&rel=0`;
    }
    // 2. Instagram (Reels & Posts)
    else if (url.includes('instagram.com')) {
      const urlWithoutParams = url.split('?')[0];
      if (!urlWithoutParams.endsWith('embed') && !urlWithoutParams.endsWith('embed/')) {
        embedUrl = urlWithoutParams.endsWith('/') ? `${urlWithoutParams}embed` : `${urlWithoutParams}/embed`;
      } else {
        embedUrl = urlWithoutParams;
      }
    }
    // 3. Vimeo (vimeo.com/ID)
    else if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const vimeoMatch = url.match(vimeoRegExp);
      if (vimeoMatch && vimeoMatch[3]) {
        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=${play ? 1 : 0}&muted=${mute ? 1 : 0}`;
      }
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
