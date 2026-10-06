<script setup lang="ts">
import gsap from "gsap";

// Первый экран листается по шагам, как слайды: один свайп (жест колесом или трекпадом) —
// ровно один шаг, сколько бы ни тянули. Шаги: заголовок, заголовок с подзаголовком,
// второй заголовок, второй заголовок с подзаголовком. Ролик поделён на две части:
// под первым заголовком крутится начало (крупные планы), второй заголовок начинается
// с кадра, где буква U видна целиком, видео приближается, и дальше крутится конец ролика.
// Части — отдельные файлы со своим loop: перемотка внутри одного ролика в Safari подвисала. Пока шаги
// не пройдены, страница стоит наверху; после последнего шага следующий свайп прокручивает
// страницу как обычно, а свайп вниз у самого верха возвращает шаги назад.
const HERO_LAST_STEP = 3;
const HERO_VIDEO_ZOOM = 1.5;
// жест закончился, если колесо молчит столько миллисекунд (инерция трекпада идёт дольше)
const HERO_GESTURE_GAP_MS = 180;
// и не раньше, чем доиграла смена шага
const HERO_STEP_LOCK_MS = 800;
// минимальный путь пальца для шага
const HERO_SWIPE_PX = 30;

const pub = usePublicPath();

const TEXT_1 = "сообщество\nC-level в IT";
const TEXT_2 = `здесь лидеры находят партнёрства,\nресурсы и${NBSP}смыслы, которых\nне встретить онлайн.`;
const TEXT_3 = `мы переизобрели\nнетворкинг и получили`;

const contentRef = ref<HTMLDivElement | null>(null);
const sectionRef = ref<HTMLDivElement | null>(null);
const videoWrapperRef = ref<HTMLDivElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const video2Ref = ref<HTMLVideoElement | null>(null);
// часть ролика, которая сейчас на экране (её запускает и ставит на паузу IntersectionObserver)
let activeVideo: HTMLVideoElement | null = null;

const mainBannerText1 = ref<HTMLDivElement | null>(null);
const mainBannerText2 = ref<HTMLDivElement | null>(null);
const mainBannerText3 = ref<HTMLDivElement | null>(null);
const mainBannerText4 = ref<HTMLDivElement | null>(null);

const cleanups: Array<() => void> = [];

