type Image = {
    src: string;
    width: number;
    height: number;
};

export type Banana = {
    name: string;
    keyword?: string;
    link: string;
    images: {
        square?: Image;
        normal: Image;
    };
    partner: string;
    cities?: string[];
    from?: string;
    to?: string;
};

const bananas: Banana[] = [
    {
        name: 'ASICS Melbourne',
        link: 'https://www.tennis-warehouse.com/catpage-ASICSMELLP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/asics_melbourne_2026/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/asics_melbourne_2026/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'ASICS Solution Speed FF 4',
        link: 'https://www.tennis-warehouse.com/ASICS_Solution_Speed_FF_4/catpage-ASICSFF4PP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/asics_solution_speed_ff4/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/asics_solution_speed_ff4/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'Dunlop FX',
        link: 'https://www.tennis-warehouse.com/Dunlop_FX_Racquets/catpage-DUNLOPFXRAC.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/dunlop_fx/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/dunlop_fx/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'HEAD Speed',
        link: 'https://www.tennis-warehouse.com/catpage-HDSPEEDPP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/head_speed_2026/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/head_speed_2026/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'Lacoste Melbourne',
        link: 'https://www.tennis-warehouse.com/catpage-LACAOPP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/lacoste_melbourne_2026/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/lacoste_melbourne_2026/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'Nike Melbourne',
        link: 'https://www.tennis-warehouse.com/Nike_Melbourne_Collection/catpage-NIKEMELPP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/nike_melbourne_2026/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/nike_melbourne_2026/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'Wilson Pro Staff Classic',
        link: 'https://www.tennis-warehouse.com/Wilson_Pro_Staff_Classic/catpage-WILPSCLASS.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/wilson_pro_staff_classic/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/wilson_pro_staff_classic/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: 'Yonex VCORE',
        link: 'https://www.tennis-warehouse.com/Yonex_VCORE_2026/catpage-VCORE8PP.html',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/yonex_vcore/square.webp',
                width: 300,
                height: 250,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/tw/yonex_vcore/970x250.webp',
                width: 970,
                height: 250,
            },
        },
        partner: 'tw',
    },
    {
        name: "Derek's Tennis Racquet Services",
        keyword: "Derek's Tennis Racquet Stringing",
        link: 'https://www.derekstennisracquetservices.com',
        images: {
            square: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/bananas/derek-square.png',
                width: 600,
                height: 500,
            },
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/bananas/derek-normal.png',
                width: 1164,
                height: 300,
            },
        },
        partner: 'derek',
        cities: ['raleigh'],
    },
    {
        name: 'ENO Community Tennis Association',
        link: 'https://www.enocta.tennis',
        images: {
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/bananas/eno-normal.png',
                width: 1040,
                height: 278,
            },
        },
        partner: 'eno',
        cities: ['cary'],
    },
    {
        name: 'Western Wake Tennis',
        link: 'https://westernwaketennis.com/upcoming-adult-events/',
        images: {
            normal: {
                src: 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/bananas/wwt-normal.png',
                width: 950,
                height: 254,
            },
        },
        partner: 'wwt',
        cities: ['cary'],
    },
];

export default bananas;
