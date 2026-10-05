'use client';

import { ModalWithForm } from "../modal-with-form";

type Props = {
    open: boolean;
    onClose: () => void;
}

export const RegestryMemeberForm = ({ open, onClose }: Props) => {
    return <ModalWithForm open={open} onClose={onClose} />
}