const axios = require('axios');

async function downloadYouTube(url) {
    const api = `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(url)}`;
    return api;
}

async function downloadInstagram(url) {
    const api = `https://www.instasupersave.com/api/convert`;
    try {
        const res = await axios.post(api, { url });
        return res.data.medias[0]?.url;
    } catch {
        throw new Error('Instagram download failed.');
    }
}

async function downloadTikTok(url) {
    const api = `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`;
    try {
        const res = await axios.get(api);
        const token = res.data.token;
        const id = res.data.id;
        return `https://tikmate.app/download/${token}/${id}.mp4`;
    } catch {
        throw new Error('TikTok download failed.');
    }
}

async function downloadFacebook(url) {
    const api = `https://fbdownloader.online/api/video?url=${encodeURIComponent(url)}`;
    try {
        const res = await axios.get(api);
        return res.data.sd || res.data.hd;
    } catch {
        throw new Error('Facebook download failed.');
    }
}

module.exports = {
    downloadYouTube,
    downloadInstagram,
    downloadTikTok,
    downloadFacebook
};
