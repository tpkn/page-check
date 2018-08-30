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


function PageCheck(pages_list, options){
   return new Promise(async (resolve, reject) => {
      try {

         let results_list = [];
         let current_test = {};

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
            viewport: { width: 1000, height: 600 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
         })


         // Js errors
         page.on('pageerror', err => {
            let msg = err.message.replace(/([\n\r\t]|\s{2,})+/g, ' ');
            if(clones || !isClone(current_test.errors, msg)){
               current_test.errors.push({code: 1, type: 'page error', details: msg});
            }
         });

         // Failed requests
         page.on('requestfailed', req => {
            let url = req.url();
            if(clones || !isClone(current_test.errors, url)){
               current_test.errors.push({code: 2, type: 'failed request', details: url});
            }
         });

         // Is same host request
         page.on('request', req => {
            let url = req.url();
            if(url.indexOf(current_test.url) == -1){
               current_test.errors.push({code: 3, type: 'external request', details: url});
            }
            req.continue();
         });

         // Console
         page.on('console', msg => {
            let type = msg.type();
            let message = msg.text();
            let code = type === 'log' ? 6 : type === 'error' ? 7 : 8;
            if(clones || !isClone(current_test.errors, message)){
               current_test.errors.push({code: code, type: 'console.' +  type, details: message});
            }
         });

         // Alerts and stuff
         page.on('dialog', async dialog => {
            let msg = dialog.message();
            if(clones || !isClone(current_test.errors, msg)){
               current_test.errors.push({code: 9, type: 'dialog', details: msg});
            }
            await dialog.dismiss();
         });



         /**
          * Building checking queue
          */
         for(let i = 0, len = pages_list.length; i < len; i++){
            try{

               let item = pages_list[i]

               // Reset current test data collector
               current_test = { url: item, errors: [] };

               await page.goto(item, { waitUntil: 'networkidle2', timeout: 45000 });
               
               // Resize viewport to catch errors inside 'onresize' handlers
               let rid = setInterval(async function(){
                  await page.setViewport({width: Math.floor(Math.random() * 1000), height: 250});
               }, 200);

               // Timeout before next page test
               await page.waitFor(timeout * 1000);

               clearInterval(rid);

            }catch(err){
               current_test.errors = [{code: 10, type: 'server error', details: err.message}];
            }


            // Sort errors by code
            current_test.errors.sort((a, b) => a.code - b.code);
            
            // Apply users filter
            if(typeof options.filter === 'function'){
               current_test.errors = current_test.errors.filter(options.filter);
            }

            results_list.push(current_test);
         }


         /**
          * Finish checking
          */
         await browser.close();
         resolve(results_list)

      }catch(err){
         reject(err);
      }
   });
}

module.exports = PageCheck;
