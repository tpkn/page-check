/*!
 * Page Check (v1.0.1.20180227), http://tpkn.me/
 */

const path = require('path');
const phantomjs = require('phantom');


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

function PageCheck(link, options, timeout = 60){
   return new Promise((resolve, reject) => {
      let rid, aid, phantom, page, errors = [];

      let no_clones = typeof options.no_clones !== 'undefined' ? options.no_clones : false;

      if(typeof options === 'number'){
         timeout = options;
      }

      phantomjs.create()
      .then(ph => {
         phantom = ph;
         return phantom.createPage();
      })
      .then(pg => {
         page = pg;

         // Js error
         page.on('onError', (err, trace) => {
            if(trace && trace.length){
               trace.forEach(t => {
                  if(!no_clones || !isClone(errors, err)){
                     errors.push({code: 1, type: 'js error', details: err, line: 'line ' + t.line});
                  }
               });
            }
         });

         // Missing files
         page.on('onResourceError', (resourceError) => {
            errors.push({code: 2, type: 'missing file', details: resourceError.errorString, line: ''});
         });

         // Console
         page.on('onConsoleMessage', (msg, lineNum, sourceId) => {
            if(!no_clones || !isClone(errors, msg)){
               errors.push({code: 3, type: 'console', details: msg, line: typeof lineNum === 'undefined' ? '' : lineNum});
            }
         });

         // External files
         page.on('onResourceRequested', (requestData, networkRequest) => {
            if(requestData.url.indexOf(link) == -1){
               errors.push({code: 4, type: 'external request', details: requestData.url, line: ''});
            }
         });

         return page.open(link);
      })
      .then(status => {
         if(status === 'fail'){
            page.close().then(() => {
               phantom.exit();
            });

            reject({status: 'fail', message: 'can\'t open ' + link});
            return;
         }

         // Some error could be inside 'resize' handler
         rid = setInterval(function(){
            let size = Math.floor(Math.random() * 1000);
            page.property('viewportSize', { width: size, height: size });
         }, timeout * 100);


         // Lets wait for a while...
         aid = setTimeout(() => {
            clearInterval(rid);

            page.close().then(() => {
               phantom.exit(0);
            })

            errors.sort((a, b) => a.code - b.code);
            
            if(typeof options.filter === 'function'){
               errors = errors.filter(options.filter);
            }

            resolve({status: 'done', link: link, errors: errors});

         }, timeout * 1000);
      })
      .catch(err => {
         clearTimeout(aid);
         clearInterval(rid);
         phantom.exit(1);

         reject({status: 'fail', message: err.message});
      });
   });
}

module.exports = PageCheck;
