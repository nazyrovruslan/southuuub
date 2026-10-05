'use client';

import { Button } from "antd";
import { FONT_MONT_BOOK } from "../../fonts";
import { useState } from "react";
import { RegestryMemeberForm } from "@/app/components/registry-member-form";
import { LK_REGISTER_LINK } from "@/app/constants";
import { useGetLinkWithUtm } from "@/app/hooks/use-get-link-with-utm";

export const MainBannerButton = () => {
    const getLinkWIthUtm = useGetLinkWithUtm();

    const [open, setOpen] = useState(false);

    const handleClick = () => window.open(getLinkWIthUtm(LK_REGISTER_LINK), '_blank');

    return (
        <>
            <Button
                id='btn_lending_main_banner'
                type='primary'
                className={`main-banner-button base-button`}
                onClick={handleClick}
            >
                <span className={`${FONT_MONT_BOOK.className}`}>
                    Стать участником
                </span>
            </Button>

            <RegestryMemeberForm open={open} onClose={() => setOpen(false)} />
        </>
    )
}