onMounted(() => {
  // Появление первого экрана: прелоадер уезжает вверх, под ним уже идёт видео,
  // а контент немного выезжает снизу из прозрачности.
  (() => {
    const content = contentRef.value;
    if (!content) return;

    const reveal = () => {
      gsap.to(content, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.25,
        ease: "power3.out",
      });
    };

    if (window.__preloaderHidden || !document.querySelector(".preloader")) {
      reveal();
      return;
    }

    gsap.set(content, { opacity: 0, y: 40 });
    window.addEventListener(PRELOADER_HIDE_EVENT, reveal, { once: true });
    cleanups.push(() => window.removeEventListener(PRELOADER_HIDE_EVENT, reveal));
  })();

  // Шаги первого экрана по жестам
  (() => {
    const videoWrapper = videoWrapperRef.value;
    const video = videoRef.value;
    const video2 = video2Ref.value;
    const text1 = mainBannerText1.value;
    const text2 = mainBannerText2.value;
    const text3 = mainBannerText3.value;
    const text4 = mainBannerText4.value;
    if (!videoWrapper || !video || !video2 || !text1 || !text2 || !text3 || !text4) return;

    const texts = [text1, text2, text3, text4];
    // какие тексты видны на каждом шаге
    const STEPS = [[text1], [text1, text2], [text3], [text3, text4]];

    let step = 0;
    const secondPart = (s: number) => s >= 2;
    // нужная часть ролика проявляется поверх другой и играет с начала, другая встаёт на паузу
    const showPart = (second: boolean) => {
      const [on, off] = second ? [video2, video] : [video, video2];
      activeVideo = on;
      on.currentTime = 0;
      on.play().catch(() => {});
      on.classList.add("home-video-active");
      off.classList.remove("home-video-active");
      off.pause();
    };
    const showStep = (next: number) => {
      if (next === step) return;
      const prev = step;
      const forward = next > step;
      const leaving = STEPS[step]!.filter((text) => !STEPS[next]!.includes(text));
      const entering = STEPS[next]!.filter((text) => !STEPS[step]!.includes(text));
      step = next;

      if (secondPart(next) !== secondPart(prev)) showPart(secondPart(next));
      gsap.to(videoWrapper, {
        scale: secondPart(next) ? HERO_VIDEO_ZOOM : 1,
        duration: 0.9,
        ease: "power2.inOut",
        overwrite: "auto",
      });
      if (leaving.length) {
        gsap.to(leaving, {
          opacity: 0,
          y: forward ? -50 : 40,
          duration: 0.3,
          ease: "power2.in",
          overwrite: "auto",
        });
      }
      if (entering.length) {
        gsap.fromTo(
          entering,
          { opacity: 0, y: forward ? 40 : -50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            // новый текст появляется, когда старый уже ушёл: тексты не накладываются
            delay: leaving.length ? 0.35 : 0,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
      }
    };

    // страница могла открыться уже прокрученной — тогда сразу последний шаг
    const startStep = window.scrollY > 0 ? HERO_LAST_STEP : 0;
    gsap.set(texts, { opacity: 0, y: 40 });
    gsap.set(STEPS[startStep]!, { opacity: 1, y: 0 });
    step = startStep;
    gsap.set(videoWrapper, { scale: secondPart(step) ? HERO_VIDEO_ZOOM : 1 });
    if (secondPart(step)) showPart(true);

    const atTop = () => window.scrollY <= 1;
    // жест забирает первый экран, если страница наверху и шаг в эту сторону ещё есть
    const takes = (direction: number) =>
      atTop() && (direction > 0 ? step < HERO_LAST_STEP : step > 0);

    // Колесо и трекпад: шаг на первое событие жеста, дальше жест (с инерцией) только гасится
    let gestureTaken = false;
    let lockedUntil = 0;
    let lastWheel = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const now = performance.now();
      const newGesture = now - lastWheel > HERO_GESTURE_GAP_MS && now > lockedUntil;
      lastWheel = now;
      const direction = Math.sign(event.deltaY);

      if (newGesture) {
        gestureTaken = takes(direction);
        if (gestureTaken) {
          showStep(step + direction);
          lockedUntil = now + HERO_STEP_LOCK_MS;
        }
      }
      if (gestureTaken && atTop()) event.preventDefault();
    };

    // Палец: шаг по окончании свайпа, страницу в это время не двигаем
    let touchStartY: number | null = null;
    let touchTaken = false;
    // решение принимается один раз на свайп: если страница доехала до верха посреди
    // прокрутки, этот же свайп шаг не переключает
    let touchDecided = false;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? null;
      touchTaken = false;
      touchDecided = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY === null || !event.touches[0]) return;
      const dy = touchStartY - event.touches[0].clientY;
      if (!touchDecided && Math.abs(dy) > 4) {
        touchDecided = true;
        touchTaken = takes(Math.sign(dy));
      }
      if (touchTaken && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY === null) return;
      const dy = touchStartY - (event.changedTouches[0]?.clientY ?? touchStartY);
      touchStartY = null;
      if (touchTaken && Math.abs(dy) >= HERO_SWIPE_PX) showStep(step + Math.sign(dy));
      touchTaken = false;
    };

    // ушли с первого экрана не жестом (полоса прокрутки, клавиши, якорь) — показываем последний шаг
    const onScroll = () => {
      if (!atTop() && step < HERO_LAST_STEP) showStep(HERO_LAST_STEP);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      gsap.killTweensOf([videoWrapper, ...texts]);
    });
  })();

  // Видео первого экрана не декодируется, пока его не видно
  (() => {
    const section = sectionRef.value;
    if (!section || !videoRef.value) return;

    const observer = new IntersectionObserver(([entry]) => {
      const video = activeVideo ?? videoRef.value;
      if (!video || !entry) return;
      if (entry.isIntersecting) {
        if (video.paused) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    observer.observe(section);
    cleanups.push(() => observer.disconnect());
  })();

  // Safari не всегда запускает autoPlay у видео, которое React вставил на клиенте:
  // muted у React — свойство, а не атрибут, и Safari считает видео «со звуком».
  // Ставим атрибут явно и запускаем воспроизведение сами, когда видео готово.
  (() => {
    const video = videoRef.value;
    const video2 = video2Ref.value;
    if (!video || !video2) return;

    [video, video2].forEach((element) => {
      element.muted = true;
      element.setAttribute("muted", "");
      element.setAttribute("playsinline", "");
    });

    // запускаем только первую часть и только пока на экране она
    const tryPlay = () => {
      if (video.paused && (activeVideo ?? video) === video) video.play().catch(() => {});
    };
    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    // и ещё раз, когда прелоадер ушёл: к этому моменту видео точно в буфере
    window.addEventListener(PRELOADER_HIDE_EVENT, tryPlay);
    cleanups.push(() => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      window.removeEventListener(PRELOADER_HIDE_EVENT, tryPlay);
    });
  })();
});

