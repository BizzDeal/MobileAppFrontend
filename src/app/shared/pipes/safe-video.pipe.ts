import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeVideo',
  standalone: true
})
export class SafeVideoPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined, play: boolean = false): SafeResourceUrl | null {
    if (!url) return null;

    let embedUrl = url;

    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      // Add autoplay=1 if play is true, and mute=1 so it can autoplay without user interaction block
      const autoplayParam = play ? '&autoplay=1&mute=1' : '&autoplay=0&mute=1';
      embedUrl = `https://www.youtube.com/embed/${ytMatch[2]}?loop=1&playlist=${ytMatch[2]}${autoplayParam}&controls=0&modestbranding=1&showinfo=0&disablekb=1&rel=0&iv_load_policy=3`;
    } 
    // Instagram
    else if (url.includes('instagram.com')) {
      // Remove query parameters
      const urlWithoutParams = url.split('?')[0];
      // Ensure it ends with /embed
      if (!urlWithoutParams.endsWith('embed') && !urlWithoutParams.endsWith('embed/')) {
        embedUrl = urlWithoutParams.endsWith('/') ? `${urlWithoutParams}embed` : `${urlWithoutParams}/embed`;
      } else {
        embedUrl = urlWithoutParams;
      }
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
