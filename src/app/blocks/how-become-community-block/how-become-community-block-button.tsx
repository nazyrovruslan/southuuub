'use client';

import { Button } from "antd";
import { FONT_MONT_BOOK } from "../../fonts";
import { LK_REGISTER_LINK } from "@/app/constants";
import { useGetLinkWithUtm } from "@/app/hooks/use-get-link-with-utm";

export const AccesibleButton = () => {
    const getLinkWIthUtm = useGetLinkWithUtm();

    const handleClick = () => window.open(getLinkWIthUtm(LK_REGISTER_LINK), '_blank');

    return (
        <>
            <Button
                id='btn_lending_apply_community'
                type='primary'
                className={`how-become-community-block-button base-button base-button_black`}
                onClick={handleClick}
            >
                <span className={`${FONT_MONT_BOOK.className}`}>
                    подать заявку
                </span>
            </Button>
        </>
    )
}
