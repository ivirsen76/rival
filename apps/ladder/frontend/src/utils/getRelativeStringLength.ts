const getRelativeStringLength = str => {
    const sizes = {
        B: 0.9,
        C: 1.1,
        E: 0.8,
        F: 0.7,
        G: 1.1,
        I: 0.4,
        J: 0.8,
        K: 0.9,
        L: 0.6,
        M: 1.3,
        O: 1.2,
        P: 0.9,
        Q: 1.2,
        R: 0.9,
        S: 0.9,
        T: 0.8,
        W: 1.4,
        X: 0.9,
        Y: 0.9,
        Z: 0.8,
        c: 0.9,
        e: 0.9,
        f: 0.5,
        i: 0.4,
        j: 0.4,
        k: 0.8,
        l: 0.4,
        m: 1.5,
        r: 0.6,
        s: 0.8,
        t: 0.6,
        v: 0.8,
        w: 1.2,
        x: 0.7,
        y: 0.8,
        z: 0.7,
        ' ': 0.7,
    };

    const size = str.split('').reduce((res, char) => {
        res += sizes[char] || 0.9;
        return res;
    }, 0);

    return size;
};

export default getRelativeStringLength;
