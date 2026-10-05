/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import './preloader.css';
import { FONT_IBM_PLEX_SERIF_LIGHT } from '@/app/fonts';
import Image from 'next/image';
import PreloaderImg1 from '../../../../public/v2/preloader-icon-1.svg'
import PreloaderImg2 from '../../../../public/v2/preloader-icon-2.svg'
import PreloaderImg3 from '../../../../public/v2/preloader-icon-3.svg'
import { useVideoLoadingProgress } from '@/app/hooks/use-video-loading-process';
import { PRELOADER_HIDE_EVENT } from '@/app/constants';

declare global {
    interface Window {
        __preloaderHidden?: boolean;
    }
}

const PRELOADER_IMAGES = [PreloaderImg1, PreloaderImg2, PreloaderImg3];
const STEP_INTERVAL_MS = 500;
// совпадает с transition в preloader.css: прелоадер успевает целиком уехать вверх
const HIDE_ANIMATION_MS = 600;
const OVERFLOW_RESTORE_DELAY_MS = 500;
// Прелоадер уходит не позже этого времени, даже если видео не загрузилось
// (энергосбережение на iOS, экономия трафика, блокировщик, нет кодека).
const MAX_WAIT_MS = 2500;

export const Preloader = () => {
    const [isVisible, setVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [pageLoadProgress, setPageLoadProgress] = useState(0);

    const overflowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isTimedOut, setTimedOut] = useState(false);

    // Ждём только видео первого экрана: остальные грузятся при прокрутке.
    const heroVideoProgress = useVideoLoadingProgress('main-video-banner');

    const combinedProgress = isTimedOut ? 100 : Math.min(
        Math.round((heroVideoProgress * 0.5) + (pageLoadProgress * 0.5)),
        100
    );

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (document.readyState === 'complete') {
            setPageLoadProgress(100);
            return;
        }

        const updatePageLoadProgress = () => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            
            if (resources.length === 0) {
                setPageLoadProgress(document.readyState === 'loading' ? 10 : 50);
                return;
            }

            const loadedResources = resources.filter(entry => {
                return (
                    entry.name.includes('.js') ||
                    entry.name.includes('.css') ||
                    entry.initiatorType === 'script' ||
                    entry.initiatorType === 'link' ||
                    entry.initiatorType === 'xmlhttprequest' ||
                    entry.initiatorType === 'fetch'
                );
            });

            if (loadedResources.length === 0) {
                setPageLoadProgress(50);
                return;
            }

            const totalProgress = loadedResources.reduce((sum, resource) => {
                if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
                    return sum + 100;
                }
                return sum + (resource.transferSize ? 100 : 0);
            }, 0);

            const avgProgress = Math.round(totalProgress / loadedResources.length);
            setPageLoadProgress(prev => Math.max(prev, Math.min(avgProgress, 100)));
        };

        updatePageLoadProgress();

        const handleLoad = () => {
            setPageLoadProgress(100);
        };

        const handleResourceLoad = () => {
            updatePageLoadProgress();
        };

        let performanceObserver: PerformanceObserver | null = null;
        
        try {
            performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                    updatePageLoadProgress();
                }
            });

            performanceObserver.observe({ type: 'resource', buffered: true });
        } catch {
            console.warn('PerformanceObserver not supported, using fallback');
        }

        window.addEventListener('load', handleLoad);
        
        const interval = setInterval(updatePageLoadProgress, 200);

        const handleDOMContentLoaded = () => {
            setPageLoadProgress(prev => Math.max(prev, 70));
        };
        
        document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

        return () => {
            window.removeEventListener('load', handleLoad);
            document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
            if (performanceObserver) {
                performanceObserver.disconnect();
            }
            clearInterval(interval);
        };
    }, []);

    // Управление overflow с задержкой при скрытии
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (overflowTimerRef.current) {
            clearTimeout(overflowTimerRef.current);
        }

        if (isVisible) {
            html.style.overflowY = 'hidden';
            body.style.overflowY = 'hidden';
        } else {
            overflowTimerRef.current = setTimeout(() => {
                html.style.overflowY = '';
                body.style.overflowY = '';
            }, OVERFLOW_RESTORE_DELAY_MS);
        }

        return () => {
            if (overflowTimerRef.current) {
                clearTimeout(overflowTimerRef.current);
            }
            html.style.overflowY = '';
            body.style.overflowY = '';
        };
    }, [isVisible]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % PRELOADER_IMAGES.length);
        }, STEP_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (combinedProgress < 100) return;

        setIsAnimating(true);
        // Первый экран показывает контент, пока прелоадер уезжает вверх
        window.__preloaderHidden = true;
        window.dispatchEvent(new Event(PRELOADER_HIDE_EVENT));

        const timer = setTimeout(() => {
            window.scrollTo(0,0);
            setVisible(false);
        }, HIDE_ANIMATION_MS);

        return () => clearTimeout(timer);
    }, [combinedProgress]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`preloader ${isAnimating ? 'preloader--hidden' : ''}`}>
            <div className="preloader__content">
                <div className="preloader__images">
                    {PRELOADER_IMAGES.map((src, index) => (
                        <Image
                            key={index}
                            src={src}
                            alt={`preloader step ${index + 1}`}
                            width={280}
                            height={80}
                            className={`preloader__image ${activeStep === index ? 'preloader__image--active' : ''}`}
                            unoptimized
                        />
                    ))}
                </div>

                <div className={`preloader__progress ${FONT_IBM_PLEX_SERIF_LIGHT.className}`}>
                    {combinedProgress}%
                </div>
            </div>
        </div>
    );
};