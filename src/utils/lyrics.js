export function lyricParser(lrc) {
  return {
    lyric: parseLyric(lrc?.lrc?.lyric || ''),
    tlyric: parseLyric(lrc?.tlyric?.lyric || ''),
    romalyric: parseLyric(lrc?.romalrc?.lyric || ''),
    lyricuser: lrc.lyricUser,
    transuser: lrc.transUser,
  };
}

export function lyricByWordParser(lrc) {
  return {
    lyric: parseLyric(lrc?.lrc?.lyric || ''),
    tlyric: parseLyric(lrc?.tlyric?.lyric || ''),
    romalyric: parseLyric(lrc?.romalrc?.lyric || ''),
    lyricuser: lrc.lyricUser,
    transuser: lrc.transUser,
    yrc: parseByWordLyric(lrc?.yrc?.lyric || ''),
  };
}

// regexr.com/6e52n
const extractLrcRegex =
  /^(?<lyricTimestamps>(?:\[.+?\])+)(?!\[)(?<content>.+)$/gm;
const extractTimestampRegex =
  /\[(?<min>\d+):(?<sec>\d+)(?:\.|:)*(?<ms>\d+)*\]/g;

/**
 * @typedef {{time: number, rawTime: string, content: string}} ParsedLyric
 */

/**
 * Parse the lyric string.
 *
 * @param {string} lrc The `lrc` input.
 * @returns {ParsedLyric[]} The parsed lyric.
 * @example parseLyric("[00:00.00] Hello, World!\n[00:00.10] Test\n");
 */
function parseLyric(lrc) {
  /**
   * A sorted list of parsed lyric and its timestamp.
   *
   * @type {ParsedLyric[]}
   * @see binarySearch
   */
  const parsedLyrics = [];

  /**
   * Find the appropriate index to push our parsed lyric.
   * @param {ParsedLyric} lyric
   */
  const binarySearch = lyric => {
    let time = lyric.time;

    let low = 0;
    let high = parsedLyrics.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = parsedLyrics[mid].time;
      if (midTime === time) {
        return mid;
      } else if (midTime < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return low;
  };

  for (const line of lrc.trim().matchAll(extractLrcRegex)) {
    const { lyricTimestamps, content } = line.groups;

    for (const timestamp of lyricTimestamps.matchAll(extractTimestampRegex)) {
      const { min, sec, ms } = timestamp.groups;
      const rawTime = timestamp[0];
      const time = Number(min) * 60 + Number(sec) + Number(ms ?? 0) * 0.001;

      /** @type {ParsedLyric} */
      const parsedLyric = { rawTime, time, content: trimContent(content) };
      parsedLyrics.splice(binarySearch(parsedLyric), 0, parsedLyric);
    }
  }

  return parsedLyrics;
}

/**
 * Parse the by-word lyric string. Simply remove 作词 and 作曲.
 *
 * @param {string} lrc The `yrc` input.
 * @returns {ParsedLyric[]} The parsed lyric.
 * @example parseLyric("[570,990](570,990,0)Roses\n");
 */
function parseByWordLyric(lrc) {
  var parsed_lyric = '';
  // 遍历每一行
  for (const line of lrc.split('\n')) {
    // 如果这一行包含有“作词”或“作曲”字样 或者是空行
    if (line.includes('{"tx":"') || line === '') {
      // 则将这一行移除
      continue;
    } else {
      // 否则将这一行添加到歌词中
      parsed_lyric += line + '\n';
    }
  }
  return parsed_lyric.split('\n');
}

/**
 * @param {string} content
 * @returns {string}
 */
function trimContent(content) {
  let t = content.trim();
  return t.length < 1 ? content : t;
}
