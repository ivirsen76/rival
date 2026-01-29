const generateHash = async (str: string) => {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

export default async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();

    let webglInfo = '';
    try {
        const gl = document.createElement('canvas').getContext('webgl');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            webglInfo = [
                gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
            ].join('~');
        }
    } catch {
        // do nothing
    }

    const data = {
        userAgent: navigator.userAgent,
        // eslint-disable-next-line no-restricted-globals
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        device: `${navigator.platform}:${navigator.hardwareConcurrency}:${navigator.deviceMemory}`,
        canvas: canvasData,
        webgl: webglInfo,
    };

    return {
        whole: await generateHash(JSON.stringify(data)),
        userAgent: await generateHash(data.userAgent),
        screen: await generateHash(data.screen),
        device: await generateHash(data.device),
        canvas: await generateHash(data.canvas),
        webgl: await generateHash(data.webgl),
    };
};
