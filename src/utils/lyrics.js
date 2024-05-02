export function lyricParser(lrc) {
  return {
    lyric: parseLyric(lrc?.lrc?.lyric || ''),
    tlyric: parseLyric(lrc?.tlyric?.lyric || ''),
    romalyric: parseLyric(lrc?.romalrc?.lyric || ''),
    lyricuser: lrc.lyricUser,
    transuser: lrc.transUser,
  };
}

function generateYrc(lyric) {
  let yrc = [];
  console.log(lyric);
  for (let i = 0; i < lyric.length; i++) {
    let { time, content } = lyric[i];
    let { time: nextTime } = lyric[i + 1] || {
      time: time + 5,
      content: '',
    };
    let yrcContent = '';
    const splitedContent = content.split(' ');
    for (let j = 0; j < splitedContent.length; j++) {
      yrcContent += `(${Math.round(
        time * 1000 + ((nextTime - time) * 1000 * j) / splitedContent.length
      )},${Math.round(((nextTime - time) * 1000) / splitedContent.length)},0)${
        splitedContent[j]
      } `;
    }
    yrcContent = `[${Math.round(time * 1000)},${Math.round(
      time * 1000
    )}]${yrcContent}`;
    yrc.push(yrcContent);
  }
  return yrc;
  // eslint-disable-next-line no-unused-vars, no-unreachable
  const test = [
    '[25.087,25.087](25.087,180.47170990706644,0)K(125.…4122453908515,0)a(4025.087,121.88573086884546,0)r',
    '[28.094,28.094](28.094,199.30756330243378,0)I(128.…3251135817682,0)a(3428.094,184.61848286289535,0)h',
    '[33.065,33.065](33.065,103.77901253260806,0)I(133.…7718278466556,0)a(4133.065,129.68323484834522,0)m',
  ];
  // return [
  //   "[53980,4860](53980,60,0)I(54040,150,0)’(54190,90,0…750,0)body's (57760,360,0)had (58120,720,0)enough",
  //   '[58960,4920](58960,2460,0)Oh(61420,360,0), (61780,… (63010,210,0)old (63220,540,0)love(63760,120,0)）',
  //   '[63880,4710](63880,2160,0)Oh(66040,490,0), (66530,…me (67900,240,0)old (68140,450,0)love(68590,0,0)）',
  //   "[68590,4950](68590,30,0)I(68620,240,0)’(68860,90,0…,180,0)I've (72400,450,0)blown (72850,690,0)apart",
  //   '[73540,5010](73540,90,0)I(73630,150,0)’(73780,120,…390,0)breaks (77680,240,0)your (77920,630,0)heart',
  // ];
}

export function lyricByWordParser(lrc) {
  var temp = parseByWordLyric(lrc?.yrc?.lyric || '');
  if (temp.length === 1 && temp[0] === '') {
    temp = generateYrc(parseLyric(lrc?.lrc?.lyric || ''));
  }
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
// eslint-disable-next-line no-unused-vars
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
