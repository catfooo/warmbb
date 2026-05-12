// for warming server

const express = require("express");
const cheerio = require("cheerio");

const app = express();

// all route warm
async function warmAllRoutes() {
  const visited = new Set();
  const queue = ["/"];

  while (queue.length) {
    const route = queue.shift();

    if (visited.has(route)) continue;
    visited.add(route);

    try {
      console.log("Warming:", route);

      // // Warm your translated route (fills cache)
      // await fetch(`https://barentsburg.onrender.com${route}`);
      // Warm route and mark as warm request
await fetch(`https://barentsburg.onrender.com${route}?warm=1`);

      // Crawl original site to find more internal links
      const res = await fetch(`https://goarctica.com${route}`);
      const html = await res.text();

      const $ = cheerio.load(html);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');

        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.includes('#') &&
          !visited.has(href)
        ) {
          queue.push(href);
        }
      });

      // small delay to avoid hammering server
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.log("Warm failed:", route, err.message);
    }
  }

  console.log("Finished warming all routes");
}

// loop warm
// async function warmLoop() {
//   console.log("Starting warm cycle...");

//   await warmAllRoutes();

//   // console.log("Warm cycle finished. Restarting immediately...");

//   // setImmediate(warmLoop);

//   console.log("Warm cycle finished. Sleeping 5 min...");

//     // wait before re-warming
//     await new Promise(r => setTimeout(r, 5 * 60 * 1000));
// }
// async function warmLoop() {
//   while (true) {
//     console.log("Starting warm cycle...");

//     await warmAllRoutes();

//     // console.log("Warm cycle finished. Sleeping 5 min...");

//     // await new Promise(r => setTimeout(r, 5 * 60 * 1000));

//     // warm loop sleep 23 hr
//     console.log("Warm cycle finished. Sleeping 23 hours...");

// await new Promise(r => setTimeout(r, 23 * 60 * 60 * 1000));
//   }
// }
//warmloop starts at 4am kst
async function warmLoop() {
  while (true) {
    const now = new Date();

    // Current time in Korea (UTC+9)
    const koreaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );

    // Next 4:00 AM Korea time
    const nextWarm = new Date(koreaNow);
    nextWarm.setHours(4, 0, 0, 0);

    if (koreaNow >= nextWarm) {
      nextWarm.setDate(nextWarm.getDate() + 1);
    }

    const msUntilWarm = nextWarm - koreaNow;

    console.log(
      `Next warm scheduled for Korea 4:00 AM in ${Math.round(msUntilWarm / 1000 / 60)} minutes`
    );

    await new Promise(r => setTimeout(r, msUntilWarm));

    console.log("Starting scheduled warm cycle (Korea 4AM)...");
    await warmAllRoutes();
  }
}


const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log("Server running");
//   //warmAllRoutes();
//   warmLoop();
// });
// app.listen(PORT, async () => {
//   console.log("Server running");
//   // //warmAllRoutes();
//   // warmLoop();

//   await warmAllRoutes(); // immediate startup warm
//   warmLoop();            // then daily at 4AM Korea
// });
//right after server restart, startup warm makes server busy
app.listen(PORT, () => {
  console.log("Server running");

  // Start daily scheduler immediately
  warmLoop();

  // // Delayed startup warm after 5 minutes
  // setTimeout(async () => {
  //   try {
  //     console.log("Starting delayed startup warm...");
  //     await warmAllRoutes();
  //   } catch (err) {
  //     console.log("Startup warm failed:", err.message);
  //   }
  // }, 5 * 60 * 1000);
});

// // better to do this at this side instead???
// if (process.env.NODE_ENV === "production") {
//   setInterval(() => {
//     fetch("https://barentsburg.onrender.com")
//       .then(() => console.log("keep-alive ping"))
//       .catch(err => console.log("ping error:", err.message));
//   }, 5 * 60 * 1000);
// }