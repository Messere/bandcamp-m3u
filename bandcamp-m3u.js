// ==UserScript==
// @name         Bandcamp playlist link
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Add link that downloads m3u playlist for current bandcamp album
// @author       opensource@aerolit.pl
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isBandcamp = () => {
        const generatorElement = document.head.querySelector("meta[name=generator]");
        return generatorElement && generatorElement.content === 'Bandcamp';
    };

    const isRunningInIframe = () => {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    if (!isBandcamp() || isRunningInIframe()) {
        return;
    }

    const separator = "\n";

    const makeDataURI = (mediatype, contents) =>
        'data:' + mediatype + ',' + encodeURIComponent(contents);

    const makePlaylistLinkElement = (artist, album, text, ext, url, mimeType) => {
        const linkElement = document.createElement('a');
        linkElement.download = artist + ' - ' + album + '.' + ext;
        linkElement.type = mimeType;
        linkElement.href = url;
        linkElement.appendChild(
            document.createTextNode(text)
        );
        return linkElement;
    };

    const makePlaylist = (tracks, trackMaker, header, footerMaker) => {
        return tracks.filter(
            value => value.file && value.file['mp3-128']
        ).reduce((prev, curr, index) =>
            prev + trackMaker(
                Math.round(curr.duration),
                artist,
                curr.title,
                curr.file['mp3-128'],
                index + 1
            ), header) + (footerMaker || (tracks => ''))(tracks);
    };

    const makeM3UPlaylistUrl = (tracks) => {
        const m3uHeader = '#EXTM3U' + separator + separator;
        const makeM3uEntry = function(duration, artist, title, url, position) {
            return '#EXTINF:' + duration + ', ' + artist + ' - ' + title + separator +
                url + separator + separator;
        };

        const m3u = makePlaylist(tracks, makeM3uEntry, m3uHeader);

        return makeDataURI(
            'application/x-mpegURL',
            m3u
        );
    };

    const artist = window.TralbumData.artist;
    const title = window.TralbumData.current.title;
    const tracks = window.TralbumData.trackinfo;

    const titleElement = document.querySelector('h2.trackTitle');
    titleElement.appendChild(document.createElement('br'));
    titleElement.appendChild(
        makePlaylistLinkElement(
            artist,
            title,
            'm3u playlist',
            'm3u',
            makeM3UPlaylistUrl(tracks),
            'application/x-mpegURL'
        )
    );
})();
