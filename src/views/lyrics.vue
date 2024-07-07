<template>
  <transition name="slide-up">
    <div
      class="lyrics-page"
      :class="{ 'no-lyric': noLyric }"
      :data-theme="theme"
    >
      <div
        v-if="
          (settings.lyricsBackground === 'blur') |
            (settings.lyricsBackground === 'dynamic')
        "
        class="lyrics-background"
        :class="{
          'dynamic-background': settings.lyricsBackground === 'dynamic',
        }"
      >
        <div
          class="top-right"
          :style="{ backgroundImage: `url(${bgImageUrl})` }"
        />
        <div
          class="bottom-left"
          :style="{ backgroundImage: `url(${bgImageUrl})` }"
        />
      </div>
      <div
        v-if="settings.lyricsBackground === true"
        class="gradient-background"
        :style="{ background }"
      ></div>

      <div class="left-side">
        <div>
          <div v-if="settings.showLyricsTime" class="date">
            {{ date }}
          </div>
          <div class="cover">
            <div class="cover-container">
              <img :src="imageUrl" loading="lazy" />
              <div
                class="shadow"
                :style="{ backgroundImage: `url(${imageUrl})` }"
              ></div>
            </div>
          </div>
          <div class="controls">
            <div class="top-part">
              <div class="track-info">
                <div class="title" :title="currentTrack.name">
                  <router-link
                    v-if="hasList()"
                    :to="`${getListPath()}`"
                    @click.native="toggleLyrics"
                    >{{ currentTrack.name }}
                  </router-link>
                  <span v-else>
                    {{ currentTrack.name }}
                  </span>
                </div>
                <div class="subtitle">
                  <router-link
                    v-if="artist.id !== 0"
                    :to="`/artist/${artist.id}`"
                    @click.native="toggleLyrics"
                    >{{ artist.name }}
                  </router-link>
                  <span v-else>
                    {{ artist.name }}
                  </span>
                  <span v-if="album.id !== 0">
                    -
                    <router-link
                      :to="`/album/${album.id}`"
                      :title="album.name"
                      @click.native="toggleLyrics"
                      >{{ album.name }}
                    </router-link>
                  </span>
                </div>
              </div>
              <div class="top-right">
                <div class="volume-control">
                  <button-icon :title="$t('player.mute')" @click.native="mute">
                    <svg-icon v-show="volume > 0.5" icon-class="volume" />
                    <svg-icon v-show="volume === 0" icon-class="volume-mute" />
                    <svg-icon
                      v-show="volume <= 0.5 && volume !== 0"
                      icon-class="volume-half"
                    />
                  </button-icon>
                  <div class="volume-bar">
                    <vue-slider
                      v-model="volume"
                      :min="0"
                      :max="1"
                      :interval="0.01"
                      :drag-on-click="true"
                      :duration="0"
                      tooltip="none"
                      :dot-size="12"
                    ></vue-slider>
                  </div>
                </div>
                <div class="buttons">
                  <button-icon
                    :title="$t('player.like')"
                    @click.native="likeATrack(player.currentTrack.id)"
                  >
                    <svg-icon
                      :icon-class="
                        player.isCurrentTrackLiked ? 'heart-solid' : 'heart'
                      "
                    />
                  </button-icon>
                  <button-icon
                    :title="$t('contextMenu.addToPlaylist')"
                    @click.native="addToPlaylist"
                  >
                    <svg-icon icon-class="plus" />
                  </button-icon>
                  <!-- <button-icon @click.native="openMenu" title="Menu"
                    ><svg-icon icon-class="more"
                  /></button-icon> -->
                </div>
              </div>
            </div>
            <div class="progress-bar">
              <span>{{ formatTrackTime(player.progress) || '0:00' }}</span>
              <div class="slider">
                <vue-slider
                  v-model="player.progress"
                  :min="0"
                  :max="player.currentTrackDuration"
                  :interval="1"
                  :drag-on-click="true"
                  :duration="0"
                  :dot-size="12"
                  :height="2"
                  :tooltip-formatter="formatTrackTime"
                  :lazy="true"
                  :silent="true"
                ></vue-slider>
              </div>
              <span>{{ formatTrackTime(player.currentTrackDuration) }}</span>
            </div>
            <div class="media-controls">
              <button-icon
                v-show="!player.isPersonalFM"
                :title="
                  player.repeatMode === 'one'
                    ? $t('player.repeatTrack')
                    : $t('player.repeat')
                "
                :class="{ active: player.repeatMode !== 'off' }"
                @click.native="switchRepeatMode"
              >
                <svg-icon
                  v-show="player.repeatMode !== 'one'"
                  icon-class="repeat"
                />
                <svg-icon
                  v-show="player.repeatMode === 'one'"
                  icon-class="repeat-1"
                />
              </button-icon>
              <div class="middle">
                <button-icon
                  v-show="!player.isPersonalFM"
                  :title="$t('player.previous')"
                  @click.native="playPrevTrack"
                >
                  <svg-icon icon-class="previous" />
                </button-icon>
                <button-icon
                  v-show="player.isPersonalFM"
                  title="不喜欢"
                  @click.native="moveToFMTrash"
                >
                  <svg-icon icon-class="thumbs-down" />
                </button-icon>
                <button-icon
                  id="play"
                  :title="$t(player.playing ? 'player.pause' : 'player.play')"
                  @click.native="playOrPause"
                >
                  <svg-icon :icon-class="player.playing ? 'pause' : 'play'" />
                </button-icon>
                <button-icon
                  :title="$t('player.next')"
                  @click.native="playNextTrack"
                >
                  <svg-icon icon-class="next" />
                </button-icon>
              </div>
              <button-icon
                v-show="!player.isPersonalFM"
                :title="$t('player.shuffle')"
                :class="{ active: player.shuffle }"
                @click.native="switchShuffle"
              >
                <svg-icon icon-class="shuffle" />
              </button-icon>
              <button-icon
                v-show="
                  isShowLyricTypeSwitch &&
                  $store.state.settings.showLyricsTranslation &&
                  lyricType === 'translation'
                "
                :title="$t('player.translationLyric')"
                @click.native="switchLyricType"
              >
                <span class="lyric-switch-icon">译</span>
              </button-icon>
              <button-icon
                v-show="
                  isShowLyricTypeSwitch &&
                  $store.state.settings.showLyricsTranslation &&
                  lyricType === 'romaPronunciation'
                "
                :title="$t('player.PronunciationLyric')"
                @click.native="switchLyricType"
              >
                <span class="lyric-switch-icon">音</span>
              </button-icon>
              <button-icon
                v-show="
                  isShowLyricTypeSwitch &&
                  $store.state.settings.showLyricsTranslation &&
                  lyricType === 'both'
                "
                :title="
                  $t('player.PronunciationLyric') &
                  $t('player.translationLyric')
                "
                @click.native="switchLyricType"
              >
                <span class="lyric-switch-icon">全</span>
              </button-icon>
            </div>
          </div>
        </div>
      </div>
      <div class="right-side">
        <transition name="slide-fade">
          <div
            v-show="!noLyric"
            ref="lyricsContainer"
            class="lyrics-container"
            :style="lyricFontSize"
          >
            <div id="line-1" class="line"></div>
            <div
              v-for="(line, index) in lyricToShow"
              :id="`line${index}`"
              :key="index"
              class="line"
              :duration="`${
                line.time - lyricToShow[Math.max(0, index - 1)].time
              }s`"
              :start="`${line.time}`"
              :style="{
                animation: `highlighting ${
                  line.time - lyricToShow[Math.max(0, index - 1)].time
                }s linear`,
                display:
                  line.content === '● ● ●' && playerTime >= lyricToShow[1].time
                    ? 'none'
                    : 'block',
              }"
              :class="{
                highlight: highlightLyricIndex === index,
                bouncingFadeOut:
                  line.content === '● ● ●' &&
                  playerTime >= lyricToShow[1].time - 0.7,
              }"
              @click="clickLyricLine(line.time)"
              @dblclick="clickLyricLine(line.time, true)"
            >
              <div
                :ref="`lyricLineSpan-${index}`"
                v-intersect="{
                  true: ['filterBlur'],
                  false: ['noblur'],
                }"
                class="content"
                :style="{
                  '--blur-px': `${
                    Math.abs(index - highlightLyricIndex) > 3
                      ? 3 * 2
                      : Math.abs(index - highlightLyricIndex) * 2
                  }px`,
                }"
              >
                <span
                  v-if="yrcToShow[index]"
                  :class="{
                    bouncingFadeOut: playerTime >= yrcToShow[index].time - 0.7,
                  }"
                >
                  <font
                    v-for="(y, ind) in parseOneLine(
                      yrcToShow[index].split('（')[0]
                    )"
                    :key="ind"
                    :start="`${y.time}`"
                    :duration="`${y.duration}ms`"
                    :style="{
                      display:
                        y.content.indexOf('（') === -1
                          ? 'inline-block'
                          : highlightLyricIndex === index
                          ? 'block'
                          : 'none',
                      'white-space': 'pre',
                      transform:
                        yrcToShow[index].indexOf('（') >=
                          yrcToShow[index].indexOf(y.content) ||
                        yrcToShow[index].indexOf('（') === -1
                          ? 'none'
                          : 'scale(0.8)',
                    }"
                  >
                    <font v-if="highlightLyricIndex === index">
                      <font
                        v-for="(c, i) in y.content
                          .replace('（', '')
                          .replace('）', '')"
                        :key="i"
                        :start="`${
                          y.time + (i * y.duration) / y.content.length
                        }`"
                        :duration="`${y.duration / y.content.length}ms`"
                        :style="{
                          '--floating-duration': `${
                            y.duration <= 1300 ? 5000 : 5000
                          }ms`,
                          '--shadow-duration': `${
                            y.duration <= 1300 ? 5000 : y.duration * 2
                          }ms`,
                          '--animation-duration': `${
                            y.duration / y.content.length
                          }ms`,
                          display: c === '(' ? 'block' : 'inline-block',
                          '--shining-duration': `${y.duration - 50}ms`,
                          '--animation-shadow-offset':
                            y.duration > 1300 ? '0px' : '2px',
                          '--animation-shadow-blur':
                            y.duration > 1300 ? '45px' : '3px',
                          '--animation-color':
                            y.duration > 1300
                              ? 'rgba(256, 256, 256, 1)'
                              : getColor(y.content),
                        }"
                        :class="{
                          slideShine:
                            highlightLyricIndex === index &&
                            playerTime * 1000 >=
                              y.time + (i * y.duration) / y.content.length,
                          unhighlightWord:
                            highlightLyricIndex === index &&
                            playerTime * 1000 <
                              y.time + (i * y.duration) / y.content.length,
                        }"
                        >{{ c === '（' ? '\n' : c }}</font
                      >
                    </font>
                    <font
                      v-else-if="
                        yrcToShow[index].indexOf('（') >
                          yrcToShow[index].indexOf(y.content) ||
                        yrcToShow[index].indexOf('（') === -1
                      "
                      :style="{
                        display:
                          yrcToShow[index].indexOf('（') >
                            yrcToShow[index].indexOf(y.content) ||
                          yrcToShow[index].indexOf('（') === -1
                            ? 'inline-block'
                            : 'none',
                        'white-space': 'pre',
                      }"
                    >
                      <font v-for="(c, i) in y.content" :key="i">{{ c }}</font>
                    </font>
                  </font>
                  <font
                    v-if="
                      yrcToShow[index].indexOf('（') != -1 &&
                      highlightLyricIndex === index
                    "
                    :key="'break-line' + index"
                  >
                    <br />
                  </font>
                  <transition name="bounce">
                    <font
                      v-if="
                        yrcToShow[index].indexOf('（') != -1 &&
                        highlightLyricIndex === index &&
                        playerTime * 1000 >=
                          parseOneLine(yrcToShow[index].split('（')[1])[0]
                            .time -
                            500 &&
                        playerTime * 1000 <
                          parseOneLine(yrcToShow[index + 1])[0].time - 250
                      "
                      :key="'yrc' + index"
                      :style="{
                        'white-space': 'pre-wrap',
                        float: 'right',
                        'text-align': 'right',
                        transform: 'scale(0.8)',
                      }"
                    >
                      <font
                        v-for="(y, ind) in parseOneLine(
                          yrcToShow[index].split('（')[1].split('）')[0]
                        )"
                        :key="ind"
                        :start="`${y.time}`"
                        :duration="`${y.duration}ms`"
                        :style="{
                          display:
                            y.content.indexOf('（') === -1
                              ? 'inline-block'
                              : highlightLyricIndex === index
                              ? 'block'
                              : 'none',
                        }"
                      >
                        <font v-if="highlightLyricIndex === index">
                          <font
                            v-for="(c, i) in y.content
                              .replace('（', '')
                              .replace('）', '')"
                            :key="i"
                            :start="`${
                              y.time + (i * y.duration) / y.content.length
                            }`"
                            :duration="`${y.duration / y.content.length}ms`"
                            :style="{
                              '--floating-duration': `${
                                y.duration <= 1300 ? 5000 : 5000
                              }ms`,
                              '--shadow-duration': `${
                                y.duration <= 1300 ? 5000 : y.duration * 2
                              }ms`,
                              '--animation-duration': `${
                                y.duration / y.content.length
                              }ms`,
                              display: c === '(' ? 'block' : 'inline-block',
                              '--shining-duration': `${y.duration - 50}ms`,
                              '--animation-shadow-offset':
                                y.duration > 1300 ? '0px' : '2px',
                              '--animation-shadow-blur':
                                y.duration > 1300 ? '45px' : '3px',
                              '--animation-color':
                                y.duration > 1300
                                  ? 'rgba(256, 256, 256, 1)'
                                  : getColor(y.content),
                            }"
                            :class="{
                              slideShine:
                                highlightLyricIndex === index &&
                                playerTime * 1000 >=
                                  y.time + (i * y.duration) / y.content.length,
                              unhighlightWord:
                                highlightLyricIndex === index &&
                                playerTime * 1000 <
                                  y.time + (i * y.duration) / y.content.length,
                            }"
                            >{{ c === '（' ? '\n' : c }}</font
                          >
                        </font>
                        <font
                          v-else-if="
                            yrcToShow[index].indexOf('（') >
                              yrcToShow[index].indexOf(y.content) ||
                            yrcToShow[index].indexOf('（') === -1
                          "
                          :style="{
                            display:
                              yrcToShow[index].indexOf('（') >
                                yrcToShow[index].indexOf(y.content) ||
                              yrcToShow[index].indexOf('（') === -1
                                ? 'inline-block'
                                : 'none',
                            'white-space': 'pre',
                          }"
                        >
                          <font v-for="(c, i) in y.content" :key="i">{{
                            c
                          }}</font>
                        </font>
                      </font>
                    </font>
                  </transition>
                </span>
                <span v-else>{{ line.contents[0] }}</span>
                <br
                  v-if="
                    line.contents[2] &&
                    $store.state.settings.showLyricsTranslation
                  "
                />
                <span
                  v-if="
                    line.contents[2] &&
                    $store.state.settings.showLyricsTranslation
                  "
                  class="translation"
                  >{{ line.contents[2] }}</span
                >
                <br />
                <span
                  v-if="
                    line.contents[1] &&
                    $store.state.settings.showLyricsTranslation
                  "
                  class="translation"
                  >{{ line.contents[1] }}</span
                >
              </div>
            </div>
          </div>
        </transition>
      </div>
      <div class="close-button" @click="toggleLyrics">
        <button>
          <svg-icon icon-class="arrow-down" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
// The lyrics page of Apple Music is so gorgeous, so I copy the design.
// Some of the codes are from https://github.com/sl1673495/vue-netease-music

import { mapState, mapMutations, mapActions } from 'vuex';
import VueSlider from 'vue-slider-component';
import { formatTrackTime } from '@/utils/common';
import { getLyric, getLyricByWord } from '@/api/track';
import { lyricParser, lyricByWordParser } from '@/utils/lyrics';
import ButtonIcon from '@/components/ButtonIcon.vue';
import * as Vibrant from 'node-vibrant/dist/vibrant.worker.min.js';
import Color from 'color';
import { isAccountLoggedIn } from '@/utils/auth';
import { hasListSource, getListSourcePath } from '@/utils/playList';
import locale from '@/locale';
import Vue from 'vue';
import VueIntersect from 'vue-intersect-directive';

Vue.use(VueIntersect);

export default {
  name: 'Lyrics',
  components: {
    VueSlider,
    ButtonIcon,
  },
  data() {
    return {
      lyricsInterval: null,
      lyric: [],
      tlyric: [],
      romalyric: [],
      yrc: [],
      lyricType: 'translation', // or 'romaPronunciation' or 'both'
      highlightLyricIndex: -1,
      playerTime: 0,
      minimize: true,
      background: '',
      date: this.formatTime(new Date()),
      intersected: {},
    };
  },
  computed: {
    ...mapState(['player', 'settings', 'showLyrics']),
    currentTrack() {
      return this.player.currentTrack;
    },
    volume: {
      get() {
        return this.player.volume;
      },
      set(value) {
        this.player.volume = value;
      },
    },
    imageUrl() {
      return this.player.currentTrack?.al?.picUrl + '?param=1024y1024';
    },
    bgImageUrl() {
      return this.player.currentTrack?.al?.picUrl + '?param=512y512';
    },
    isShowLyricTypeSwitch() {
      return this.romalyric.length > 0 && this.tlyric.length > 0;
    },
    lyricToShow() {
      return this.lyricType === 'translation'
        ? this.lyricWithTranslation
        : this.lyricType === 'romaPronunciation'
        ? this.lyricWithRomaPronunciation
        : this.lyricWithBoth;
    },
    yrcToShow() {
      return this.yrc;
    },
    lyricWithTranslation() {
      let ret = [];
      // 空内容的去除
      const lyricFiltered = this.lyric.filter(({ content }) =>
        Boolean(content)
      );
      // content统一转换数组形式
      if (lyricFiltered.length) {
        lyricFiltered.forEach(l => {
          const { rawTime, time, content } = l;
          const lyricItem = { time, content, contents: [content] };
          const sameTimeTLyric = this.tlyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          if (sameTimeTLyric) {
            const { content: tLyricContent } = sameTimeTLyric;
            if (content) {
              lyricItem.contents.push(tLyricContent);
            }
          }
          ret.push(lyricItem);
        });
      } else {
        ret = lyricFiltered.map(({ time, content }) => ({
          time,
          content,
          contents: [content],
        }));
      }
      return ret;
    },
    lyricWithRomaPronunciation() {
      let ret = [];
      // 空内容的去除
      const lyricFiltered = this.lyric.filter(({ content }) =>
        Boolean(content)
      );
      // content统一转换数组形式
      if (lyricFiltered.length) {
        lyricFiltered.forEach(l => {
          const { rawTime, time, content } = l;
          const lyricItem = { time, content, contents: [content] };
          const sameTimeRomaLyric = this.romalyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          if (sameTimeRomaLyric) {
            const { content: romaLyricContent } = sameTimeRomaLyric;
            if (content) {
              lyricItem.contents.push(romaLyricContent);
            }
          }
          ret.push(lyricItem);
        });
      } else {
        ret = lyricFiltered.map(({ time, content }) => ({
          time,
          content,
          contents: [content],
        }));
      }
      console.log(ret);
      return ret;
    },
    lyricWithBoth() {
      let ret = [];
      // 空内容的去除
      const lyricFiltered = this.lyric.filter(({ content }) =>
        Boolean(content)
      );
      // content统一转换数组形式
      if (lyricFiltered.length) {
        lyricFiltered.forEach(l => {
          const { rawTime, time, content } = l;
          const lyricItem = { time, content, contents: [content] };
          const sameTimeTLyric = this.tlyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          const sameTimeRomaLyric = this.romalyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          if (sameTimeTLyric) {
            const { content: tLyricContent } = sameTimeTLyric;
            if (content) {
              lyricItem.contents.push(tLyricContent);
            }
          }
          if (sameTimeRomaLyric) {
            const { content: romaLyricContent } = sameTimeRomaLyric;
            if (content) {
              lyricItem.contents.push(romaLyricContent);
            }
          }
          ret.push(lyricItem);
        });
      } else {
        ret = lyricFiltered.map(({ time, content }) => ({
          time,
          content,
          contents: [content],
        }));
      }
      console.log(ret);
      return ret;
    },
    lyricFontSize() {
      return {
        fontSize: `${this.$store.state.settings.lyricFontSize || 28}px`,
      };
    },
    noLyric() {
      return this.lyric.length == 0;
    },
    artist() {
      return this.currentTrack?.ar
        ? this.currentTrack.ar[0]
        : { id: 0, name: 'unknown' };
    },
    album() {
      return this.currentTrack?.al || { id: 0, name: 'unknown' };
    },
    theme() {
      return this.settings.lyricsBackground === true ? 'dark' : 'auto';
    },
  },
  watch: {
    currentTrack() {
      // this.getLyric();
      this.getLyricByWord();
      this.getCoverColor();
    },
    showLyrics(show) {
      if (show) {
        this.setLyricsInterval();
        this.$store.commit('enableScrolling', false);
      } else {
        clearInterval(this.lyricsInterval);
        this.$store.commit('enableScrolling', true);
      }
    },
  },
  created() {
    // this.getLyric();
    this.getLyricByWord();
    this.getCoverColor();
    this.initDate();
  },
  beforeDestroy: function () {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  destroyed() {
    clearInterval(this.lyricsInterval);
  },
  methods: {
    ...mapMutations(['toggleLyrics', 'updateModal']),
    ...mapActions(['likeATrack']),
    initDate() {
      var _this = this;
      clearInterval(this.timer);
      this.timer = setInterval(function () {
        _this.date = _this.formatTime(new Date());
      }, 1000);
    },
    formatTime(value) {
      let hour = value.getHours().toString();
      let minute = value.getMinutes().toString();
      let second = value.getSeconds().toString();
      return (
        hour.padStart(2, '0') +
        ':' +
        minute.padStart(2, '0') +
        ':' +
        second.padStart(2, '0')
      );
    },
    getColor(content) {
      const COLORS = {
        yellow: 'rgba(255, 255, 0, 0.75)',
        green: 'rgba(0, 255, 0, 0.75)',
        blue: 'rgba(0, 0, 255, 0.75)',
        red: 'rgba(255, 0, 0, 0.75)',
        purple: 'rgba(128, 0, 128, 0.75)',
        orange: 'rgba(255, 165, 0, 0.75)',
        cyan: 'rgba(0, 255, 255, 0.75)',
        magenta: 'rgba(255, 0, 255, 0.75)',
        lime: 'rgba(0, 255, 0, 0.75)',
        pink: 'rgba(255, 192, 203, 0.75)',
        gold: 'rgba(255, 215, 0, 0.75)',
      };
      for (let key in COLORS) {
        if (content.toLowerCase().includes(key.toLowerCase())) {
          return COLORS[key];
        }
      }
      // 如果系统配色为暗色，则返回白色
      const isDarkTheme =
        document.querySelector('body[data-theme="dark"]') !== null;
      if (isDarkTheme) {
        return 'rgba(225, 225, 225, 0.25)';
      }
      return 'rgba(128, 128, 128, 0.25)';
    },
    parseOneLine(line) {
      // if (line.indexOf('wait') !== -1) {
      //   console.log(line);
      // }
      // "[12270,3420](12270,180,0)I (12450,360,0)took (12810,180,0)an (12990,330,0)arrow (13320,270,0)to (13590,150,0)the (13740,960,0)heart(14700,990,0) "
      let result = [];
      let reg = /\((\d+),(\d+),(\d+)\)([^()]+)/g;
      let match;
      while ((match = reg.exec(line))) {
        let [, time, duration, type, content] = match;
        result.push({
          time: parseInt(time),
          duration: parseInt(duration),
          type: parseInt(type),
          content,
        });
      }
      // console.log(result);
      return result;
    },
    addToPlaylist() {
      if (!isAccountLoggedIn()) {
        this.showToast(locale.t('toast.needToLogin'));
        return;
      }
      this.$store.dispatch('fetchLikedPlaylist');
      this.updateModal({
        modalName: 'addTrackToPlaylistModal',
        key: 'show',
        value: true,
      });
      this.updateModal({
        modalName: 'addTrackToPlaylistModal',
        key: 'selectedTrackID',
        value: this.currentTrack?.id,
      });
    },
    playPrevTrack() {
      this.player.playPrevTrack();
    },
    playOrPause() {
      this.player.playOrPause();
    },
    playNextTrack() {
      if (this.player.isPersonalFM) {
        this.player.playNextFMTrack();
      } else {
        this.player.playNextTrack();
      }
    },
    getLyric() {
      if (!this.currentTrack.id) return;
      return getLyric(this.currentTrack.id).then(data => {
        if (!data?.lrc?.lyric) {
          this.lyric = [];
          this.tlyric = [];
          this.romalyric = [];
          return false;
        } else {
          let { lyric, tlyric, romalyric } = lyricParser(data);
          lyric = lyric.filter(
            l => !/^作(词|曲)\s*(:|：)\s*无$/.exec(l.content)
          );
          let includeAM =
            lyric.length <= 10 &&
            lyric.map(l => l.content).includes('纯音乐，请欣赏');
          if (includeAM) {
            let reg = /^作(词|曲)\s*(:|：)\s*/;
            let author = this.currentTrack?.ar[0]?.name;
            lyric = lyric.filter(l => {
              let regExpArr = l.content.match(reg);
              return (
                !regExpArr || l.content.replace(regExpArr[0], '') !== author
              );
            });
          }
          if (lyric.length === 1 && includeAM) {
            this.lyric = [];
            this.tlyric = [];
            this.romalyric = [];
            return false;
          } else {
            this.lyric = lyric;
            this.tlyric = tlyric;
            this.romalyric = romalyric;
            if (tlyric.length * romalyric.length > 0) {
              this.lyricType = 'translation';
            } else {
              this.lyricType =
                lyric.length > 0 ? 'translation' : 'romaPronunciation';
            }
            return true;
          }
        }
      });
    },
    getLyricByWord() {
      if (!this.currentTrack.id) return;
      return getLyricByWord(this.currentTrack.id).then(data => {
        if (!data?.lrc?.lyric) {
          this.lyric = [];
          this.tlyric = [];
          this.romalyric = [];
          this.yrc = [];
          return false;
        } else {
          let { lyric, tlyric, romalyric, yrc } = lyricByWordParser(data);
          // console.log(yrc);
          lyric = lyric.filter(
            l => !/^作(词|曲)\s*(:|：)\s*无$/.exec(l.content)
          );
          let includeAM =
            lyric.length <= 10 &&
            lyric.map(l => l.content).includes('纯音乐，请欣赏');
          if (includeAM) {
            let reg = /^作(词|曲)\s*(:|：)\s*/;
            let author = this.currentTrack?.ar[0]?.name;
            lyric = lyric.filter(l => {
              let regExpArr = l.content.match(reg);
              return (
                !regExpArr || l.content.replace(regExpArr[0], '') !== author
              );
            });
          }
          if (lyric.length === 1 && includeAM) {
            this.lyric = [];
            this.tlyric = [];
            this.romalyric = [];
            return false;
          } else {
            this.lyric = lyric;
            this.tlyric = tlyric;
            this.romalyric = romalyric;
            this.yrc = yrc;
            // console.log('this.yrc', this.yrc);
            if (tlyric.length * romalyric.length > 0) {
              this.lyricType = 'translation';
            } else {
              this.lyricType =
                lyric.length > 0 ? 'translation' : 'romaPronunciation';
            }
            return true;
          }
        }
      });
    },
    switchLyricType() {
      const nxt = {
        translation: 'romaPronunciation',
        romaPronunciation: 'both',
        both: 'translation',
      };
      this.lyricType = nxt[this.lyricType];
      // 滚动歌词到当前播放位置
      // this.scrollToCurrentLyric();
    },
    formatTrackTime(value) {
      return formatTrackTime(value);
    },
    clickLyricLine(value, startPlay = false) {
      // TODO: 双击选择还会选中文字，考虑搞个右键菜单复制歌词
      let jumpFlag = false;
      this.lyric.filter(function (item) {
        if (item.content == '纯音乐，请欣赏') {
          jumpFlag = true;
        }
      });
      if (window.getSelection().toString().length === 0 && !jumpFlag) {
        this.player.seek(value);
      }
      if (startPlay === true) {
        this.player.play();
      }
    },
    setLyricsInterval() {
      this.lyricsInterval = setInterval(() => {
        const progress = this.player.seek(null, false) ?? 0;
        this.playerTime = progress;
        let oldHighlightLyricIndex = this.highlightLyricIndex;
        this.highlightLyricIndex = this.lyric.findIndex((l, index) => {
          const nextLyric = this.lyric[index + 1];
          return (
            progress >= l.time - 50 &&
            (nextLyric ? progress < nextLyric.time : true)
          );
        });
        var firstTime = 0;
        for (var i = 0; i < this.lyric.length; i++) {
          if (this.lyric[i].content !== '● ● ●') {
            firstTime = this.lyric[i].time;
            break;
          }
        }
        // console.log(firstTime);
        if (this.playerTime < firstTime) {
          if (this.yrc) {
            // 在 yrc 的最前面插上一行
            if (firstTime > 5) {
              const data = `[0,${firstTime * 1000 - 1500}](0,${
                firstTime * 1000 - 1500
              },0)● ● ●`;
              if (this.yrc[0] !== data) {
                this.yrc.unshift(data);
                this.lyric.unshift({
                  time: 0,
                  content: '● ● ●',
                });
              }
            }
          }
        } else if (this.yrc) {
          // if (this.lyric[0].content === '● ● ●') {
          //   this.yrc[0] = '';
          //   this.lyric[0] = '';
          // }
        }
        if (oldHighlightLyricIndex !== this.highlightLyricIndex) {
          const el = document.getElementById(`line${this.highlightLyricIndex}`);
          if (el) {
            const scrollParent = getScrollParent(el);
            if (scrollParent) {
              const scrollStart = scrollParent.scrollTop;
              if (oldHighlightLyricIndex - this.highlightLyricIndex === -1) {
                const parentRect = scrollParent.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                var scrollOffset =
                  elRect.top -
                  parentRect.top -
                  (parentRect.height - elRect.height) * (1 - 0.618);
                var low = 0;
                var high = this.lyric.length - 1;
                while (low <= high) {
                  var mid = Math.floor((low + high) / 2);
                  var midElement = document.getElementById(`line${mid}`);
                  if (midElement) {
                    var midRect = midElement.getBoundingClientRect();
                    if (midRect.top < parentRect.top) {
                      low = mid + 1;
                    } else {
                      high = mid - 1;
                    }
                  } else {
                    high = mid - 1;
                  }
                }
                const firstVisibleLine = low - 1;
                // get this element
                const firstScrollElement = document.getElementById(
                  `line${firstVisibleLine}`
                );
                // eslint-disable-next-line no-unused-vars
                const firstScrollIndex = firstVisibleLine;
                // 获取最后一个可见元素
                var lastVisibleLine = firstVisibleLine;
                var lastScrollElement = firstScrollElement;
                while (lastScrollElement) {
                  var lastRect = lastScrollElement.getBoundingClientRect();
                  if (lastRect.top < parentRect.top + parentRect.height) {
                    lastVisibleLine = lastVisibleLine + 1;
                    lastScrollElement = document.getElementById(
                      `line${lastVisibleLine}`
                    );
                  } else {
                    lastScrollElement = document.getElementById(
                      `line${lastVisibleLine + 3}`
                    );
                    break;
                  }
                }
                // eslint-disable-next-line no-unused-vars
                const scrollDelay = 65; // 元素之间的滚动延迟
                const scrollDuration = Math.min(
                  700,
                  (this.lyric[this.highlightLyricIndex + 1].time -
                    this.lyric[this.highlightLyricIndex].time) *
                    1000 -
                    scrollDelay * (lastVisibleLine - firstVisibleLine + 1)
                );
                // eslint-disable-next-line no-unused-vars
                const lastScrollIndex = lastVisibleLine;
                // eslint-disable-next-line no-unused-vars
                const scrollEnd = scrollStart + scrollOffset;
                // eslint-disable-next-line no-unused-vars
                const startTime = performance.now();
                // 对每个元素，向上非线性滚动，使用TranslateY
                // 处理 scrollOffset：如果scrollOffset > 剩下可以滚动的距离，那么scrollOffset = 剩下可以滚动的距离
                const scrollOffsetMax =
                  scrollParent.scrollHeight -
                  scrollParent.scrollTop -
                  scrollParent.clientHeight;
                if (scrollOffset > scrollOffsetMax) {
                  scrollOffset = scrollOffsetMax;
                }
                for (let i = firstVisibleLine; i <= lastVisibleLine; i++) {
                  const el = document.getElementById(`line${i}`);
                  if (el) {
                    // eslint-disable-next-line no-unused-vars
                    const elRect = el.getBoundingClientRect();
                    el.style.transform = `translateY(-${scrollOffset}px)`;
                    // 1. 要有非线性过渡；2. 要有动画开始延迟：scrollDelay * (i - firstVisibleLine)
                    // 3. 要有动画持续时间：scrollDuration
                    el.style.transition = `transform ${scrollDuration}ms cubic-bezier(0.4, 1.31, 0.4, 1)${
                      scrollDelay * (i - firstVisibleLine) +
                      10 *
                        (i - firstVisibleLine - 1) *
                        (i - firstVisibleLine - 1)
                    }ms`;
                    try {
                      el.children[0].style.transform = 'scale(0.95)';
                      el.children[0].style.transition = `transform ${
                        scrollDuration / 2
                      }ms`;
                      setTimeout(() => {
                        el.children[0].style.transform = 'scale(1)';
                      }, scrollDuration / 2);
                      // eslint-disable-next-line no-empty
                    } catch (e) {}
                  }
                }
                // 在动画完成后，清除所有的 transform 和 transition，并且将滚动条滚动到正确的位置
                setTimeout(() => {
                  for (let i = firstVisibleLine; i <= lastVisibleLine; i++) {
                    const el = document.getElementById(`line${i}`);
                    if (el) {
                      el.style.transition = 'none';
                      el.style.transform = '';
                    }
                  }
                  scrollParent.scrollTop += scrollOffset;
                }, scrollDuration + scrollDelay * (lastVisibleLine - firstVisibleLine));
              } else {
                {
                  const parentRect = scrollParent.getBoundingClientRect();
                  const elRect = el.getBoundingClientRect();
                  const scrollOffset =
                    elRect.top -
                    parentRect.top -
                    (parentRect.height - elRect.height) / 2;
                  const scrollDuration = 500;
                  const scrollStart = scrollParent.scrollTop;
                  const scrollEnd = scrollStart + scrollOffset;
                  const startTime = performance.now();

                  // 缓动函数
                  // eslint-disable-next-line no-inner-declarations
                  function easeOutQuad(t) {
                    return t * (2 - t);
                  }

                  // eslint-disable-next-line no-inner-declarations
                  function scrollStep(timestamp) {
                    const currentTime = timestamp - startTime;
                    let scrollProgress = Math.min(
                      currentTime / scrollDuration,
                      1
                    );
                    // 应用缓动函数
                    scrollProgress = easeOutQuad(scrollProgress);
                    const scrollPosition =
                      scrollStart + (scrollEnd - scrollStart) * scrollProgress;
                    scrollParent.scrollTop = scrollPosition;

                    if (currentTime < scrollDuration) {
                      window.requestAnimationFrame(scrollStep);
                    }
                  }

                  window.requestAnimationFrame(scrollStep);
                }
              }
            }
          }

          // eslint-disable-next-line no-inner-declarations
          function getScrollParent(element) {
            let parent = element.parentNode;
            while (parent) {
              if (
                parent === document.body ||
                parent === document.documentElement
              ) {
                return window;
              }
              const overflowY = getComputedStyle(parent).overflowY;
              if (overflowY === 'auto' || overflowY === 'scroll') {
                return parent;
              }
              parent = parent.parentNode;
            }
            return null;
          }
        }
      }, 50);
    },
    moveToFMTrash() {
      this.player.moveToFMTrash();
    },
    switchRepeatMode() {
      this.player.switchRepeatMode();
    },
    switchShuffle() {
      this.player.switchShuffle();
    },
    getCoverColor() {
      if (this.settings.lyricsBackground !== true) return;
      const cover = this.currentTrack.al?.picUrl + '?param=256y256';
      Vibrant.from(cover, { colorCount: 1 })
        .getPalette()
        .then(palette => {
          const originColor = Color.rgb(palette.DarkMuted._rgb);
          const color = originColor.darken(0.1).rgb().string();
          const color2 = originColor.lighten(0.28).rotate(-30).rgb().string();
          this.background = `linear-gradient(to top left, ${color}, ${color2})`;
        });
    },
    hasList() {
      return hasListSource();
    },
    getListPath() {
      return getListSourcePath();
    },
    mute() {
      this.player.mute();
    },
  },
};
</script>

<style lang="scss" scoped>
/* 弹跳动画 */
@keyframes bounceIn {
  0% {
    transform: scale(0.7);
    opacity: 0;
    float: right;
  }
  80% {
    transform: scale(0.85);
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
    float: right;
  }
}

.bounce-enter-active {
  animation: bounceIn 0.35s;
  float: right;
}

.bounce-leave-active {
  animation: bounceIn 0.2s reverse;
}

.bouncingFadeOut {
  span {
    animation: bouncingFadeOut 0.7s ease-in-out !important;
  }
}

@keyframes scaleUpDown {
  0% {
    transform: translateY(var(--scrollOffset)) scale(1);
  }
  50% {
    transform: translateY(var(--scrollOffset)) scale(0.8);
  }
  100% {
    transform: translateY(var(--scrollOffset)) scale(1);
  }
}

@keyframes bouncingFadeOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: scale(0.3);
    opacity: 0.3;
  }
}

.filterBlur {
  filter: blur(var(--blur-px, 0px));
}

.noblur {
  filter: none;
}

@keyframes floatingAnimation {
  0% {
    transform: translateY(0) scale(1);
    animation-timing-function: cubic-bezier(0.4, 1.31, 0.4, 1);
  }
  25% {
    transform: translateY(-3px) scale(1.03);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes shadowAnimation {
  0% {
    text-shadow: 0;
  }
  15% {
    text-shadow: var(--animation-shadow-offset) var(--animation-shadow-offset)
      var(--animation-shadow-blur) var(--animation-color);
  }
  70% {
    text-shadow: var(--animation-shadow-offset) var(--animation-shadow-offset)
      var(--animation-shadow-blur) var(--animation-color);
  }
  100% {
    text-shadow: 0;
  }
}

.slideShine {
  background: rgba(0, 0, 0, 0.45) -webkit-linear-gradient(
      left,
      rgba(0, 0, 0, 0.88),
      rgba(0, 0, 0, 0.88),
      rgba(0, 0, 0, 0)
    ) 0 0 no-repeat;
  background-size: 200% 1000px;
  background-clip: text;
  -webkit-text-fill-color: rgba(0, 0, 0, 0);
  animation: slideShineAnimation var(--animation-duration, 0.5s) linear,
    floatingAnimation var(--floating-duration, 0.5s) ease-in-out,
    shadowAnimation var(--shadow-duration, 0.5s) linear;
  font-weight: 800;
}

[data-theme='dark'] .slideShine {
  background: rgba(255, 255, 255, 0.45) -webkit-linear-gradient(
      left,
      rgba(255, 255, 255, 0.88),
      rgba(255, 255, 255, 0.88),
      rgba(255, 255, 255, 0)
    ) 0 0 no-repeat;
  background-size: 200% 1000px;
  background-clip: text;
  -webkit-text-fill-color: rgba(0, 0, 0, 0);
  animation: slideShineAnimation var(--animation-duration, 0.5s) linear,
    shadowAnimation var(--shadow-duration, 0.5s) linear,
    floatingAnimation var(--floating-duration, 0.5s) ease-in-out;
  font-weight: 800;
}

@keyframes slideShineAnimation {
  0% {
    background-size: 0 1000px;
  }
  100% {
    background-size: 115% 1000px;
  }
}

.lyrics-page {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  background: var(--color-body-bg);
  display: flex;
  clip: rect(auto, auto, auto, auto);
}

.lyrics-background {
  --contrast-lyrics-background: 75%;
  --brightness-lyrics-background: 150%;
}

[data-theme='dark'] .lyrics-background {
  --contrast-lyrics-background: 125%;
  --brightness-lyrics-background: 50%;
}

.lyrics-background {
  filter: blur(50px) contrast(var(--contrast-lyrics-background))
    brightness(var(--brightness-lyrics-background));
  position: absolute;
  height: 100vh;
  width: 100vw;
  .top-right,
  .bottom-left {
    z-index: 0;
    width: 140vw;
    height: 140vw;
    opacity: 0.6;
    position: absolute;
    background-size: cover;
  }

  .top-right {
    right: 0;
    top: 0;
    mix-blend-mode: luminosity;
  }

  .bottom-left {
    left: 0;
    bottom: 0;
    animation-direction: reverse;
    animation-delay: 10s;
  }
}

.dynamic-background > div {
  animation: rotate 150s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.gradient-background {
  position: absolute;
  height: 100vh;
  width: 100vw;
}

.left-side {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  margin-right: 32px;
  margin-top: 24px;
  align-items: center;
  transition: all 0.5s;

  z-index: 1;

  .date {
    max-width: 54vh;
    margin: 24px 0;
    color: var(--color-text);
    text-align: center;
    font-size: 4rem;
    font-weight: 600;
    opacity: 0.88;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }

  .controls {
    max-width: 54vh;
    margin-top: 24px;
    color: var(--color-text);

    .title {
      margin-top: 8px;
      font-size: 1.4rem;
      font-weight: 600;
      opacity: 0.88;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
    }

    .subtitle {
      margin-top: 4px;
      font-size: 1rem;
      opacity: 0.58;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
    }

    .top-part {
      display: flex;
      justify-content: space-between;

      .top-right {
        display: flex;
        justify-content: space-between;

        .volume-control {
          margin: 0 10px;
          display: flex;
          align-items: center;
          .volume-bar {
            width: 84px;
          }
        }

        .buttons {
          display: flex;
          align-items: center;

          button {
            margin: 0 0 0 4px;
          }

          .svg-icon {
            height: 18px;
            width: 18px;
          }
        }
      }
    }

    .progress-bar {
      margin-top: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .slider {
        width: 100%;
        flex-grow: grow;
        padding: 0 10px;
      }

      span {
        font-size: 15px;
        opacity: 0.58;
        min-width: 28px;
      }
    }

    .media-controls {
      display: flex;
      justify-content: center;
      margin-top: 18px;
      align-items: center;

      button {
        margin: 0;
      }

      .svg-icon {
        opacity: 0.38;
        height: 14px;
        width: 14px;
      }

      .active .svg-icon {
        opacity: 0.88;
      }

      .middle {
        padding: 0 16px;
        display: flex;
        align-items: center;

        button {
          margin: 0 8px;
        }

        button#play .svg-icon {
          height: 28px;
          width: 28px;
          padding: 2px;
        }

        .svg-icon {
          opacity: 0.88;
          height: 22px;
          width: 22px;
        }
      }
      .lyric-switch-icon {
        color: var(--color-text);
        font-size: 14px;
        line-height: 14px;
        opacity: 0.88;
      }
    }
  }
}

.cover {
  position: relative;

  .cover-container {
    position: relative;
  }

  img {
    border-radius: 0.75em;
    width: 54vh;
    height: 54vh;
    user-select: none;
    object-fit: cover;
  }

  .shadow {
    position: absolute;
    top: 12px;
    height: 54vh;
    width: 54vh;
    filter: blur(16px) opacity(0.6);
    transform: scale(0.92, 0.96);
    z-index: -1;
    background-size: cover;
    border-radius: 0.75em;
  }
}

.right-side {
  flex: 1;
  font-weight: 800;
  color: var(--color-text);
  margin-right: 24px;
  z-index: 0;

  .lyrics-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-left: 78px;
    max-width: 460px;
    overflow-y: auto;
    transition: 0.5s;
    scrollbar-width: none; // firefox
    position: relative;

    .line {
      margin: 2px 0;
      padding: 12px 18px;
      transition: 0.5s;
      border-radius: 12px;

      &:hover {
        background: var(--color-secondary-bg-for-transparent);
      }

      .content {
        transform-origin: center left;
        transform: scale(0.95);
        transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);

        span {
          opacity: 0.28;
          cursor: default;
          font-size: 1em;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        span.translation {
          // transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0.2;
          font-size: 0.725em;
        }
      }
    }

    .line#line-1:hover {
      background: unset;
    }

    .translation {
      margin-top: 0.1em;
    }

    .highlight div.content {
      width: 101%;

      span {
        opacity: 1;
        // opacity: 0.45;
        display: inline-block;
      }

      span.translation {
        opacity: 0.65;
      }
    }

    .highlightWord {
      opacity: 0.98;
    }
    .unhighlightWord {
      opacity: 0.45;
    }
  }

  ::-webkit-scrollbar {
    display: none;
  }

  .lyrics-container .line:first-child {
    margin-top: 50vh;
  }

  .lyrics-container .line:last-child {
    margin-bottom: calc(50vh - 128px);
  }
}

.close-button {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 300;
  border-radius: 0.75rem;
  height: 44px;
  width: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.28;
  transition: 0.2s;
  -webkit-app-region: no-drag;

  .svg-icon {
    color: var(--color-text);
    padding-top: 5px;
    height: 22px;
    width: 22px;
  }

  &:hover {
    background: var(--color-secondary-bg-for-transparent);
    opacity: 0.88;
  }
}

.lyrics-page.no-lyric {
  .left-side {
    transition: all 0.5s;
    transform: translateX(27vh);
    margin-right: 0;
  }
}

@media (max-aspect-ratio: 10/9) {
  .left-side {
    display: none;
  }
  .right-side .lyrics-container {
    max-width: 100%;
  }
}

@media screen and (min-width: 1200px) {
  .right-side .lyrics-container {
    max-width: 600px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s;
}

.slide-up-enter, .slide-up-leave-to /* .fade-leave-active below version 2.1.8 */ {
  transform: translateY(100%);
}

.slide-fade-enter-active {
  transition: all 0.5s ease;
}

.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0.2, 0, 1);
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(27vh);
  opacity: 0;
}
</style>
