type Props = {
    className: string;
}

const styles = {
    width: "100%",
    height: "100%",
    display: 'block',
    margin: '0 auto',
    preserveAspectRatio: "xMidYMid meet",
}

// S и O по макету срезаны сверху рамкой буквы, в движении тоже.
// H и T раньше срезались справа: их viewBox охватывает контур целиком.
export const IconS = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 166 181" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M93.3145 64.8337C73.2627 60.8198 55.956 57.3508 55.956 47.6883C55.956 38.0259 66.5 30.7972 81.5707 30.7972C105.567 30.7972 109.676 44.6007 110.385 49.3775C110.458 49.8134 110.476 50.1766 110.512 50.449L110.858 53.5367H161.469V50.9576C161.469 41.4404 157.615 -6 81.5707 -6C36.2678 -6 3.38136 17.9563 3.38136 50.9576C3.38136 90.9514 42.0852 98.2346 73.1718 104.083C95.0415 108.188 113.912 111.747 113.912 124.806C113.912 131.726 110.149 143.35 84.952 143.35C54.0108 143.35 51.2475 121.392 50.993 117.269V117.196C50.993 117.124 50.993 117.069 50.993 117.015L50.8839 114.781H0V116.597C0 123.099 2.38149 180.129 84.9156 180.129C134.472 180.129 166.504 156.482 166.504 119.884C166.504 79.5272 125.928 71.3904 93.3327 64.8519L93.3145 64.8337Z" fill="white"/>
    </svg>
);

export const IconO = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 175 182" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M87.6062 -3C35.2134 -3 0 34.3966 0 90.0465C0 145.696 35.2134 183.093 87.6062 183.093C139.999 183.093 175.212 145.696 175.212 90.0465C175.212 34.3966 139.999 -3 87.6062 -3ZM124.91 90.0646C124.91 105.993 121.274 143.045 87.6062 143.045C53.9381 143.045 50.284 105.993 50.284 90.0646C50.284 74.1361 53.9199 37.0846 87.6062 37.0846C121.292 37.0846 124.91 74.1361 124.91 90.0646Z" fill="white"/>
    </svg>
);


export const IconU = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 167 181" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M83.2613 180.517C57.1194 180.517 36.7041 173.361 22.0152 159.031C7.34445 144.701 0 124.395 0 98.0956V0H50.1023V96.57C50.1023 111.736 53.1019 122.615 59.0829 129.19C65.0639 135.765 73.2991 139.052 83.7522 139.052C94.2053 139.052 102.386 135.765 108.294 129.19C114.203 122.615 117.148 111.754 117.148 96.57V0H166.486V98.0956C166.486 124.395 159.142 144.701 144.471 159.031C129.8 173.361 109.385 180.517 83.225 180.517H83.2613Z" fill="white"/>
    </svg>
);


export const IconH = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 174 181" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M122.44 0V70.33H52.3576V0H0V180H52.3576V107.981H122.44V180H174V0H122.44Z" fill="white"/>
    </svg>
);


export const IconT = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 174 181" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M174 0H0V37.708H58.5699V180H111.327V37.708H174V0Z" fill="white"/>
    </svg>
);


export const IconB = ({ className }: Props) => (
    <svg className={className} {...styles} viewBox="0 0 172 181" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M135.804 86.5816V84.8153C135.804 84.8153 163.764 77.8835 163.764 48.4469C163.764 15.6109 139.263 0 92.0202 0H0V180H97.2566C146.219 180 169 162.699 169 128.097C169 93.4944 135.785 86.5816 135.785 86.5816H135.804ZM114.82 53.6696C114.82 65.805 106.086 72.7368 88.542 72.7368H53.5686V34.6212H92.0393C107.787 34.6212 114.82 41.5341 114.82 53.6885V53.6696ZM95.5556 145.417H53.5494V103.883H92.0776C109.526 103.883 120.037 110.814 120.037 124.64C120.037 138.466 111.303 145.398 95.5368 145.398L95.5556 145.417Z" fill="white"/>
    </svg>
);


export const DESKTOP_CELL_POSITIONS = [
    [
        { x: 0, y: 1, type: 'img', src: 'WordS' },
        { x: 1, y: 1, type: 'img', src: 'WordO' },
        { x: 1, y: 2, type: 'img', src: 'WordU' },
        { x: 2, y: 2, type: 'img', src: 'WordT' },
        { x: 3, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 3, y: 2, type: 'img', src: 'WordH' },
        { x: 4, y: 1, type: 'img', src: 'WordU' },
        { x: 4, y: 2, type: 'img', src: 'WordU' },
        { x: 5, y: 3, type: 'img', src: 'WordU' },
        { x: 6, y: 3, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 1, type: 'img', src: 'WordS' },
        { x: 1, y: 1, type: 'img', src: 'WordO' },
        { x: 1, y: 2, type: 'img', src: 'WordU' },
        { x: 2, y: 3, type: 'img', src: 'WordT' },
        { x: 3, y: 3, type: 'img', src: 'WordH' },
        { x: 4, y: 1, type: 'img', src: 'WordU' },
        { x: 4, y: 2, type: 'img', src: 'WordU' },
        { x: 4, y: 3, type: 'img', src: 'WordU' },
        { x: 5, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 5, y: 2, type: 'img', src: 'WordU' },
        { x: 6, y: 2, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 0, type: 'img', src: 'WordS' },
        { x: 1, y: 1, type: 'img', src: 'WordO' },
        { x: 1, y: 2, type: 'img', src: 'WordU' },
        { x: 2, y: 3, type: 'img', src: 'WordT' },
        { x: 3, y: 4, type: 'img', src: 'WordH' },
        { x: 4, y: 1, type: 'img', src: 'WordU' },
        { x: 4, y: 2, type: 'img', src: 'WordU' },
        { x: 5, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 5, y: 2, type: 'img', src: 'WordU' },
        { x: 5, y: 3, type: 'img', src: 'WordU' },
        { x: 6, y: 2, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 2, type: 'img', src: 'WordS' },
        { x: 1, y: 1, type: 'img', src: 'WordO' },
        { x: 2, y: 2, type: 'img', src: 'WordU' },
        { x: 3, y: 3, type: 'img', src: 'WordT' },
        { x: 4, y: 1, type: 'img', src: 'WordU' },
        { x: 4, y: 3, type: 'img', src: 'WordH' },
        { x: 5, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 5, y: 2, type: 'img', src: 'WordU' },
        { x: 5, y: 3, type: 'img', src: 'WordU' },
        { x: 6, y: 2, type: 'img', src: 'WordU' },
        { x: 6, y: 3, type: 'img', src: 'WordB' },
    ],
];

