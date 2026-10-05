/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { AccordionsBlock } from "./blocks/accordions-block";
import { OurProjectsScrollableBlock } from "./blocks/our-projects-scrollable-block";
import { Footer } from "./blocks/footer";
import { Header } from "./blocks/header"
import { InfinityBanner } from "./blocks/infinity-banner";
import { MainBanner } from "./blocks/main-banner";
import { CommunityInNumbers } from "./blocks/community-in-numbers";
import { AboutUsBlock } from "./blocks/about-us-block";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { NBSP } from "./constants";
import { FONT_MONT_BOOK } from "./fonts";
import { HowBecomeCommunityBlock } from "./blocks/how-become-community-block";
import { SocietyPhotosBlock } from "./blocks/society-photos-block";
import JsonLdScript from "./components/JsonLdScript";
import { BlockWithUAnimate } from "./blocks/block-with-u-animate";
import { MoreNew } from "./blocks/more-new";

type Props = {
    data: any;
}

export default function HomeContent({ data }: Props) {
    const [isOpenCookieModal, setOpenCookieModal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && !window.localStorage.getItem('isVisibleCookieAlert')) {
             
            setOpenCookieModal(true);
        }
    }, []);

    return (
        <>
            {/* Schema.org JSON-LD разметка */}
            <JsonLdScript data={data} />

            <div style={{ position: 'relative', top: '0', left: '0' }}>
                <Header />

                <main >
                    <MainBanner />

                    <AccordionsBlock />

                    <InfinityBanner />
                    <OurProjectsScrollableBlock />

                    <MoreNew />

                    <SocietyPhotosBlock />

                    <CommunityInNumbers />

                    <InfinityBanner />

                    <HowBecomeCommunityBlock />

                    <BlockWithUAnimate />

                    <AboutUsBlock />
                </main>

                <Footer />

                {isOpenCookieModal && (
                    <div className="cookie-banner">
                        <p className={`${FONT_MONT_BOOK.className} cookie-banner-text`}>
                            {`Мы собираем cookies, потому что они помогают сайту помнить вас и${NBSP}оставаться таким${NBSP}же внимательным, как${NBSP}люди в${NBSP}сообществе South${NBSP}HUВ. Просто скажите «да»`}
                        </p>

                        <div className="cookie-banner_button-wrapper">
                            <Button
                                id='btn_lending_cookie_button'
                                type='primary'
                                className={`${FONT_MONT_BOOK.className} base-button cookie-banner-button`}
                                onClick={() => {
                                    setOpenCookieModal(false)
                                    window.localStorage.setItem('isVisibleCookieAlert', 'true')}
                                }
                            >
                                да
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
