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

### PageCheck(link[, options])

### link   
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


### options.headless    
**Type**: _Boolean_     
**Default**: `true`  


### options.devtools    
**Type**: _Boolean_   
**Default**: `false`  




## Usage
```javascript
const PageCheck = require('page-check');

let queue = [
   'http://localhost/page1', 
   'http://localhost/page2', 
   'http://localhost/page3'
]

let results = await PageCheck(queue, {
   timeout: 3, 
   clones: true,
   filter: err => /[1234]/.test(err.code)
});

console.log(JSON.stringify(results, true, 2));
```




## Output
```
[
  {
    "url": "http://localhost/test",
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
]
```





## Changelog 
#### v2.1.0 (2018-08-30):
- `link` now could be an array of links that would be auto queued

#### v2.0.0 (2018-08-26):
- moved from unmaintained PhantomJS to Puppeteer




