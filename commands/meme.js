const axios = require('axios');

async function fetchMemeFromImgflip() {
    try {
        const response = await axios.get('https://api.imgflip.com/get_memes', { timeout: 10000 });
        const imgflipData = response.data;
        if (imgflipData && imgflipData.success && imgflipData.data && imgflipData.data.memes && imgflipData.data.memes.length > 0) {
            const randomIndex = Math.floor(Math.random() * imgflipData.data.memes.length);
            const meme = imgflipData.data.memes[randomIndex];
            if (meme && meme.url) {
                return {
                    url: meme.url,
                    title: meme.name || 'No title available',
                    source: 'From: Imgflip'
                };
            }
        }
        console.error('Imgflip API Error:', imgflipData);
        return null;
    } catch (error) {
        console.error('Error fetching from Imgflip:', error.message);
        return null;
    }
}

async function fetchMemeFromXkcd() {
    try {
        const infoResponse = await axios.get('https://xkcd.com/info.0.json', { timeout: 10000 });
        const latestComicNumber = infoResponse.data.num;
        const randomComicNumber = Math.floor(Math.random() * latestComicNumber) + 1;

        try {
            const comicResponse = await axios.get(`https://xkcd.com/${randomComicNumber}/info.0.json`, { timeout: 10000 });
            const xkcdData = comicResponse.data;
            if (xkcdData && xkcdData.img) {
                return {
                    url: xkcdData.img,
                    title: xkcdData.safe_title || 'Xkcd Comic',
                    source: `From: xkcd.com (${randomComicNumber})`
                };
            }
        } catch (error) {
            console.warn(`Error fetching Xkcd comic ${randomComicNumber}: ${error.message}`);
            return null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching from Xkcd:', error.message);
        return null;
    }
}

async function fetchMemeFromZachl() {
    try {
        const response = await axios.get('https://memes.zachl.tech/api/random', { timeout: 10000 });
        const zachlData = response.data;
        if (zachlData && zachlData.url) {
            return {
                url: zachlData.url,
                title: zachlData.title || 'Meme',
                source: 'From: memes.zachl.tech'
            };
        }
        console.error('memes.zachl.tech API Error:', zachlData);
        return null;
    } catch (error) {
        console.error('Error fetching from memes.zachl.tech:', error.message);
        return null;
    }
}

module.exports = async (sock, sender, text, msg) => {
    try {
        console.log('Meme command triggered (trying Imgflip, Xkcd, and memes.zachl.tech)');

        let meme = await fetchMemeFromImgflip();

        if (!meme) {
            console.log('Failed to get meme from Imgflip, trying Xkcd...');
            meme = await fetchMemeFromXkcd();
        }

        if (!meme) {
            console.log('Failed to get meme from Xkcd, trying memes.zachl.tech...');
            meme = await fetchMemeFromZachl();
        }

        if (!meme) {
            console.error('Failed to fetch meme from all APIs.');
            await sock.sendMessage(sender, { text: '❌ Failed to fetch a meme from any source. Please try again later. ☘️Ⓜ️' });
            return;
        }

        await sock.sendMessage(sender, {
            image: { url: meme.url },
            caption: `😂 *Here's your meme!* ☘️\n\n${meme.title}\n🌐 ${meme.source} ☘️Ⓜ️`
        });

    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(sender, { text: '❌ Something went wrong while fetching the meme. Please try again later. ☘️' });
    }
};