onBeforeUnmount(() => {
  // в обратном порядке, как React снимает эффекты
  cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
});
</script>

<template>
  <div id="main-banner" ref="sectionRef" class="main-banner-wrapper">
    <div class="main-banner-pin-wrapper">
      <div ref="videoWrapperRef" class="video-wrapper">
        <video
          id="main-video-banner"
          ref="videoRef"
          class="home-video home-video-active"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          :poster="pub('/v2/southuuub-poster.webp')"
          disableremoteplayback
        >
          <!-- Вертикальная версия для телефонов: 608×1080 -->
          <source
            :src="pub('/v2/southuuub-mobile-a.mp4')"
            type="video/mp4"
            media="(max-width: 767px) and (orientation: portrait)"
          >
          <!-- Ноутбуки без Retina: 720p, на таких экранах разницы не видно -->
          <source
            :src="pub('/v2/southuuub-720-a.mp4')"
            type="video/mp4"
            media="(max-width: 1440px) and (max-resolution: 1.5dppx)"
          >
          <source :src="pub('/v2/southuuub-a.mp4')" type="video/mp4">
        </video>
        <!-- Вторая часть: общий план с буквой U, для второго заголовка -->
        <video
          id="main-video-banner-b"
          ref="video2Ref"
          class="home-video"
          muted
          loop
          playsinline
          preload="auto"
          :poster="pub('/v2/southuuub-b-poster.webp')"
          disableremoteplayback
          aria-hidden="true"
        >
          <source
            :src="pub('/v2/southuuub-mobile-b.mp4')"
            type="video/mp4"
            media="(max-width: 767px) and (orientation: portrait)"
          >
          <source
            :src="pub('/v2/southuuub-720-b.mp4')"
            type="video/mp4"
            media="(max-width: 1440px) and (max-resolution: 1.5dppx)"
          >
          <source :src="pub('/v2/southuuub-b.mp4')" type="video/mp4">
        </video>
      </div>

      <div ref="contentRef" class="main-banner-content">
        <div
          ref="mainBannerText1"
          :class="`${FONT_MONT_BOOK} main-banner-text main-banner-text-1`"
        >{{ TEXT_1 }}</div>

        <div
          ref="mainBannerText2"
          :class="`${FONT_MONT_BOOK} main-banner-text main-banner-text-2`"
        >{{ TEXT_2 }}</div>

        <div
          ref="mainBannerText3"
          :class="`${FONT_MONT_BOOK} main-banner-text main-banner-text-3`"
        >
          <span>{{ TEXT_3 }}</span>

          <div
            :class="`${FONT_IBM_PLEX_SERIF_ITALIC} main-banner-text-3-netwarming`"
          >netwarming <span>&mdash;</span></div>
        </div>

        <div
          ref="mainBannerText4"
          :class="`${FONT_MONT_BOOK} main-banner-text main-banner-text-4`"
        >это искусство встречаться по-настоящему: с теплом, доверием и искренностью. это свежий воздух вместо офисных переговорок, живой смех вместо холодных встреч, свобода вместо тесных рамок. и юг как состояние души.</div>

        <div class="main-banner-button-wrapper">
          <MainBannerButton />
        </div>
      </div>
    </div>
  </div>
</template>
