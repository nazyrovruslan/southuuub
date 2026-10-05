import { useCallback, useEffect, useRef, useState } from "react";
import { FONT_MONT_BOOK, FONT_MONT_BOOK_EXTRA_LIGHT } from "../../fonts";
import "./community-in-numbers.css";
import { NBSP } from "@/app/constants";

const TEXT_1 = `сообщество для C-level в${NBSP}IT`;
const TEXT_2 = "участников";
const TEXT_3 = `CTO&CIO, 18%${NBSP}CPO, 15%${NBSP}CEO и 8%${NBSP}CDO`;
const TEXT_4 = `лет комьюнити IT-руководителей`;

export const CommunityInNumbers = () => {
  const [isMobile, setMobile] = useState<boolean | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [count4, setCount4] = useState(0);

  useEffect(() => {
    const updateColumn = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;

      setMobile(mobile);
    };

    window.addEventListener("resize", updateColumn);
    updateColumn();

    return () => {
      window.removeEventListener("resize", updateColumn);
    };
  }, []);

  const animateNumber = useCallback(
    (
      start: number,
      end: number,
      setter: (value: number) => void,
      duration: number,
    ) => {
      const startTime = performance.now();

      const updateNumber = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(start + (end - start) * progress);
        setter(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        }
      };

      requestAnimationFrame(updateNumber);
    },
    [],
  );

  const startAnimations = useCallback(() => {
    animateNumber(0, 1, setCount1, 3000);
    animateNumber(0, 1700, setCount2, 3000);
    animateNumber(0, 32, setCount3, 3000);
    animateNumber(0, 5, setCount4, 3000);
  }, [animateNumber]);

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current || isAnimated) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const isVisible = rect.top <= 80;

      if (isVisible) {
        setIsAnimated(true);
        setShouldAnimate(true);
        startAnimations();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isAnimated, startAnimations]);

  return (
    <div
      className="community-in-numbers-wrapper"
      id="community-in-numbers"
      ref={wrapperRef}
    >
      <h3
        className={`${FONT_MONT_BOOK.className} community-in-numbers-title`}
        style={{ cursor: "pointer" }}
      >
        мы в цифрах
      </h3>

      {isMobile === false && (
        <div className="community-in-numbers-infographic">
          <div className="community-in-numbers-infographic-item">
            <div
              className={`community-in-numbers-infographic-item-animated ${shouldAnimate ? "animate-item-1" : ""}`}
            >
              <div className="community-in-numbers-infographic-item-fill" />
            </div>
            <div
              className={`community-in-numbers-infographic-item-content ${shouldAnimate ? "animate-content-1" : ""}`}
              style={!shouldAnimate ? { bottom: "0", top: "auto" } : undefined}
            >
              <div
                className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
              >
                №{count1.toLocaleString()}
              </div>
              <div
                className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
              >
                {TEXT_1}
              </div>
            </div>
          </div>

          <div className="community-in-numbers-infographic-item">
            <div
              className={`community-in-numbers-infographic-item-line ${shouldAnimate ? "animate-line-2" : ""}`}
            />
            <div
              className={`community-in-numbers-infographic-item-animated ${shouldAnimate ? "animate-item-2" : ""}`}
            >
              <div className="community-in-numbers-infographic-item-fill" />
            </div>
            <div
              className={`community-in-numbers-infographic-item-content ${shouldAnimate ? "animate-content-2" : ""}`}
              style={!shouldAnimate ? { bottom: "0", top: "auto" } : undefined}
            >
              <div
                className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
              >
                {count2}
                {count2 === 1700 ? "+" : ""}
              </div>
              <div
                className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
              >
                {TEXT_2}
              </div>
            </div>
          </div>

          <div className="community-in-numbers-infographic-item">
            <div
              className={`community-in-numbers-infographic-item-line ${shouldAnimate ? "animate-line-3" : ""}`}
            />
            <div
              className={`community-in-numbers-infographic-item-animated ${shouldAnimate ? "animate-item-3" : ""}`}
            >
              <div className="community-in-numbers-infographic-item-fill" />
            </div>
            <div
              className={`community-in-numbers-infographic-item-content ${shouldAnimate ? "animate-content-3" : ""}`}
              style={!shouldAnimate ? { bottom: "0", top: "auto" } : undefined}
            >
              <div
                className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
              >
                {count3}%
              </div>
              <div
                className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
              >
                {TEXT_3}
              </div>
            </div>
          </div>

          <div className="community-in-numbers-infographic-item">
            <div
              className={`community-in-numbers-infographic-item-line ${shouldAnimate ? "animate-line-4" : ""}`}
            />
            <div
              className={`community-in-numbers-infographic-item-animated ${shouldAnimate ? "animate-item-4" : ""}`}
            >
              <div className="community-in-numbers-infographic-item-fill" />
            </div>
            <div
              className={`community-in-numbers-infographic-item-content ${shouldAnimate ? "animate-content-4" : ""}`}
              style={!shouldAnimate ? { bottom: "0", top: "auto" } : undefined}
            >
              <div
                className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
              >
                {count4}
              </div>
              <div
                className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
              >
                {TEXT_4}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile === true && (
        <div className="community-in-numbers-infographic-mobile">
          <div className="community-in-numbers-infographic-mobile-left-content">
            <div className="community-in-numbers-infographic-mobile-item">
              <div
                className={`community-in-numbers-infographic-mobile-content`}
              >
                <div
                  className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
                >
                  №{count1.toLocaleString()}
                </div>
                <div
                  className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
                >
                  {TEXT_1}
                </div>
              </div>
            </div>

            <div className="community-in-numbers-infographic-mobile-item">
              <div
                className={`community-in-numbers-infographic-mobile-content`}
              >
                <div
                  className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
                >
                  {count3}%
                </div>
                <div
                  className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
                >
                  {TEXT_3}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`community-in-numbers-infographic-mobile-line ${shouldAnimate ? "community-in-numbers-infographic-mobile-line-animate" : ""}`}
          />

          <div className="community-in-numbers-infographic-mobile-right-content">
            <div className="community-in-numbers-infographic-mobile-item">
              <div
                className={`community-in-numbers-infographic-mobile-item-content`}
              >
                <div
                  className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
                >
                  {count2}
                  {count2 === 1700 ? "+" : ""}
                </div>
                <div
                  className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
                >
                  {TEXT_2}
                </div>
              </div>
            </div>

            <div className="community-in-numbers-infographic-mobile-item">
              <div
                className={`community-in-numbers-infographic-mobile-content`}
              >
                <div
                  className={`${FONT_MONT_BOOK_EXTRA_LIGHT.className} community-in-numbers-infographic-item-count`}
                >
                  {count4}
                </div>
                <div
                  className={`${FONT_MONT_BOOK.className} community-in-numbers-infographic-item-desc`}
                >
                  {TEXT_4}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
