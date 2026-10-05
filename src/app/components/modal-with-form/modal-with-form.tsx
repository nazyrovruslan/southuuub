'use client';

import { Button, Input, Modal } from 'antd';
import { InputMask } from '@react-input/mask';

import './modal-with-form.css';
import { FONT_MONT_BOOK } from '@/app/fonts';
import { useState } from 'react';
import { NBSP } from '@/app/constants';
import { createPortal } from 'react-dom';
import Cross from '../../../../public/v2/modal-cross.svg';
import Image from 'next/image';


type Props = {
    open: boolean;
    onClose: () => void;
}

export const ModalWithForm = ({ open, onClose }: Props) => {
    const [isValid, setValid] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [company, setCompany] = useState('');

    const validateEmail = () => /^([a-zA-Z0-9-._])+@([a-zA-Z0-9-_.])+\.([a-zA-Z]{2,30})$/i.test(email.trim());
    const validateText = (text: string) => text.trim().length !== 0;
    const phoneValidation = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        return digits.length !== 11;
    }

    const handleClick = () => {
        setValid(true);
        console.log({
            firstName,
            lastName,
            email,
            mobileNumber,
            company
        });
    }

    return (
        <>
            <Modal
                title={<p className={`${FONT_MONT_BOOK.className}`}>Заявка на участие</p>}
                open={open}
                onCancel={onClose}
                centered
                closable={false}
                className='modal-with-form'
                rootClassName='modal-with-form-root'
                wrapClassName='modal-with-form-wrapp'
                footer={null}
                maskClosable={false}
            >
                <div className='modal-with-form-block-wrapper'>
                    <div>
                        <Input
                            className={`${FONT_MONT_BOOK.className} modal-with-form-input`}
                            placeholder='имя'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            status={isValid && !validateText(firstName) ? 'error' : ''}
                        />
                        {isValid && !validateText(firstName) && <p className={`${FONT_MONT_BOOK.className} modal-with-form-input-hint-error`}>Пожалуйста, введите имя</p>}
                    </div>

                    <div>
                        <Input
                            className={`${FONT_MONT_BOOK.className} modal-with-form-input`}
                            placeholder='фамилия'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            status={isValid && !validateText(lastName) ? 'error' : ''}
                        />
                        {isValid && !validateText(lastName) && <p className={`${FONT_MONT_BOOK.className} modal-with-form-input-hint-error`}>Пожалуйста, введите фамилию</p>}
                    </div>

                    <div>
                        <Input
                            className={`${FONT_MONT_BOOK.className} modal-with-form-input`}
                            placeholder='e-mail'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            status={isValid && !validateEmail() ? 'error' : ''}
                        />
                        {isValid && !validateEmail() && <p className={`${FONT_MONT_BOOK.className} modal-with-form-input-hint-error`}>Пожалуйста, введите email в формате example@email.com</p>}
                    </div>

                    <div>
                        <InputMask
                            mask="+7 (___)-___-__-__"
                            replacement={{ _: /\d/ }}
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className={`${FONT_MONT_BOOK.className} ${isValid && phoneValidation(mobileNumber) ? 'modal-with-form-input-error' : ''} modal-with-form-input`}
                            placeholder="+7 (___) ___-__-__"
                        />
                        {isValid && phoneValidation(mobileNumber) && (
                            <p className={`${FONT_MONT_BOOK.className} modal-with-form-input-hint-error`}>Пожалуйста, введите корректный номер телефона (11 цифр)</p>
                        )}
                    </div>

                    <div>
                        <Input
                            className={`${FONT_MONT_BOOK.className} modal-with-form-input`}
                            placeholder='Компания'
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            status={isValid && !validateText(company) ? 'error' : ''}
                        />
                        {isValid && !validateText(company) && <p className={`${FONT_MONT_BOOK.className} modal-with-form-input-hint-error`}>Пожалуйста, введите название компании</p>}
                    </div>
                </div>

                <div className='modal-with-form-block-button-wrapper'>
                    <Button
                        id='btn_lending_form_submit'
                        type='primary'
                        onClick={handleClick}
                        className={`${FONT_MONT_BOOK.className} modal-with-form-submit base-button base-button_black`}
                    >
                        отправить
                    </Button>
                    
                    <p className={`${FONT_MONT_BOOK.className} modal-with-form-block-button-text`}>
                        {`Нажимая кнопку Подать заявку, вы${NBSP}даёте\nСогласие${NBSP}на${NBSP}обработку персональных данных, и${NBSP}принимаете\nПолитику конфеденциальности`}
                    </p>
                </div>
            </Modal>
            {open && createPortal(
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 1001,
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Image src={Cross} alt='' unoptimized />
                </div>,
                document.body
            )}
        </>
    );
};