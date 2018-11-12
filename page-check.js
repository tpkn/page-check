/*!
 * Page Check, http://tpkn.me/
 */
const Url = require('url');
const path = require('path');
const puppeteer = require('puppeteer');

async function PageCheck(input, options){
   let rid;
   let resize_interval = 0.5; //sec
   let results = { input: input, errors: [] };

   let browser, pages, page;

   try {

      /**
       * Options
       */
      let timeout = typeof options.timeout === 'number' ? options.timeout : 60;
      let viewport = typeof options.viewport === 'object' ? options.viewport : { width: 1000, height: 600 };
      let headless = typeof options.headless !== 'undefined' ? options.headless : false;
      let devtools = typeof options.devtools !== 'undefined' ? options.devtools : false;
      let clones = typeof options.clones !== 'undefined' ? options.clones : false;
      let screenshot = typeof options.screenshot !== 'undefined' ? options.screenshot : false;
      let screenshot_delay = typeof screenshot.delay === 'number' ? screenshot.delay : 3;
      let screenshot_config = {};
      let screenshot_path = typeof screenshot.path === 'string' ? screenshot_config.path = screenshot.path : {};


      /**
       * Chromium stuff
       */
      browser = await puppeteer.launch({ headless: headless, devtools: devtools });
      pages = await browser.pages();
      page = pages[0];

      await page.setRequestInterception(true);
      await page.bringToFront();
      page.emulate({
         viewport: viewport,
         userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
      })


      /**
       * Page events listeners
       */
      // Js error?
      page.on('pageerror', err => { 
         let msg = err.message.replace(/([\n\r\t]|\s{2,})+/g, ' ');
         
         if(clones || !isClone(results.errors, msg)){
            results.errors.push({code: 1, type: 'page error', details: msg});
         }
      });

      // Failed request?
      page.on('requestfailed', req => {
         let url = req.url();
         
         if(clones || !isClone(results.errors, url)){
            results.errors.push({code: 2, type: 'failed request', details: url});
         }
      });

      // Request to the same host?
      page.on('request', req => {
         let url = req.url();
         let url_host = Url.parse(url).host;
         let input_host = Url.parse(results.input).host;

         if(url_host !== input_host && !/^data\:(image|text)/i.test(url)){
            results.errors.push({code: 3, type: 'external request', details: url});
         }

         req.continue();
      });

      // Console?
      page.on('console', msg => {
         let type = msg.type();
         let message = msg.text();
         // Split 'log' and 'error' into different groups
         let code = type === 'log' ? 6 : type === 'error' ? 7 : 8;
         
         if(clones || !isClone(results.errors, message)){
            results.errors.push({code: code, type: 'console.' +  type, details: message});
         }
      });

      // Alerts and stuff like that?
      page.on('dialog', async dialog => {
         let msg = dialog.message();
         
         if(clones || !isClone(results.errors, msg)){
            results.errors.push({code: 9, type: 'dialog', details: msg});
         }
         
         await dialog.dismiss();
      });


      // Do something after closing browser
      browser.on('disconnected', function(){
         clearInterval(rid);
      })


      /**
       * Watch the content
       * It could be http link or...
       */
      try {

         if(/^https?\:\/\//i.test(input)){
            await page.goto(input, { waitUntil: 'networkidle2', timeout: 45000 });
         }else{
            throw new Error('Invalid input. Must be a link for now!');
            
            // await page.goto('data:text/html,' + input, { waitUntil: 'networkidle2', timeout: 45000 });
            // await page.setContent(input);
         }


         // Resize viewport to catch errors inside 'onresize' handlers
         rid = setInterval(resizeViewport, resize_interval * 1000, page, viewport);


         // Take a screenshot
         if(screenshot){
            setTimeout(async () => {

               if(!page.isClosed()){
                  // Back viewport size to normal size and stop further resizing
                  clearInterval(rid);
                  await page.setViewport(viewport);

                  let screenshot_buffer = await page.screenshot(screenshot_config);
                  if(screenshot_buffer){
                     results.screenshot = screenshot_buffer;
                  }

                  // Keep resizing viewport again
                  rid = setInterval(resizeViewport, resize_interval * 1000, page, viewport);
               }

            }, screenshot_delay * 1000);
         }

      }catch(err){
         results.errors = [{code: 10, type: 'server error', details: err.message}];

         await browser.close();
         return results;
      }


      // Sort and filter results
      results.errors.sort((a, b) => a.code - b.code);

      // Apply users filter
      if(typeof options.filter === 'function'){
         results.errors = results.errors.filter(options.filter);
      }


      /**
       * Finish
       */
      await page.waitFor(timeout * 1000);
      await browser.close();
      return results;

   }catch(err){
      await browser.close();
      return err;
   }
}

/**
 * Check for repeating errors
 * 
 * @param  {Array}  list
 * @param  {String}  error
 * @return {Boolean}
 */
function isClone(list, error){
   for(let i = 0, len = list.length; i < len; i++){
      if(list[i].details == error){
         return true;
      }
   }
   return false;
}

/**
 * Set random size to the page viewport
 * 
 * @param   {Object}  page
 * @param   {Object}  viewport
 */
async function resizeViewport(page, viewport){
   if(!page.isClosed()){
      await page.setViewport({
         width: viewport.width - Math.round(Math.random() * 2), 
         height: viewport.height
      });
   }
}

module.exports = PageCheck;
