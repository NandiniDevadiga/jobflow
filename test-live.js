const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Data%20Analyst%20fresher&location=Mumbai&start=0';
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const $ = cheerio.load(res.data);
    console.log('Cards found:', $('.base-card').length);
    $('.base-card').slice(0, 5).each((i, el) => {
      const title = $(el).find('.base-search-card__title').text().trim();
      const comp = $(el).find('.base-search-card__subtitle').text().trim();
      const link = $(el).find('.base-card__full-link').attr('href') || $(el).find('a').attr('href');
      console.log(`[${i}] ${title} at ${comp}`);
      console.log(`     LINK: ${link ? link.split('?')[0] : 'none'}`);
    });
  } catch (e) {
    console.error('ERR:', e.message);
  }
}

test();
