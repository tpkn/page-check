# Page Check
Webpage tester based on Puppeteer and Node.js



Module runs your webpage, app or banner within virtual browser. While running, it registers next few things:
- javascript errors (including errors inside `onresize` handler)
- missing files
- console events (`log`, `warn`, etc.)
- requests to a different hosts



## Installation
```bash
npm install page-check
```



## API

### PageCheck(input[, options])

### input   
**Type**: _String_ | _Array_   


### options.timeout 
**Type**: _Number_   
**Default**: `60`     
Keep checking for this amout of seconds


### options.clones
**Type**: _Boolean_   
**Default**: `false`     
If set to `false`, the same errors will be removed from the list


### options.filter   
**Type**: _Function_     
This function will be used by `Array.filter()` to filter final list of errors.     
For example we could leave only `js errors` and `external request`:    

Here is the codes for quick filtering:

| Code | Event |
| :------: | ------ |
| 1 | page error |
| 2 | failed request |
| 3 | external request |
| 6 | console.log |
| 7 | console.error |
| 8 | console.warn, console.info ... |
| 9 | dialog, alert ... | 
| 10 | not existing page or any else errors | 



### options.viewport    
**Type**: _Object_   
**Default**: `{ width: 1000, height: 600 }`  


### options.screenshot    
**Type**: _Boolean_   
**Default**: `false`  


### options.screenshot.delay    
**Type**: _Number_   
**Default**: `3`  
Wait for this number of seconds before taking a screenshot


### options.headless    
**Type**: _Boolean_     
**Default**: `true`  


### options.devtools    
**Type**: _Boolean_   
**Default**: `false`  




## Usage
```javascript
const PageCheck = require('page-check');

let results = await PageCheck('http://localhost/page', {
   timeout: 15, 
   filter: err => /[1234]/.test(err.code), 
   screenshot: {
      delay: 5,
      path: `./screenshots/${Date.now()}.png`
   }
});

console.log(results);
```




## Output
```
{
  "input": "http://localhost/test",
  "screenshot": <Buffer>,
  "errors": [
    {
      "code": 3,
      "type": "external request",
      "details": "http://domain.com/favicon.ico"
    },
    {
      "code": 6,
      "type": "console.log",
      "details": "Boop!"
    },
    {
      "code": 7,
      "type": "console.error",
      "details": "Failed to load resource: the server responded with a status of 404 (Not Found)"
    }
  ]
}
```





## Changelog 
#### v3.0.0 (2018-11-11):
- `input` argument now could be only a `String`
- now you can take a screenshot of the testing page

#### v2.1.1 (2018-09-21):
- fixed `Unhandled promise rejection` when the browser was closing but 'setViewport' keep firing

#### v2.1.0 (2018-08-30):
- `input` now could be an array of links that would be auto queued

#### v2.0.0 (2018-08-26):
- moved from unmaintained PhantomJS to Puppeteer




