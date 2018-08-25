/*!
 * Page Check, http://tpkn.me/
 */

const path = require('path');
const puppeteer = require('puppeteer');


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


function PageCheck(link, options){
   return new Promise(async (resolve, reject) => {
      try {

         let errors = [];

         let timeout = typeof options.timeout === 'number' ? options.timeout : 60;
         let headless = typeof options.headless !== 'undefined' ? options.headless : true;
         let devtools = typeof options.devtools !== 'undefined' ? options.devtools : false;
         let clones = typeof options.clones !== 'undefined' ? options.clones : false;


         const browser = await puppeteer.launch({ headless: headless, devtools: devtools });
         const pages = await browser.pages();
         const page = pages[0];

         await page.bringToFront();
         await page.setRequestInterception(true);

         page.emulate({
            viewport: { width: 1500, height: 1000 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
         })


         // Js errors
         page.on('pageerror', err => {
            let msg = err.message.replace(/([\n\r\t]|\s{2,})+/g, ' ');
            if(clones || !isClone(errors, msg)){
               errors.push({code: 1, type: 'page error', details: msg});
            }
         });

         // Is same host request
         page.on('request', req => {
            let url = req.url();
            if(url.indexOf(link) == -1){
               errors.push({code: 3, type: 'external request', details: url});
            }
            req.continue();
         });

         // Failed requests
         page.on('requestfailed', req => {
            let url = req.url();
            if(clones || !isClone(errors, url)){
               errors.push({code: 2, type: 'failed request', details: url});
            }
         });

         // Console
         page.on('console', msg => {
            let type = msg.type();
            let message = msg.text();
            let code = type === 'log' ? 4 : type === 'error' ? 6 : 5;
            if(clones || !isClone(errors, message)){
               errors.push({code: code, type: 'console.' +  type, details: message});
            }
         });

         // Alerts and stuff
         page.on('dialog', async dialog => {
            let msg = dialog.message();
            if(clones || !isClone(errors, msg)){
               errors.push({code: 7, type: 'dialog', details: msg});
            }
            await dialog.dismiss();
         });


         await page.goto(link, { waitUntil: 'networkidle2' });


         // Resize viewport to catch errors inside 'onresize' handlers
         let rid = setInterval(async function(){
            await page.setViewport({width: Math.floor(Math.random() * 1000), height: 250});
         }, 500);


         // Lets wait for a while...
         aid = setTimeout(async () => {
            clearInterval(rid);

            errors.sort((a, b) => a.code - b.code);
            
            if(typeof options.filter === 'function'){
               errors = errors.filter(options.filter);
            }

            resolve(errors);

            await browser.close();

         }, timeout * 1000);


      }catch(err){
         reject(err);
      }

   });
}

module.exports = PageCheck;