export const TABLET_CELL_POSITIONS = [
    [
        { x: 0, y: 1, type: 'img', src: 'WordS' },

        { x: 1, y: 1, type: 'img', src: 'WordO' },
        { x: 1, y: 2, type: 'img', src: 'WordU' },

        { x: 2, y: 3, type: 'img', src: 'WordT' },

        { x: 3, y: 1, type: 'img', src: 'WordU' },
        { x: 3, y: 2, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordH' },

        { x: 4, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 4, y: 3, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 1, type: 'img', src: 'WordS' },

        { x: 1, y: 2, type: 'img', src: 'WordO' },
        { x: 1, y: 3, type: 'img', src: 'WordU' },

        { x: 2, y: 4, type: 'img', src: 'WordT' },

        { x: 3, y: 2, type: 'img', src: 'WordU' },
        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordH' },

        { x: 4, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 4, y: 3, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 0, type: 'img', src: 'WordS' },
        { x: 0, y: 1, type: 'img', src: 'WordO' },

        { x: 1, y: 2, type: 'img', src: 'WordU' },
        { x: 1, y: 3, type: 'img', src: 'WordT' },

        { x: 2, y: 4, type: 'img', src: 'WordH' },

        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 5, type: 'img', src: 'WordU' },

        { x: 4, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 4, y: 2, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 2, type: 'img', src: 'WordS' },

        { x: 1, y: 3, type: 'img', src: 'WordO' },
        { x: 1, y: 4, type: 'img', src: 'WordU' },

        { x: 2, y: 5, type: 'img', src: 'WordT' },

        { x: 3, y: 2, type: 'img', src: 'WordU' },
        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordH' },

        { x: 4, y: 1, type: 'text', text: 'это люди,\nкоторые\nего создают' },
        { x: 4, y: 2, type: 'img', src: 'WordB' },
    ],
];

export const MOBILE_CELL_POSITIONS = [
    [
        { x: 0, y: 2, type: 'img', src: 'WordS' },
        { x: 1, y: 3, type: 'img', src: 'WordO' },
        { x: 1, y: 4, type: 'img', src: 'WordU' },
        { x: 2, y: 5, type: 'img', src: 'WordT' },
        { x: 3, y: 2, type: 'text', text: 'это люди,\nкоторые его\nсоздают', colSpan: 2 },
        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordU' },
        { x: 3, y: 6, type: 'img', src: 'WordH' },
        { x: 4, y: 4, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 3, type: 'img', src: 'WordS' },
        { x: 1, y: 4, type: 'img', src: 'WordO' },
        { x: 1, y: 5, type: 'img', src: 'WordU' },
        { x: 2, y: 5, type: 'img', src: 'WordT' },
        { x: 3, y: 2, type: 'text', text: 'это люди,\nкоторые его\nсоздают', colSpan: 2 },
        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordU' },
        { x: 3, y: 5, type: 'img', src: 'WordH' },
        { x: 4, y: 3, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 2, type: 'img', src: 'WordS' },
        { x: 0, y: 3, type: 'img', src: 'WordO' },
        { x: 1, y: 4, type: 'img', src: 'WordU' },
        { x: 2, y: 4, type: 'img', src: 'WordT' },
        { x: 3, y: 2, type: 'text', text: 'это люди,\nкоторые его\nсоздают', colSpan: 2 },
        { x: 3, y: 3, type: 'img', src: 'WordU' },
        { x: 3, y: 4, type: 'img', src: 'WordU' },
        { x: 3, y: 6, type: 'img', src: 'WordH' },
        { x: 4, y: 3, type: 'img', src: 'WordB' },
    ],
    [
        { x: 0, y: 3, type: 'img', src: 'WordS' },
        { x: 1, y: 4, type: 'img', src: 'WordO' },
        { x: 1, y: 5, type: 'img', src: 'WordU' },
        { x: 2, y: 6, type: 'img', src: 'WordT' },
        { x: 3, y: 2, type: 'text', text: 'это люди,\nкоторые его\nсоздают', colSpan: 2 },
        { x: 3, y: 4, type: 'img', src: 'WordU' },
        { x: 3, y: 5, type: 'img', src: 'WordU' },
        { x: 3, y: 7, type: 'img', src: 'WordH' },
        { x: 4, y: 4, type: 'img', src: 'WordB' },
    ],
];